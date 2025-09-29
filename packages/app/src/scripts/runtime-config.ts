// TypeScript migration of legacy js/runtime-config.js
// Provides a unified runtime configuration resolver exposed via window.TemplateDoctorConfig
// and helper window.getTemplateDoctorApiBase(). The logic is intentionally a near‑parity
// port with incremental typing and small internal refactors for clarity.

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RuntimeConfig {
  apiBase: string;
  defaultRuleSet: string;
  requireAuthForResults: boolean;
  autoSaveResults: boolean;
  archiveEnabled: boolean;
  archiveCollection: string;
  azureDeveloperCliEnabled: boolean;
  dispatchTargetRepo: string;
  issueAIEnabled: boolean;
  functionKey?: string;
  [k: string]: any; // Allow forwards compatible flags
}

// (No additional global Window augmentation here – rely on declarations in global.d.ts to avoid conflicts.)

const DEFAULTS: RuntimeConfig = {
  apiBase: window.location.origin,
  defaultRuleSet: 'dod',
  requireAuthForResults: true,
  autoSaveResults: false,
  archiveEnabled: false,
  archiveCollection: 'aigallery',
  azureDeveloperCliEnabled: true,
  dispatchTargetRepo: '',
  issueAIEnabled: false,
};

// Pre‑seed so synchronous consumers have a shape.
// Use a typed cast rather than interface augmentation to avoid duplicate declaration conflicts.
const W = window as any;
W.TemplateDoctorConfig = { ...DEFAULTS };

async function loadConfig(): Promise<void> {
  try {
    if (W.ConfigLoader?.loadConfig) {
      const raw = await W.ConfigLoader.loadConfig();
      console.log('[runtime-config.ts] loaded via ConfigLoader');
      assignMapped(raw);
      return;
    }
    // Fallback to direct config.json fetch
    const res = await fetch('config.json', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      console.log('[runtime-config.ts] loaded config.json');
      assignMapped(json);
    } else {
      console.log('[runtime-config.ts] no config.json (status ' + res.status + '), using defaults');
    }
  } catch (err) {
    console.error('[runtime-config.ts] error loading config', err);
  } finally {
    // Ensure helpers exist even on failure
    if (typeof W.getTemplateDoctorApiBase !== 'function') {
      W.getTemplateDoctorApiBase = () => resolveApiBase(W.TemplateDoctorConfig.apiBase);
      sanitizeAndAssign(W.TemplateDoctorConfig);
    }
  }
}

function coerceBoolean(v: any): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (v == null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (!s) return undefined;
  return /^(1|true|yes|on)$/i.test(s);
}

function assignMapped(input: Record<string, any>): void {
  const mapped: Record<string, any> = { ...input };
  // Back compat nested backend
  if (!mapped.apiBase && input.backend?.baseUrl) mapped.apiBase = input.backend.baseUrl;
  if (input.backend?.functionKey) mapped.functionKey = input.backend.functionKey;
  if (input.API_BASE_URL) mapped.apiBase = input.API_BASE_URL;
  if (input.FUNCTION_KEY) mapped.functionKey = input.FUNCTION_KEY;
  if (input.DISPATCH_TARGET_REPO) mapped.dispatchTargetRepo = input.DISPATCH_TARGET_REPO;

  // Feature flags / mappings
  const azureCli = coerceBoolean(input.azureDeveloperCliEnabled ?? input.AZURE_DEVELOPER_CLI_ENABLED);
  if (typeof azureCli === 'boolean') mapped.azureDeveloperCliEnabled = azureCli;
  const issueAI = coerceBoolean(input.issueAIEnabled ?? input.ISSUE_AI_ENABLED);
  if (typeof issueAI === 'boolean') mapped.issueAIEnabled = issueAI;
  const requireAuth = coerceBoolean(input.requireAuthForResults ?? input.REQUIRE_AUTH_FOR_RESULTS);
  if (typeof requireAuth === 'boolean') mapped.requireAuthForResults = requireAuth;
  const autoSave = coerceBoolean(input.autoSaveResults ?? input.AUTO_SAVE_RESULTS);
  if (typeof autoSave === 'boolean') mapped.autoSaveResults = autoSave;
  if (input.defaultRuleSet || input.DEFAULT_RULE_SET) {
    mapped.defaultRuleSet = String(input.defaultRuleSet || input.DEFAULT_RULE_SET).toLowerCase();
  }
  if (typeof input.archiveEnabled === 'boolean') mapped.archiveEnabled = input.archiveEnabled;
  if (typeof input.archiveCollection === 'string') mapped.archiveCollection = input.archiveCollection;

  sanitizeAndAssign(mapped as RuntimeConfig);
}

