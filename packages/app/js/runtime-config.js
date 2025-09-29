// runtime-config.js removed (TypeScript migration)
// Authoritative implementation: src/scripts/runtime-config.ts (bundled via Vite).
// This production stub only preserves a minimal synchronous default so any stale
// script tag will not break early consumers before the TS module initializes.
(function(){
  const msg='[runtime-config.js removed] Using src/scripts/runtime-config.ts (TypeScript source)';
  try { console.warn(msg); } catch {}
  if (!window.TemplateDoctorConfig) {
    window.TemplateDoctorConfig = { apiBase: window.location.origin };
  }
  // Mark migration flag so other shims know not to re-run.
  window.__TD_RUNTIME_CONFIG_MIGRATED__ = true;
})();
