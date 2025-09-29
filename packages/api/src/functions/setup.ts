import { wrapHttp } from '../shared/http';
import { loadEnv } from '../shared/env';
import { setOverrides, listOverrides } from '../shared/config-overrides';
import type { Context } from '@azure/functions';

interface SetupBody {
  overrides?: Record<string, unknown>;
  mode?: 'merge' | 'replace'; // reserved for future
}

function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

async function getGitHubUser(token: string): Promise<string | null> {
  try {
    const r = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' }
    });
    if (!r.ok) return null;
    const j = await r.json();
    return (j && j.login) ? j.login : null;
  } catch { return null; }
}

export default wrapHttp(async (req: any, ctx: Context, requestId: string) => {
  const env = loadEnv();
  const allowlist = parseAllowlist(process.env.SETUP_ALLOWED_USERS || env.SETUP_ALLOWED_USERS);
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: cors() };
  }
  if (req.method !== 'POST') {
    return { status: 405, headers: cors(), body: { error: 'Method Not Allowed', requestId } };
  }
  if (!allowlist.length) {
    return { status: 403, headers: cors(), body: { error: 'Setup disabled (no allowlist configured)', requestId } };
  }
  // Auth token from header
  const authHeader: string | undefined = req.headers?.authorization || req.headers?.Authorization;
  const token = authHeader?.replace(/Bearer\s+/i,'').trim() || ''; // must be a GitHub token of an allowed user
  if (!token) {
    return { status: 401, headers: cors(), body: { error: 'Missing bearer token', requestId } };
  }
  const ghLogin = await getGitHubUser(token);
  if (!ghLogin || !allowlist.includes(ghLogin)) {
    ctx.log.warn('setup denied', { requestId, ghLogin });
    return { status: 403, headers: cors(), body: { error: 'Forbidden', requestId } };
  }
  let body: SetupBody = {};
  try { body = (req.body && typeof req.body === 'object') ? req.body : await req.json?.(); } catch {/* ignore */}
  const overrides = body?.overrides || {};
  const { applied, ignored } = setOverrides(overrides);
  ctx.log('setup applied', { requestId, user: ghLogin, appliedKeys: Object.keys(applied) });
  return {
    status: 200,
    headers: cors(),
    body: {
      requestId,
      user: ghLogin,
      applied,
      ignored,
      effective: listOverrides()
    }
  };
});

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