function resolveApiBase(candidate?: string): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const qp = params.get('apiBase');
    const meta = document.querySelector('meta[name="template-doctor-api-base"]');
    const metaContent = meta?.getAttribute('content');
    const fromConfig = candidate || '';
    let resolved = qp || metaContent || fromConfig || window.location.origin;
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';

    // GitHub hosted guard
    try {
      const externalOptIn = /^(1|true|yes|on)$/i.test(
        params.get('forceExternalApi') || params.get('allowExternalApi') || '',
      );
      let resolvedHost: string | null = null;
      try { resolvedHost = new URL(resolved).host; } catch {}
      const githubHosted = /\.github\.io$/i.test(host) || /github\.com$/i.test(host);
      if (githubHosted && resolvedHost && resolvedHost !== host && !externalOptIn && !isLocal) {
        console.warn('[runtime-config.ts] External apiBase blocked on GitHub-hosted page; falling back to same-origin', { attempted: resolved, host });
        resolved = window.location.origin;
        document.dispatchEvent(new CustomEvent('templatedoctor-apibase-external-blocked', { detail: { attempted: candidate, fallback: resolved } }));
      }
    } catch (guardErr) {
      console.debug('[runtime-config.ts] github-hosted guard skipped', guardErr);
    }

    if (!isLocal && /localhost(:\d+)?/i.test(resolved)) {
      resolved = window.location.origin;
    }
    if (resolved.endsWith('/')) resolved = resolved.slice(0, -1);
    return resolved;
  } catch (e) {
    console.warn('[runtime-config.ts] resolveApiBase failed', e);
    return window.location.origin;
  }
}

function sanitizeAndAssign(partial: Partial<RuntimeConfig>): void {
  const clone: RuntimeConfig = { ...DEFAULTS, ...partial } as RuntimeConfig;
  clone.apiBase = resolveApiBase(clone.apiBase);
  W.getTemplateDoctorApiBase = () => clone.apiBase || DEFAULTS.apiBase;
  W.TemplateDoctorConfig = clone;

  // Probe for CSP/network blockage to fallback if necessary
  setTimeout(() => {
    try {
  const base = W.getTemplateDoctorApiBase();
      if (!base || base === window.location.origin) return;
      const sameHost = (() => { try { return new URL(base).host === window.location.host; } catch { return false; } })();
      if (sameHost) return;
      const probeBase = base.replace(/\/$/, '');
      const versioned = probeBase + (window.ApiRoutes?.runtimeConfig || '/api/v4/runtime-config');
      const probeUrl = versioned + '?csp_probe=' + Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      fetch(probeUrl, { method: 'GET', cache: 'no-store', signal: controller.signal })
        .then(r => { clearTimeout(timeout); if (!r.ok) forceSameOriginFallback(); })
        .catch(() => { clearTimeout(timeout); forceSameOriginFallback(); });
    } catch (e) {
      console.warn('[runtime-config.ts] probe setup failed', e);
    }
  }, 0);
}

function forceSameOriginFallback(): void {
  try {
    const origin = window.location.origin;
  W.TemplateDoctorConfig.apiBase = origin;
  W.getTemplateDoctorApiBase = () => origin;
    console.log('[runtime-config.ts] apiBase fallback ->', origin);
    document.dispatchEvent(new CustomEvent('templatedoctor-apibase-fallback', { detail: { apiBase: origin } }));
  } catch {}
}

// Kick off async load.
loadConfig().catch(() => {
  console.log('[runtime-config.ts] loadConfig failed; defaults in place');
});

export {}; // ensure this file is a module
// Migrated from js/runtime-config.js (behavior preserved) – now typed.

