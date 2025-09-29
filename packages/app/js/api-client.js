// api-client.js removed (TypeScript migration)
// Authoritative client lives in bundled/typed modules. This stub prevents
// accidental reintroduction of legacy global logic.
(function(){
  const msg='[api-client.js removed] Use typed/bundled API client modules';
  try { console.warn(msg); } catch {}
  if (window.TemplateDoctorApiClient) return; // Already set by modern code
  // Provide a minimal lazy getter that warns when accessed before modern client attaches.
  Object.defineProperty(window,'TemplateDoctorApiClient',{configurable:true,get(){
    console.warn('[api-client.js stub] Access before modern client ready. Returning noop.');
    return { request: async ()=>{ throw new Error('API client not initialized'); } };
  },set(v){ Object.defineProperty(window,'TemplateDoctorApiClient',{value:v, writable:false, configurable:true}); }});
})();
