// Azure Function: GitHub OAuth Token Exchange
// POST /api/github-oauth-token
// Expects: { code: string }
// Returns: { access_token: string }

module.exports = async function (context, req) {
    const requestId = `gh-oauth-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const origin = (req.headers && (req.headers.origin || req.headers.Origin)) || '';
    const allowedOrigins = (process.env.GITHUB_OAUTH_ALLOWED_ORIGINS || 'http://localhost:8080').split(',').map(o => o.trim()).filter(Boolean);
    const allowAll = allowedOrigins.includes('*');
    const corsOrigin = allowAll || allowedOrigins.includes(origin) ? origin || allowedOrigins[0] : allowedOrigins[0];
    const baseHeaders = {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin'
    };
    context.res = { headers: baseHeaders }; // default headers for any early return
    context.log('GitHub OAuth token exchange invoked', { requestId, origin, matchedOrigin: corsOrigin });

    if (req.method === 'OPTIONS') {
        context.res.status = 204;
        return;
    }

    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const code = body.code;
    const state = body.state || null;
    if (!code) {
        context.res.status = 400;
        context.res.body = { error: 'Missing code', requestId };
        return;
    }

    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;
    const expectedState = process.env.GITHUB_OAUTH_EXPECT_STATE === '1' ? (body.expectedState || null) : null; // optional future hook

    if (!client_id || !client_secret) {
        context.res.status = 500;
        context.res.body = { error: 'Server not configured for GitHub OAuth', requestId, missing: { client_id: !client_id, client_secret: !client_secret } };
        return;
    }

    // Basic (optional) state check if consumer sends it
    if (expectedState && state && state !== expectedState) {
        context.res.status = 400;
        context.res.body = { error: 'Invalid state parameter', requestId };
        return;
    }

    try {
        const ghRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id, client_secret, code })
        });
        const data = await ghRes.json();
        context.log('GitHub OAuth response', { requestId, status: ghRes.status, hasError: !!data.error });
        if (!ghRes.ok) {
            context.res.status = ghRes.status;
            context.res.body = { error: data.error_description || data.error || 'OAuth exchange failed', requestId };
            return;
        }
        if (data.error) {
            context.res.status = 400;
            context.res.body = { error: data.error_description || data.error, requestId };
            return;
        }
        if (!data.access_token) {
            context.res.status = 502;
            context.res.body = { error: 'No access_token in GitHub response', requestId };
            return;
        }
        context.res.status = 200;
        context.res.body = { access_token: data.access_token, scope: data.scope || null, token_type: data.token_type || 'bearer', requestId };
    } catch (err) {
        context.log.error('GitHub OAuth exchange exception', { requestId, error: err.message });
        context.res.status = 500;
        context.res.body = { error: 'Internal error during token exchange', requestId };
    }
};