interface BackendConfig {
  baseUrl?: string;
  functionKey?: string;
  apiVersion?: string;
  [k: string]: any; // retain looseness for incremental migration
}

interface RawConfig {
  apiBase?: string;
  apiVersion?: string;
  backend?: BackendConfig;
  functionKey?: string; // flattened convenience
  defaultRuleSet?: string;
  requireAuthForResults?: boolean;
  autoSaveResults?: boolean;
  archiveEnabled?: boolean;
  archiveCollection?: string;
  dispatchTargetRepo?: string;
  features?: Record<string, any>;
  // Environment / alternate naming patterns handled below
  API_BASE_URL?: string;
  FUNCTION_KEY?: string;
  DISPATCH_TARGET_REPO?: string;
  DEFAULT_RULE_SET?: string;
  REQUIRE_AUTH_FOR_RESULTS?: string | number | boolean | null;
  AUTO_SAVE_RESULTS?: string | number | boolean | null;
  [k: string]: any;
}

interface EffectiveConfig extends RawConfig {
  apiBase: string;
  apiVersion: string;
  defaultRuleSet: string;
  requireAuthForResults: boolean;
  autoSaveResults: boolean;
  archiveEnabled: boolean;
  archiveCollection: string;
  dispatchTargetRepo: string;
}

interface TemplateDoctorRuntimeShape {
  lastMode: 'unknown' | 'server' | 'client';
  lastServerAttemptFailed?: boolean;
  fallbackUsed: boolean;
}

