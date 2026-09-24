'use strict';

// Server only. Never import into a browser bundle or expose credentials in HTML.
const {randomUUID} = require('node:crypto');
const ENDPOINTS = Object.freeze({
  integration: Object.freeze({
    api: 'https://ppr-api-gateway.april.fr/borrower/v1/',
    token: 'https://ppr-am-gateway.april.fr/apistore/oauth/token',
  }),
  production: Object.freeze({
    api: 'https://api-gateway.april.fr/borrower/v1/',
    token: 'https://am-gateway.april.fr/apistore/oauth/token',
  }),
});
const REFERENCES = new Set(['professionalCategories', 'professions', 'guarantees', 'commissions', 'projectTypes']);
const PRICING_TYPES = new Set(['Simple', 'Multiple', 'Recommendation']);
const MAX_BYTES = 8 * 1024 * 1024;

class AprilError extends Error {
  constructor(code, status) {
    super(code);
    this.name = 'AprilError';
    this.code = code;
    if (status) this.status = status;
  }
}

function createAprilClient(options = {}) {
  const {clientId, clientSecret, environment = 'integration', allowProduction = false,
    fetchImpl = globalThis.fetch, timeoutMs = 20000, now = Date.now} = options;
  if (!ENDPOINTS[environment] || (environment === 'production' && allowProduction !== true))
    throw new AprilError('APRIL_ENVIRONMENT_NOT_ENABLED');
  if ([clientId, clientSecret].some(value => typeof value !== 'string' || !value.trim() || /[\r\n]/.test(value)))
    throw new AprilError('APRIL_CREDENTIALS_MISSING');
  if (typeof fetchImpl !== 'function' || !Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000)
    throw new AprilError('APRIL_CONFIGURATION_INVALID');
  const endpoints = ENDPOINTS[environment];
  let token, validUntil = 0, pendingToken;

  // Keep upstream bodies and credentials out of thrown errors and logs.
  async function requestJSON(url, init, authentication = false) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {...init, redirect:'error', signal:controller.signal});
      const status = response.status;
      if (!response.ok) {
        if (response.body) await response.body.cancel();
        const code = status === 429 ? 'APRIL_RATE_LIMITED'
          : authentication ? 'APRIL_AUTH_FAILED'
          : status === 401 ? 'APRIL_TOKEN_REJECTED'
          : status === 403 ? 'APRIL_ACCESS_DENIED'
          : status >= 500 ? 'APRIL_UNAVAILABLE' : 'APRIL_REQUEST_REJECTED';
        throw new AprilError(code, status);
      }
      if (status === 204) return null;
      if (!/^application\/(?:[\w.-]+\+)?json(?:;|$)/i.test(response.headers.get('content-type') || '')) {
        if (response.body) await response.body.cancel();
        throw new AprilError('APRIL_INVALID_RESPONSE', status);
      }
      if (!response.body || Number(response.headers.get('content-length') || 0) > MAX_BYTES) {
        if (response.body) await response.body.cancel();
        throw new AprilError('APRIL_INVALID_RESPONSE', status);
      }
      const reader = response.body.getReader(), chunks = [];
      let size = 0;
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_BYTES) { await reader.cancel(); throw new AprilError('APRIL_INVALID_RESPONSE', status); }
        chunks.push(Buffer.from(value));
      }
      try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw new AprilError('APRIL_INVALID_RESPONSE', status); }
    } catch (error) {
      if (error instanceof AprilError) throw error;
      throw new AprilError(controller.signal.aborted ? 'APRIL_TIMEOUT' : 'APRIL_NETWORK_ERROR');
    } finally { clearTimeout(timer); }
  }

  async function accessToken() {
    if (token && now() < validUntil) return token;
    if (pendingToken) return pendingToken;
    pendingToken = (async () => {
      const formEncode = value => new URLSearchParams({v:value}).toString().slice(2);
      const basic = Buffer.from(formEncode(clientId) + ':' + formEncode(clientSecret)).toString('base64');
      const data = await requestJSON(endpoints.token, {
        method:'POST',
        headers:{Authorization:'Basic ' + basic, 'Content-Type':'application/x-www-form-urlencoded', Accept:'application/json'},
        body:new URLSearchParams({grant_type:'client_credentials'}).toString(),
      }, true);
      if (!data || typeof data.access_token !== 'string' || !data.access_token || /[\s]/.test(data.access_token)
        || typeof data.token_type !== 'string' || data.token_type.toLowerCase() !== 'bearer')
        throw new AprilError('APRIL_INVALID_TOKEN_RESPONSE');
      token = data.access_token;
      const seconds = Number(data.expires_in);
      // An absent expiry disables caching. Refresh at least 30 s before expiry.
      validUntil = now() + (Number.isFinite(seconds) && seconds > 30 ? Math.min(seconds - 30, 3600) * 1000 : 0);
      return token;
    })();
    try { return await pendingToken; }
    finally { pendingToken = undefined; }
  }

  async function call(path, method = 'GET', body) {
    const traceId = randomUUID();
    const perform = async () => requestJSON(new URL(path, endpoints.api).href, {
      method,
      headers:{Authorization:'Bearer ' + await accessToken(), Accept:'application/json', 'x-projectUuid':traceId,
        ...(body ? {'Content-Type':'application/json'} : {})},
      ...(body ? {body:JSON.stringify(body)} : {}),
    });
    try { return await perform(); }
    catch (error) {
      // Only retry an explicit rejection of the token, never a timeout or 5xx.
      if (error.code !== 'APRIL_TOKEN_REJECTED') throw error;
      token = undefined; validUntil = 0;
      return perform();
    }
  }

  return Object.freeze({
    environment,
    getProducts: () => call('products'),
    getBanks: () => call('banks'),
    getProductReference(productCode, reference) {
      if (typeof productCode !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(productCode) || !REFERENCES.has(reference))
        throw new AprilError('APRIL_REFERENCE_INVALID');
      return call('products/' + encodeURIComponent(productCode) + '/' + reference);
    },
    price(project, {pricingType = 'Simple'} = {}) {
      if (!project || typeof project !== 'object' || Array.isArray(project) || project.$type !== 'Emprunteur'
        || !PRICING_TYPES.has(pricingType)) throw new AprilError('APRIL_PRICING_REQUEST_INVALID');
      // Return the partner payload, with no invented tariff or fallback discount.
      // A server-side mapper must validate business statuses before any UI display.
      return call('projects/prices?' + new URLSearchParams({pricingType, withSchedule:'true'}), 'POST', project);
    },
  });
}

module.exports = {createAprilClient, AprilError};
