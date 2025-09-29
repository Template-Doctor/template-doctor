// TypeScript migration of templates-data-loader.js
// Loads template index data only after GitHubAuth reports authenticated state.
// Adds lightweight typings; behavior intentionally unchanged.

// Reuse existing global `ScannedTemplateEntry` from global.d.ts.
// (index-data.js populates window.templatesData with this shape.)

(function(){
  function log(...args: any[]){
    try { console.log('[templates-loader]', ...args); } catch(_) {}
  }

  function dispatchLoaded(){
    document.dispatchEvent(new CustomEvent('template-data-loaded'));
  }

  function showTilesLoadedDebug(count:number){
    try {
      if (typeof document === 'undefined') return;
      const mount = () => {
        let el = document.getElementById('td-tiles-banner');
        if(!el){
          el = document.createElement('div');
          el.id = 'td-tiles-banner';
          el.style.cssText = 'position:fixed;right:12px;bottom:72px;z-index:9999;background:#111827;color:#fff;padding:8px 12px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-family:monospace;font-size:12px;opacity:0.9';
          document.body.appendChild(el);
        }
        const ts = new Date().toLocaleTimeString();
        el.textContent = `Tiles loaded: ${count} @ ${ts}`;
        setTimeout(()=>{ if(el) el.style.opacity = '0.2'; }, 10000);
      };
      if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once:true }); else mount();
    } catch(_) {}
  }

  function loadScript(src:string){
    return new Promise<void>((resolve,reject)=>{
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = ()=> resolve();
      s.onerror = (e)=> reject(e);
      document.head.appendChild(s);
    });
  }

  async function loadTemplateData(){
    log('Loading template data (auth confirmed)');
    const cacheBuster = '?_cb=' + Date.now();
    try {
      await loadScript('results/scan-meta-backfill.js' + cacheBuster).catch(()=>{
        log('scan-meta-backfill.js not found; continuing');
      });
      log('scan-meta-backfill.js processed, loading index-data.js');
      await loadScript('results/index-data.js' + cacheBuster);
      if(Array.isArray(window.templatesData)){
        log('templatesData loaded entries:', window.templatesData.length);
        try { showTilesLoadedDebug(window.templatesData.length); } catch(_){}
      } else {
        log('templatesData missing or invalid, initializing empty array');
        window.templatesData = [];
        try { showTilesLoadedDebug(0); } catch(_){}
      }
    } catch(e){
      log('Failed to load template data scripts', e);
      if(!Array.isArray(window.templatesData)) window.templatesData = [];
      try { showTilesLoadedDebug(0); } catch(_){}
    } finally {
      dispatchLoaded();
    }
  }

  function initialize(){
    log('Checking GitHubAuth readiness');
    if(window.GitHubAuth && typeof window.GitHubAuth.isAuthenticated === 'function'){
      if(window.GitHubAuth.isAuthenticated()){
        loadTemplateData();
      } else {
        log('User not authenticated yet; setting empty templatesData');
        window.templatesData = [];
        dispatchLoaded();
      }
    } else {
      setTimeout(initialize, 100);
    }
  }

  document.addEventListener('auth-state-changed', (e: any)=>{
    try {
      if(e.detail && e.detail.authenticated){
        log('Auth changed to authenticated; loading templates');
        loadTemplateData();
      }
    } catch(_){}
  });

  initialize();
})();
