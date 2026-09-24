const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const file = 'src/app/api/webinar-avocats/campaign/send-batch/route.ts';
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText;
function harness(options = {}) {
  const sent = [];
  const modules = {
    'next/server': {NextResponse: {json: (body, config = {}) => new Response(JSON.stringify(body), {status: config.status || 200})}},
    nodemailer: {createTransport: () => {throw new Error('Unexpected SMTP');}},
    '@/lib/googleSheetsWebinar': {getWebinarParticipantsFromSheet: async () => {
      if (options.sheetError) throw new Error('Sheet unavailable');
      return options.participants === null ? null : options.participants || [];
    }},
    '@/lib/brevoSuppression': {getBrevoSuppression: async () => {if(options.suppressionError) throw Error('Unavailable blocklist'); return {emails:options.blacklisted || [], domains:options.blockedDomains || []};}, isBrevoSuppressed:(email, data)=>data.emails.includes(email)||data.domains.includes(email.split('@')[1])},
    '@/lib/monday': {normalizeEnv: value => value?.trim() || undefined},
    '@/lib/supabase': {isSupabaseConfigured: false, supabaseAdmin: {}},
    '@/lib/webinarAvocatsCampaign': {buildWebinarAvocatsEmail: ({template}) => ({subject: template === 'relance_3d' ? 'J-3 / Webinaire fiscalité PER pour avocats' : 'J-3 - Webinaire PER pour avocats', previewText: 'J-3', html: '<p>Webinaire</p>'})},
    '@/lib/webinarAvocatsTokens': {normalizeWebinarEmail: value => value.trim().toLowerCase(), createWebinarUnsubscribeToken: () => 'test-token'},
    '@/lib/webinarAvocatsCalendar': {WEBINAR_AVOCATS_MEETING_URL: 'https://example.com/zoom?pwd=keep', getWebinarAvocatsCalendarLinks: () => ({google: 'https://example.com/google', outlook: 'https://example.com/outlook', ics: 'https://example.com/ics'})}
  };
  const module = {exports: {}};
  vm.runInNewContext(code, {module, exports: module.exports, require: name => {assert.ok(modules[name], name);return modules[name];}, Response, URL, console,
    process: {env: {CRON_SECRET: 'test-only', BREVO_API_KEY: 'test-only', BREVO_SENDER_EMAIL: 'sender@example.com', WEBINAR_AVOCATS_SEND_ENABLED: 'true'}},
    fetch: async (url, config) => {assert.equal(url, 'https://api.brevo.com/v3/smtp/email');sent.push(JSON.parse(config.body));return new Response(JSON.stringify({messageId: 'test-message-' + sent.length}), {status: 201});}
  }, {filename: file});
  return {sent, post: async (payload, auth = true) => {
    const response = await module.exports.POST(new Request('https://example.com/api/webinar-avocats/campaign/send-batch', {method: 'POST', headers: {'content-type': 'application/json', ...(auth ? {authorization: 'Bearer test-only'} : {})}, body: JSON.stringify({template: 'relance_3d', dryRun: false, confirm: 'SEND_WEBINAR_AVOCATS', ...payload})}));
    return {status: response.status, body: await response.json()};
  }};
}
const row = (email, status) => ({email, status});
const contact = email => ({email});

