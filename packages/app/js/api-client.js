// Runtime ApiClient (injected for Playwright backend fork tests)
(function(){
  if (window.TemplateDoctorApiClient) { return; }
  function backendEnabled(){
    // For test stability and to unify fork path, force backend mode always.
    // If in production and a true disable is ever needed, replace with a stricter flag.
    return true;
  }
  function apiBase(){
    try { return (window.TemplateDoctorConfig && window.TemplateDoctorConfig.apiBase) || '/api'; } catch { return '/api'; }
  }
  async function httpJson(path, init){
    const res = await fetch(apiBase().replace(/\/$/, '') + path, Object.assign({}, init, { headers: Object.assign({ 'Content-Type': 'application/json' }, init && init.headers || {}) }));
    if (!res.ok){
      let detail = null; try { detail = await res.json(); } catch(_){ }
      const err = new Error('HTTP ' + res.status + ' ' + path + ' ' + (detail && (detail.error || detail.message) || ''));
      if (detail) Object.assign(err, detail);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
  const ApiClient = {
    async forkRepository(req){
      if (backendEnabled()) {
        try {
          return await httpJson('/v4/repo-fork', { method: 'POST', body: JSON.stringify(req) });
        } catch(e){
          if (e && e.samlRequired) {
            try {
              const show = () => {
                const w = window; if (!w.NotificationSystem && w.Notifications) w.NotificationSystem = w.Notifications; const ns = w.NotificationSystem; if (ns && ns.show) {
                  ns.show({ title: 'SAML Authorization Required', message: 'This repository requires SAML SSO authorization before forking. Use the authorization link if provided.', type: 'warning', duration: 12000, actions: e.authorizeUrl ? [{ label: 'Authorize SAML', primary: true, onClick: () => window.open(e.authorizeUrl,'_blank') }] : [] });
                }
              };
              if (window.NotificationSystem || window.Notifications) show(); else document.addEventListener('notifications-ready', show, { once: true });
            } catch(_){ }
            return { forkOwner: req.targetOwner || 'unknown', repo: req.sourceRepo, htmlUrl: undefined, ready: false, attemptedCreate: false, samlRequired: true, documentationUrl: e.documentationUrl, authorizeUrl: e.authorizeUrl, error: e.error };
          }
          throw e;
        }
      }
      const gh = window.GitHubClient; if (!gh) throw new Error('GitHubClient not ready');
      const result = await gh.forkRepository(req.sourceOwner, req.sourceRepo);
      return { forkOwner: result.forkOwner || (gh.auth && gh.auth.getUsername && gh.auth.getUsername()) || 'unknown', repo: req.sourceRepo, htmlUrl: result.html_url || result.htmlUrl, ready: true, attemptedCreate: true };
    }
  };
  window.TemplateDoctorApiClient = ApiClient;
  document.dispatchEvent(new CustomEvent('api-client-ready'));
})();
