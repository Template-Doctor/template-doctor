import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';

const distFile = path.join(process.cwd(), 'packages/api/dist/functions/validation-template.js');
let handler;

function makeReq(method = 'POST', body = {}) {
  return { method, headers: { 'content-type': 'application/json' }, query: {}, url: 'http://localhost', body };
}
function makeCtx() {
  return { log: { info: () => {}, warn: () => {}, error: () => {} } };
}

describe('validation-template function', () => {
  beforeAll(() => {
    if (!fs.existsSync(distFile)) {
      throw new Error('validation-template dist file missing. Run build first.');
    }
    handler = require(distFile).default || require(distFile);
  });

  it('rejects non-POST requests with 405', async () => {
    const res = await handler(makeReq('GET'), makeCtx());
    expect(res.status).toBe(405);
  });

  it('returns 400 when owner/repo missing', async () => {
    const res = await handler(makeReq('POST', { ownerRepo: '', ruleSet: 'default' }), makeCtx());
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
