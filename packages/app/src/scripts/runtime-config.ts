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
