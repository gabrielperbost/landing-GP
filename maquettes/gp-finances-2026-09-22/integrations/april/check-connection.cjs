'use strict';

// Run on the server with environment variables loaded from a private location.
// This checks only /products. It creates no project and sends no customer data.
const {createAprilClient} = require('./client.cjs');
const fs = require('node:fs');

async function main() {
  let credentials = {};
  if (process.env.APRIL_CREDENTIALS_FILE) {
    try { credentials = JSON.parse(fs.readFileSync(process.env.APRIL_CREDENTIALS_FILE, 'utf8')); }
    catch { throw Object.assign(new Error(), {code:'APRIL_CREDENTIALS_FILE_INVALID'}); }
    if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials))
      throw Object.assign(new Error(), {code:'APRIL_CREDENTIALS_FILE_INVALID'});
  }
  const client = createAprilClient({
    clientId:process.env.APRIL_CLIENT_ID || credentials.clientId,
    clientSecret:process.env.APRIL_CLIENT_SECRET || credentials.clientSecret,
    environment:'integration',
  });
  const result = await client.getProducts();
  const products = Array.isArray(result) ? result : result?.content;
  if (!Array.isArray(products)) throw Object.assign(new Error(), {code:'APRIL_PRODUCT_FORMAT_TO_CHECK'});
  console.log(JSON.stringify({environment:'integration', connected:true, productCount:products.length}));
}

main().catch(error => {
  const code = typeof error.code === 'string' && /^APRIL_[A-Z_]+$/.test(error.code) ? error.code : 'APRIL_CHECK_FAILED';
  console.error(JSON.stringify({environment:'integration', connected:false, code}));
  process.exitCode = 1;
});
