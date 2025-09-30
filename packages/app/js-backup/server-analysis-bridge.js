// Bridge to provide a stable global for server-side template analysis expected by tests.
// Ensures window.TemplateAnalyzer.analyzeTemplateServerSide is callable after initialization.
(function(){
  function ready(fn){ if(document.readyState === 'complete' || document.readyState === 'interactive'){ setTimeout(fn,0); } else { document.addEventListener('DOMContentLoaded', fn); } }

  function attachMethod(instance){
    if(typeof instance.analyzeTemplateServerSide === 'function') return instance;
    instance.analyzeTemplateServerSide = async function(repoUrl, ruleSetOrOptions){
      try {
        var cfg = window.TemplateDoctorConfig || {};
        var ruleSet = 'dod';
        if(typeof ruleSetOrOptions === 'string') ruleSet = ruleSetOrOptions; else if(ruleSetOrOptions && typeof ruleSetOrOptions.ruleSet === 'string') ruleSet = ruleSetOrOptions.ruleSet;
        var apiBase = cfg.apiBase || window.location.origin;
        var endpoint = (window.ApiRoutes && window.ApiRoutes.build) ? window.ApiRoutes.build('analyze-template') : apiBase.replace(/\/$/, '') + '/api/v4/analyze-template';
        var payload = { repoUrl: repoUrl, ruleSet: ruleSet };
        var headers = { 'Content-Type':'application/json' };
        if(cfg.functionKey) headers['x-functions-key'] = cfg.functionKey;
        if(window.GitHubClient && window.GitHubClient.auth && window.GitHubClient.auth.isAuthenticated()) {
          try { var token = window.GitHubClient.auth.getToken(); if(token) headers['Authorization'] = 'Bearer ' + token; } catch(_){ }
        }
        var resp = await fetch(endpoint, { method:'POST', headers: headers, body: JSON.stringify(payload) });
        if(!resp.ok){
          var txt = await resp.text();
          throw new Error('Server-side analysis failed: ' + resp.status + ' ' + resp.statusText + ' - ' + txt);
        }
        var json = await resp.json();
        if(!json.timestamp) json.timestamp = new Date().toISOString();
        return json;
      } catch(e){
        console.error('[server-analysis-bridge] analyzeTemplateServerSide error', e);
        throw e;
      }
    };
    return instance;
  }

  function ensure(){
    var ta = window.TemplateAnalyzer;
    if(!ta){ return false; }
    // If it's a constructor function, instantiate and replace.
    if(typeof ta === 'function') {
      try { ta = new ta(); window.TemplateAnalyzer = ta; } catch(e){ return false; }
    }
    if(!ta || typeof ta !== 'object') return false;
    attachMethod(ta);
    if(!window.analyzeTemplateServerSide){
      window.analyzeTemplateServerSide = function(repoUrl, opts){ return ta.analyzeTemplateServerSide(repoUrl, opts || 'dod'); };
    }
    if(!window.__templateAnalyzerReady){ window.__templateAnalyzerReady = Promise.resolve(ta); }
    return true;
  }

  function poll(maxMs){
    var start = Date.now();
    (function loop(){
      if(ensure()) return;
      if(Date.now() - start > maxMs) { console.warn('[server-analysis-bridge] Timed out waiting for TemplateAnalyzer'); return; }
      setTimeout(loop,50);
    })();
  }

  ready(function(){ poll(5000); });
})();
