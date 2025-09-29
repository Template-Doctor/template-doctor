// Migrated from js/api-routes.js (behavior preserved) – now typed.

interface ApiRouteBuildOptions {
  versionOverride?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
}

interface TemplateDoctorConfigShape {
  apiBase?: string;
  apiVersion?: string;
  backend?: { apiVersion?: string };
  [k: string]: any; // keep loose until full config typing pass
}

interface ApiRoutesGlobal {
  build: (path: string, options?: ApiRouteBuildOptions) => string;
  currentVersion: () => string | null;
}

(function initApiRoutes(){
  function normalizeBase(rawBase: unknown): string {
    if(!rawBase) return '';
    return String(rawBase).replace(/\/$/,'');
  }

  function getApiBase(): string {
    const cfg: TemplateDoctorConfigShape = (window as any).TemplateDoctorConfig || {};
    if (cfg.apiBase) return normalizeBase(cfg.apiBase);
    const isLocal = ['localhost','127.0.0.1'].includes(window.location.hostname);
    if (isLocal) {
      if (window.location.port === '7071') return 'http://localhost:7071';
      return normalizeBase(window.location.origin);
    }
    return normalizeBase(window.location.origin);
  }

  function getVersionPrefix(path: string, version: string | undefined): string {
    if(!version) return '/api';
    const trimmed = path.replace(/^\//,'');
    if (trimmed.startsWith(`api/${version}/`) || trimmed === `api/${version}`) {
      return '/api';
    }
    return `/api/${version}`;
  }

  function build(path: string, options?: ApiRouteBuildOptions): string {
    const cfg: TemplateDoctorConfigShape = (window as any).TemplateDoctorConfig || {};
    const version: string | undefined = (options && options.versionOverride) || cfg.apiVersion || cfg.backend?.apiVersion || '';
    const trimmed = String(path || '').replace(/^\//,'');
    const prefix = getVersionPrefix(trimmed, version);
    const base = getApiBase();
    let url = `${base}${prefix}/${trimmed}`.replace(/([^:])\/+/, '$1/');
    const query = options && options.query;
    if (query && typeof query === 'object') {
      const qp = Object.entries(query)
        .filter(([,v]) => v !== undefined && v !== null && v !== '')
        .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      if (qp) url += (url.includes('?') ? '&' : '?') + qp;
    }
    return url;
  }

  function currentVersion(): string | null {
    if(!(window as any).TemplateDoctorConfig) return null;
    const cfg: TemplateDoctorConfigShape = (window as any).TemplateDoctorConfig;
    return cfg.apiVersion || cfg.backend?.apiVersion || null;
  }

  (window as any).ApiRoutes = { build, currentVersion } as ApiRoutesGlobal;
})();

export {}; // ensure this file is a module
