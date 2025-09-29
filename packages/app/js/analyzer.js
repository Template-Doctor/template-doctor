// analyzer.js removed (Phase 1 migration)
// Production loader stub: authoritative implementation lives in analyzer.bundle.js (TypeScript build).
// This file provides a safe dynamic fallback loader WITHOUT reintroducing legacy logic
// and without throwing in production (avoids breaking any stale script tags).
(function(){
  const BUNDLE = 'analyzer.bundle.js';
  const MSG = '[analyzer.js removed] Loading analyzer.bundle.js (TypeScript build)';
  try { if (console && console.info) console.info(MSG); } catch {}
  // If bundle already flagged as loaded, exit.
  if (window.__TD_ANALYZER_BUNDLE_LOADED__) return;
  // Detect if bundle script already present.
  if ([...document.getElementsByTagName('script')].some(s => (s.getAttribute('src')||'').includes('analyzer.bundle.js'))){
    window.__TD_ANALYZER_BUNDLE_LOADED__ = true; return;
  }
  try {
    const script = document.createElement('script');
    script.src = BUNDLE + '?v=' + (window.__TD_ANALYZER_BUILD_HASH__ || Date.now());
    script.async = true;
    script.onload = () => { window.__TD_ANALYZER_BUNDLE_LOADED__ = true; };
    script.onerror = (e) => { console.error('[analyzer.js removed] Failed to load analyzer bundle', e); };
    document.head.appendChild(script);
  } catch(e){
    console.error('[analyzer.js removed] Dynamic loader failure', e);
  }
})();

// Export a minimal no-op placeholder to avoid ReferenceErrors before bundle initializes.
Object.defineProperty(window, 'TemplateAnalyzer', {
  configurable: true,
  get(){
    console.warn('[analyzer.js stub] TemplateAnalyzer accessed before bundle initialized. Returning undefined placeholder.');
    return undefined;
  },
  set(v){
    // Allow bundle to define real implementation once it loads.
    Object.defineProperty(window, 'TemplateAnalyzer', { value: v, writable: false, configurable: true });
  }
});
