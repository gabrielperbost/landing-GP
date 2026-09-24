const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const routePath = process.argv[2] || path.join(__dirname, '../src/app/api/webinar-avocats/register/route.ts');
const code = ts.transpileModule(fs.readFileSync(routePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
}).outputText;
const missingTable = { code: 'PGRST205', message: 'Could not find the table' };
const payload = { email: 'avocat@example.com', prenom: 'Marie', nom: 'Test', barreau: 'Paris', cabinet: 'Exemple', telephone: '0600000000', consent: 'true' };

function harness(options = {}) {
  const events = { sheet: [], tables: [], emails: [], smtp: [], errors: [] };
  async function send(provider, mail) {
    const type = mail.subject.startsWith('Inscription webinaire') ? 'internal' : 'confirmation';
    events.emails.push({ provider, type, ...mail });
    if (options.failEmails?.includes(type)) throw new Error('Mail provider unavailable');
    return { accepted: [payload.email], rejected: [], messageId: 'test-message' };
  }
  const modules = {
    'next/server': { NextResponse: { json: (data, options = {}) => new Response(JSON.stringify(data), { status: options.status || 200 }) } },
    nodemailer: { createTransport: config => {
      events.smtp.push(config);
      return { sendMail: mail => {
        if (options.smtpUnavailable) throw new Error('connect ETIMEDOUT');
        return send('smtp', mail);
      } };
    } },
    '@/lib/monday': { normalizeEnv: value => value?.trim() || undefined },
    '@/lib/supabase': {
      isSupabaseConfigured: options.supabase !== false,
      supabaseAdmin: { from: table => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({
          data: options.unsubscribed ? { email: payload.email } : null,
          error: options.missingTables ? missingTable : null
        }) }) }),
        upsert: async record => {
          events.tables.push({ table, record });
          return { error: options.missingTables ? missingTable : table === 'webinar_avocats_contacts' ? options.contactsError || null : null };
        }
      }) }
    },
    '@/lib/googleSheetsWebinar': { appendWebinarRegistrationToSheet: async record => {
      events.sheet.push(record);
      if (options.sheetError) throw new Error('Sheet unavailable');
      return options.sheetStored !== false;
    } },
    '@/lib/webinarAvocatsCampaign': { buildWebinarAvocatsEmail: () => ({ subject: 'Confirmation - Webinaire PER pour avocats', html: '<p>Confirmation</p>' }) },
    '@/lib/webinarAvocatsCalendar': { WEBINAR_AVOCATS_MEETING_URL: 'https://example.com/zoom', getWebinarAvocatsCalendarLinks: () => ({ google: 'https://example.com/google', outlook: 'https://example.com/outlook', ics: 'https://example.com/calendar' }) },
    '@/lib/webinarAvocatsTokens': { normalizeWebinarEmail: email => email.trim().toLowerCase() },
    '@/lib/brevoTransactional': {
      getBrevoTransactionalConfig: () => options.brevo === false ? null : { apiKey: 'test-only' },
      sendBrevoTransactionalEmail: mail => send('brevo', mail)
    }
  };
  const module = { exports: {} };
  const context = vm.createContext({
    module, exports: module.exports, Response,
    require: name => { assert.ok(Object.hasOwn(modules, name), 'Unexpected dependency: ' + name); return modules[name]; },
    process: { env: options.smtp === false ? {} : { SMTP_HOST: 'smtp.example.com', SMTP_USER: 'internal@example.com', SMTP_PASS: 'test-only', FROM_EMAIL: 'internal@example.com', INTERNAL_LEADS_EMAIL: 'internal@example.com' } },
    console: { error: (...args) => events.errors.push(args) }
  });
  vm.runInContext(code, context, { filename: routePath });
  return { events, submit: (body = payload) => module.exports.POST({ json: async () => body }) };
}

test('Google Sheets registration sends internal notice and confirmation through Brevo without SMTP', async () => {
  const { submit, events } = harness({ missingTables: true, smtpUnavailable: true });
  const response = await submit();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(events.sheet.length, 1);
  assert.deepEqual(events.emails.map(mail => [mail.provider, mail.type]), [['brevo', 'internal'], ['brevo', 'confirmation']]);
  assert.equal(events.emails[0].to.email, 'internal@example.com');
  assert.equal(events.emails[1].to.email, payload.email);
  assert.ok(events.emails[1].text.includes('Lien de connexion Zoom : https://example.com/zoom'));
  assert.equal(events.smtp.length, 0);
});

test('an internal notification failure does not reject a saved registration or prevent its confirmation', async () => {
  const { submit, events } = harness({ missingTables: true, failEmails: ['internal'] });
  assert.equal((await submit()).status, 200);
  assert.equal(events.emails.at(-1).type, 'confirmation');
  assert.ok(events.errors.some(entry => entry[0] === 'webinar-avocats-internal-notice-failed'));
});

test('a confirmation failure does not reject a saved registration', async () => {
  const { submit, events } = harness({ failEmails: ['confirmation'] });
  assert.equal((await submit()).status, 200);
  assert.ok(events.errors.some(entry => entry[0] === 'webinar-avocats-confirmation-failed'));
});

test('no storage and a failed internal email must not claim a successful registration', async () => {
  const { submit, events } = harness({ missingTables: true, sheetError: true, failEmails: ['internal'] });
  const response = await submit();
  assert.equal(response.status, 500);
  assert.equal((await response.json()).success, false);
  assert.equal(events.emails.filter(mail => mail.type === 'confirmation').length, 0);
});

test('the existing internal email fallback can record a registration when databases are unavailable', async () => {
  const { submit, events } = harness({ missingTables: true, sheetStored: false });
  assert.equal((await submit()).status, 200);
  assert.equal(events.emails[0].type, 'internal');
});

test('missing storage and mail configuration cannot produce success', async () => {
  const { submit } = harness({ supabase: false, sheetStored: false, brevo: false, smtp: false });
  assert.equal((await submit()).status, 500);
});

test('contact synchronization failure does not invalidate the saved registration', async () => {
  const { submit, events } = harness({ contactsError: { code: '42703', message: 'Missing column' }, failEmails: ['internal'] });
  assert.equal((await submit()).status, 200);
  assert.ok(events.tables.some(item => item.table === 'webinar_avocats_registrations'));
  assert.equal(events.emails.filter(mail => mail.type === 'internal').length, 0);
});

test('a suppressed address is rejected before any registration or email is written', async () => {
  const { submit, events } = harness({ unsubscribed: true });
  assert.equal((await submit()).status, 409);
  assert.equal(events.sheet.length, 0);
  assert.equal(events.tables.length, 0);
  assert.equal(events.emails.length, 0);
});

test('invalid submissions have no storage or email side effects', async () => {
  for (const invalid of [{ ...payload, consent: false }, { ...payload, email: 'invalid' }, { ...payload, telephone: '' }]) {
    const { submit, events } = harness();
    assert.equal((await submit(invalid)).status, 400);
    assert.equal(events.sheet.length, 0);
    assert.equal(events.tables.length, 0);
    assert.equal(events.emails.length, 0);
  }
});

test('SMTP fallback keeps connection waits bounded and escapes internal email fields', async () => {
  const { submit, events } = harness({ brevo: false, missingTables: true });
  assert.equal((await submit({ ...payload, cabinet: '<img src=x>' })).status, 200);
  assert.ok(events.smtp.every(config => config.connectionTimeout <= 5000 && config.socketTimeout <= 10000));
  assert.ok(events.emails[0].html.includes('&lt;img src=x&gt;'));
});
