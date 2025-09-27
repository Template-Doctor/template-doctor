import { HttpRequest, Context } from "@azure/functions";
import { loadEnv } from "./env";

export interface HandlerResult {
  status?: number;
  headers?: Record<string,string>;
  body?: any;
}

export type SimpleHandler = (req: HttpRequest, ctx: Context, requestId: string) => Promise<HandlerResult>;

export function wrapHttp(handler: SimpleHandler): (req: HttpRequest, ctx: Context) => Promise<any> {
  return async (req, ctx) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const env = loadEnv();
  const origin = (req.headers && (req.headers['origin'] || req.headers['Origin'])) || '';
    const allowAll = env.GITHUB_OAUTH_ALLOWED_ORIGINS.includes('*');
    const resolvedOrigin = allowAll || env.GITHUB_OAUTH_ALLOWED_ORIGINS.includes(origin) ? (origin || env.GITHUB_OAUTH_ALLOWED_ORIGINS[0]) : env.GITHUB_OAUTH_ALLOWED_ORIGINS[0];
    const baseHeaders: Record<string,string> = {
      'Access-Control-Allow-Origin': resolvedOrigin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin'
    };
    if (req.method === 'OPTIONS') {
      return { status: 204, headers: baseHeaders };
    }
    try {
      const result = await handler(req, ctx, requestId);
      return {
        status: result.status ?? 200,
        headers: { ...baseHeaders, ...(result.headers || {}) },
        body: result.body
      };
    } catch (err: any) {
      ctx.log.error('Unhandled HTTP error', { requestId, error: err?.message });
      return {
        status: 500,
        headers: baseHeaders,
        body: { error: 'Internal Server Error', requestId }
      };
    }
  };
}