(function initRuntimeConfig(){
  const DEFAULTS: EffectiveConfig = {
    apiBase: `${window.location.origin}`,
    apiVersion: 'v4',
    defaultRuleSet: 'dod',
    requireAuthForResults: true,
    autoSaveResults: false,
    archiveEnabled: false,
    archiveCollection: 'aigallery',
    dispatchTargetRepo: ''
  };

  // Preserve any pre-injected (e.g. test) configuration & feature flags instead of clobbering
  const existingCfg: RawConfig = (window as any).TemplateDoctorConfig || {};
  const preservedFeatures = existingCfg.features ? { ...existingCfg.features } : undefined;
  const initial: EffectiveConfig = Object.assign({}, DEFAULTS, existingCfg);
  if (preservedFeatures) {
    (initial as any).features = preservedFeatures; // ensure features survive
  }
  (window as any).TemplateDoctorConfig = initial;
  (window as any).TemplateDoctorRuntime = { lastMode: 'unknown', fallbackUsed: false } as TemplateDoctorRuntimeShape;

  function coerceBooleanLike(v: unknown): boolean | undefined {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'boolean') return v;
    const s = String(v).trim().toLowerCase();
    if (/^(1|true|yes|on)$/i.test(s)) return true;
    if (/^(0|false|no|off)$/i.test(s)) return false;
    return undefined; // ambiguous -> ignore
  }

  function normalizeMapped(cfg: RawConfig, sourceLabel: string): RawConfig {
    const mapped: RawConfig = { ...cfg };
    if (!mapped.apiBase && cfg.backend && typeof cfg.backend.baseUrl === 'string') mapped.apiBase = cfg.backend.baseUrl;
    // Normalize away stale hard-coded local Functions port if present
    if (mapped.apiBase && /localhost:7071/.test(mapped.apiBase) && window.location.port && window.location.port !== '7071') {
      console.log('[runtime-config] normalizing stale apiBase (' + sourceLabel + ')', mapped.apiBase, '->', window.location.origin);
      mapped.apiBase = window.location.origin;
    }
    if (cfg.backend && typeof cfg.backend.functionKey === 'string') mapped.functionKey = cfg.backend.functionKey;
    if (cfg.API_BASE_URL) mapped.apiBase = cfg.API_BASE_URL;
    if (cfg.FUNCTION_KEY) mapped.functionKey = cfg.FUNCTION_KEY;
    if (cfg.DISPATCH_TARGET_REPO) mapped.dispatchTargetRepo = cfg.DISPATCH_TARGET_REPO;
    if (cfg.DEFAULT_RULE_SET) mapped.defaultRuleSet = String(cfg.DEFAULT_RULE_SET).toLowerCase();
    const ra = coerceBooleanLike(cfg.REQUIRE_AUTH_FOR_RESULTS);
    if (ra !== undefined) mapped.requireAuthForResults = ra;
    const as = coerceBooleanLike(cfg.AUTO_SAVE_RESULTS);
    if (as !== undefined) mapped.autoSaveResults = as;
    if (!mapped.apiVersion && mapped.backend?.apiVersion) mapped.apiVersion = mapped.backend.apiVersion;
    return mapped;
  }

  function mergePreservingFeatures(base: EffectiveConfig, extra: RawConfig): EffectiveConfig {
    const merged: EffectiveConfig = Object.assign({}, DEFAULTS, base, extra);
    if ((base as any).features || (extra as any).features) {
      (merged as any).features = Object.assign({}, (base as any).features || {}, (extra as any).features || {});
    }
    return merged;
  }

  async function loadConfig(): Promise<void> {
    try {
      const configLoader = (window as any).ConfigLoader;
      if (configLoader && typeof configLoader.loadConfig === 'function') {
        const raw: RawConfig = await configLoader.loadConfig();
        console.log('[runtime-config] loaded config via ConfigLoader');
        const mapped = normalizeMapped(raw, 'ConfigLoader');
        const current: EffectiveConfig = (window as any).TemplateDoctorConfig || DEFAULTS;
        const merged = mergePreservingFeatures(current, mapped);
        (window as any).TemplateDoctorConfig = merged;
        console.debug('[runtime-config] dispatching template-config-loaded (ConfigLoader path)', { apiBase: (window as any).TemplateDoctorConfig.apiBase });
        document.dispatchEvent(new CustomEvent('template-config-loaded'));
        return;
      }

      const response = await fetch('config.json', { cache: 'no-store' });
      if (response.ok) {
        const cfg: RawConfig = await response.json();
        if (cfg && typeof cfg === 'object') {
          const mapped = normalizeMapped(cfg, 'config.json');
          // Additional direct boolean normalizations (legacy shape already booleans)
          if (typeof cfg.requireAuthForResults === 'boolean') mapped.requireAuthForResults = cfg.requireAuthForResults;
          if (typeof cfg.autoSaveResults === 'boolean') mapped.autoSaveResults = cfg.autoSaveResults;
          if (typeof cfg.archiveEnabled === 'boolean') mapped.archiveEnabled = cfg.archiveEnabled;
          if (typeof cfg.archiveCollection === 'string') mapped.archiveCollection = cfg.archiveCollection;
          if (typeof cfg.dispatchTargetRepo === 'string') mapped.dispatchTargetRepo = cfg.dispatchTargetRepo;
          if (!mapped.apiVersion && mapped.backend?.apiVersion) mapped.apiVersion = mapped.backend.apiVersion;
          const current2: EffectiveConfig = (window as any).TemplateDoctorConfig || DEFAULTS;
          const merged2 = mergePreservingFeatures(current2, mapped);
          (window as any).TemplateDoctorConfig = merged2;
          console.log('[runtime-config] loaded config.json');
          console.debug('[runtime-config] dispatching template-config-loaded (config.json path)', { apiBase: (window as any).TemplateDoctorConfig.apiBase });
          document.dispatchEvent(new CustomEvent('template-config-loaded'));
        } else {
          console.log('[runtime-config] no config.json found, using defaults');
        }
      } else {
        console.warn('[runtime-config] config.json not found (HTTP', response.status, ') using defaults only');
        console.debug('[runtime-config] dispatching template-config-loaded (missing config.json path)');
        document.dispatchEvent(new CustomEvent('template-config-loaded'));
      }
    } catch (error) {
      console.error('[runtime-config] error loading config:', error);
      console.log('[runtime-config] using default configuration');
      // Ensure event so downstream loaders (templates, search) still proceed
      console.debug('[runtime-config] dispatching template-config-loaded (error path)');
      document.dispatchEvent(new CustomEvent('template-config-loaded'));
    }
  }

  loadConfig().catch(() => console.log('[runtime-config] failed to load config, using defaults'));
})();

export {}; // make this a module
