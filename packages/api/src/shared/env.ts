// Central environment validation. Minimal to keep deps low.

export interface AppEnv {
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GH_WORKFLOW_TOKEN?: string;
  GITHUB_OAUTH_ALLOWED_ORIGINS: string[];
  NODE_ENV?: string;
}

let cached: AppEnv | null = null;

export function loadEnv(): AppEnv {
  if (cached) return cached;
  const required: Array<[keyof AppEnv, boolean]> = [
    ['GITHUB_CLIENT_ID', false], // not all endpoints need both at cold start
    ['GITHUB_CLIENT_SECRET', false],
  ];
  const env: AppEnv = {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GH_WORKFLOW_TOKEN: process.env.GH_WORKFLOW_TOKEN,
    GITHUB_OAUTH_ALLOWED_ORIGINS: (process.env.GITHUB_OAUTH_ALLOWED_ORIGINS || 'http://localhost:8080')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    NODE_ENV: process.env.NODE_ENV
  };
  // We do soft validation now; endpoint-specific strict checks happen in handlers.
  for (const [k] of required) {
    // Lazy hard requirement; can be tightened per function
    // if (!env[k]) console.warn(`[env] Optional missing: ${k}`);
  }
  cached = env;
  return env;
}