test('invitation excludes registered, unsubscribed, and the manually excluded lawyer', async () => {
  const h = harness({participants: [row('registered@example.com', 'REGISTERED'), row('removed@example.com', 'unsubscribed')]});
  const emails = ['registered@example.com', 'removed@example.com', 'benjamin.valette@vulpi-avocats.com', 'prospect@example.com'];
  const result = await h.post({contacts: emails.map(contact)});
  assert.equal(result.status, 200);
  assert.equal(result.body.sent, 1);
  assert.deepEqual(h.sent.map(m => m.to[0].email), ['prospect@example.com']);
  assert.ok(h.sent[0].headers['List-Unsubscribe']);
});
test('registered reminder only goes to registered recipients and includes Zoom and agendas in text', async () => {
  const h = harness({participants: [row('registered@example.com', 'registered')]});
  const result = await h.post({template: 'registered_reminder_3d', contacts: ['registered@example.com', 'prospect@example.com'].map(contact)});
  assert.equal(result.body.sent, 1);
  assert.ok(h.sent[0].textContent.includes('https://example.com/zoom?pwd=keep'));
  assert.ok(h.sent[0].textContent.includes('https://example.com/ics'));
  assert.ok(!h.sent[0].textContent.includes('Inscription :'));
});
test('unsubscribe takes priority even if the same person also has a registered row', async () => {
  const h = harness({participants: [row('person@example.com', 'registered'), row('person@example.com', 'unsubscribed')]});
  const result = await h.post({template: 'registered_reminder_3d', contacts: [contact('person@example.com')]});
  assert.equal(result.body.sent, 0);
  assert.equal(h.sent.length, 0);
});
test('unavailable audience prevents all sends', async () => {
  for (const config of [{sheetError: true}, {participants: null}]) {
    const h = harness(config);
    assert.equal((await h.post({contacts: [contact('prospect@example.com')]})).status, 503);
    assert.equal(h.sent.length, 0);
  }
});
test('duplicate normalized emails reject the batch before sending', async () => {
  const h = harness();
  assert.equal((await h.post({contacts: [contact('prospect@example.com'), contact('PROSPECT@example.com')]})).status, 400);
  assert.equal(h.sent.length, 0);
});
test('dry run validates recipients and subject without sending', async () => {
  const h = harness();
  const result = await h.post({dryRun: true, contacts: [contact('prospect@example.com')]});
  assert.equal(result.body.results[0].subject, 'J-3 / Webinaire fiscalité PER pour avocats');
  assert.equal(result.body.results[0].action, 'dry_run');
  assert.equal(h.sent.length, 0);
});
test('authentication and send confirmation are required', async () => {
  const h = harness();
  assert.equal((await h.post({contacts: [contact('prospect@example.com')]}, false)).status, 401);
  assert.equal((await h.post({confirm: '', contacts: [contact('prospect@example.com')]})).status, 400);
  assert.equal(h.sent.length, 0);
});
test('batches cannot exceed 25 recipients', async () => {
  const h = harness();
  assert.equal((await h.post({contacts: Array.from({length: 26}, (_, i) => contact(`person${i}@example.com`))})).status, 400);
  assert.equal(h.sent.length, 0);
});

test('Sophie Greiner stays excluded even when Sheets is unavailable', async () => {
  const h = harness({sheetError: true});
  for (const template of ['relance_3d', 'registered_reminder_3d']) {
    const result = await h.post({template, contacts: [contact('SOPHIE-GREINER@protonmail.com')]});
    assert.equal(result.status, 200);
    assert.equal(result.body.sent, 0);
    assert.equal(result.body.results[0].action, 'skipped_unsubscribed');
  }
  assert.equal(h.sent.length, 0);
});

test('Sophie Greiner is excluded from a mixed invitation batch', async () => {
  const h = harness();
  const result = await h.post({contacts: ['sophie-greiner@protonmail.com', 'prospect@example.com'].map(contact)});
  assert.equal(result.body.sent, 1);
  assert.deepEqual(h.sent.map(m => m.to[0].email), ['prospect@example.com']);
});

test('P. Bremant stays excluded from invitations and registered reminders even with Sheets down', async () => {
  const h = harness({sheetError: true});
  for (const template of ['relance_j0', 'registered_reminder_3d', 'registered_reminder_morning']) {
    const result = await h.post({template, contacts: [contact('BREMANT@bremant-associes.com')]});
    assert.equal(result.status, 200);
    assert.equal(result.body.sent, 0);
    assert.equal(result.body.results[0].action, 'skipped_unsubscribed');
  }
  assert.equal(h.sent.length, 0);
});

test('manual opt-out wins over registration in a mixed reminder batch', async () => {
  const h = harness({participants: [row('bremant@bremant-associes.com', 'registered'), row('registered@example.com', 'registered')]});
  const result = await h.post({template: 'registered_reminder_morning', contacts: ['bremant@bremant-associes.com', 'registered@example.com'].map(contact)});
  assert.equal(result.body.sent, 1);
  assert.deepEqual(h.sent.map(m => m.to[0].email), ['registered@example.com']);
});
