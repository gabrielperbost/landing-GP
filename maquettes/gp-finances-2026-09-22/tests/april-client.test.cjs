const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createAprilClient} = require('../integrations/april/client.cjs');

const json = (value, status = 200) => new Response(JSON.stringify(value), {status, headers:{'content-type':'application/json'}});
const token = () => json({access_token:'synthetic-access-token', token_type:'Bearer', expires_in:3600});
const config = fetchImpl => ({clientId:'synthetic-client', clientSecret:'synthetic-secret', fetchImpl});

test('préproduction par défaut, jeton OAuth réutilisé, seuls tarifs et référentiels exposés', async () => {
  const calls = [];
  const client = createAprilClient(config(async (url, init) => { calls.push({url, init}); return url.endsWith('/token') ? token() : json([]); }));
  await client.getProducts(); await client.getBanks();
  assert.equal(calls.length, 3);
  assert.equal(calls[0].url, 'https://ppr-am-gateway.april.fr/apistore/oauth/token');
  assert.equal(calls[0].init.body, 'grant_type=client_credentials');
  assert.equal(calls[0].init.headers.Authorization, 'Basic ' + Buffer.from('synthetic-client:synthetic-secret').toString('base64'));
  assert.equal(calls[1].url, 'https://ppr-api-gateway.april.fr/borrower/v1/products');
  assert.equal(calls[1].init.headers.Authorization, 'Bearer synthetic-access-token');
  assert.notEqual(calls[1].init.headers['x-projectUuid'], calls[2].init.headers['x-projectUuid']);
  assert.ok(calls.every(c => c.init.redirect === 'error'));
  assert.equal('createProject' in client, false);
  assert.equal('sendQuotation' in client, false);
});
test('identifiants absents et production non autorisée échouent avant tout appel', () => {
  assert.throws(() => createAprilClient(), {code:'APRIL_CREDENTIALS_MISSING'});
  assert.throws(() => createAprilClient({...config(() => {}), environment:'production'}), {code:'APRIL_ENVIRONMENT_NOT_ENABLED'});
  assert.throws(() => createAprilClient({...config(() => {}), environment:'https://example.test'}), {code:'APRIL_ENVIRONMENT_NOT_ENABLED'});
});
test('caractères spéciaux des identifiants OAuth encodés sans altération', async () => {
  let authorization;
  const client = createAprilClient({clientId:'client:one',clientSecret:'s +&:',fetchImpl:async (url,init) => {
    if (url.endsWith('/token')) { authorization=init.headers.Authorization;return token(); }
    return json([]);
  }});
  await client.getProducts();
  assert.equal(Buffer.from(authorization.slice(6),'base64').toString(),'client%3Aone:s+%2B%26%3A');
});
test('requête tarifaire officielle avec échéancier, sans autres effets de bord', async () => {
  const calls = [], request = {$type:'Emprunteur', properties:{}, persons:[], loans:[], products:[]};
  const client = createAprilClient(config(async (url, init) => { calls.push({url, init}); return url.endsWith('/token') ? token() : json([]); }));
  assert.deepEqual(await client.price(request, {pricingType:'Recommendation'}), []);
  assert.equal(calls[1].url, 'https://ppr-api-gateway.april.fr/borrower/v1/projects/prices?pricingType=Recommendation&withSchedule=true');
  assert.equal(calls[1].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].init.body), request);
  assert.throws(() => client.price(request, {pricingType:'Quotation'}), {code:'APRIL_PRICING_REQUEST_INVALID'});
  assert.throws(() => client.getProductReference('../projects', 'professions'), {code:'APRIL_REFERENCE_INVALID'});
  assert.throws(() => client.getProductReference('ADPGenerali', 'documents'), {code:'APRIL_REFERENCE_INVALID'});
});
test('une seule authentification pour des appels simultanés', async () => {
  let count = 0;
  const client = createAprilClient(config(async url => {
    if (url.endsWith('/token')) { count++; await new Promise(r => setTimeout(r, 10)); return token(); }
    return json([]);
  }));
  await Promise.all([client.getProducts(), client.getBanks(), client.getProductReference('ADPGenerali','commissions')]);
  assert.equal(count, 1);
});
test('renouvellement du jeton à expiration et après un rejet 401, sans boucle', async () => {
  let clock = 0, authentications = 0, apiCalls = 0;
  const client = createAprilClient({...config(async url => {
    if (url.endsWith('/token')) { authentications++; return token(); }
    apiCalls++;
    return apiCalls === 2 ? json({}, 401) : json([]);
  }), now:() => clock});
  await client.getProducts(); await client.getBanks();
  assert.equal(authentications, 2); assert.equal(apiCalls, 3);
  clock = 4000000; await client.getProducts(); assert.equal(authentications, 3);
  let rejectedCalls = 0;
  const rejected = createAprilClient(config(async url => { if (url.endsWith('/token')) return token(); rejectedCalls++; return json({},401); }));
  await assert.rejects(rejected.getProducts(), {code:'APRIL_TOKEN_REJECTED'});
  assert.equal(rejectedCalls, 2);
});
test('aucun secret ni corps partenaire dans les erreurs', async () => {
  const client = createAprilClient(config(async () => json({detail:'synthetic-secret upstream body'}, 401)));
  await assert.rejects(client.getProducts(), e => e.code === 'APRIL_AUTH_FAILED' && !JSON.stringify(e).includes('synthetic-secret'));
  const network = createAprilClient(config(async () => { throw new Error('synthetic-secret'); }));
  await assert.rejects(network.getProducts(), e => e.code === 'APRIL_NETWORK_ERROR' && !e.message.includes('synthetic-secret'));
});
test('refus, saturation et panne ne produisent aucun tarif de remplacement', async () => {
  for (const [status, code] of [[403,'APRIL_ACCESS_DENIED'],[429,'APRIL_RATE_LIMITED'],[503,'APRIL_UNAVAILABLE'],[400,'APRIL_REQUEST_REJECTED']]) {
    let calls = 0;
    const client = createAprilClient(config(async url => { if (url.endsWith('/token')) return token(); calls++; return json({messages:[]}, status); }));
    await assert.rejects(client.getProducts(), {code}); assert.equal(calls,1);
  }
});
test('réponses sans contenu, HTML, JSON invalide et jeton incomplet distingués', async () => {
  const empty = createAprilClient(config(async url => url.endsWith('/token') ? token() : new Response(null,{status:204})));
  assert.equal(await empty.getProducts(), null);
  for (const response of [new Response('<html>error</html>',{headers:{'content-type':'text/html'}}), new Response('{',{headers:{'content-type':'application/json'}})]) {
    const client = createAprilClient(config(async url => url.endsWith('/token') ? token() : response));
    await assert.rejects(client.getProducts(), {code:'APRIL_INVALID_RESPONSE'});
  }
  const malformedToken = createAprilClient(config(async () => json({access_token:'missing-type'})));
  await assert.rejects(malformedToken.getProducts(), {code:'APRIL_INVALID_TOKEN_RESPONSE'});
});
test('temps d’attente limité, pas de relance automatique après délai', async () => {
  let calls = 0;
  const client = createAprilClient({...config(async (url, init) => {
    calls++; return new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('abort')), {once:true}));
  }), timeoutMs:10});
  await assert.rejects(client.getProducts(), {code:'APRIL_TIMEOUT'}); assert.equal(calls,1);
});
