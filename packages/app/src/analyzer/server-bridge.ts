// @ts-nocheck
// Combined TypeScript migration of server-analysis-bridge.js and analyzer-server-only-patch.js.
// Attaches analyzeTemplateServerSide and enforces server-only analysis (no client fallback).

(function(){
  function attachServerMethod(instance){
    if(typeof instance.analyzeTemplateServerSide === 'function') return instance;
    instance.analyzeTemplateServerSide = async function(repoUrl, ruleSetOrOptions){
      try {
        var cfg = (window as any).TemplateDoctorConfig || {};
        var ruleSet = 'dod';
        if(typeof ruleSetOrOptions === 'string') ruleSet = ruleSetOrOptions; else if(ruleSetOrOptions && typeof ruleSetOrOptions.ruleSet === 'string') ruleSet = ruleSetOrOptions.ruleSet;
        var apiBase = cfg.apiBase || window.location.origin;
        var endpoint = (window as any).ApiRoutes && (window as any).ApiRoutes.build ? (window as any).ApiRoutes.build('analyze-template') : apiBase.replace(/\/$/, '') + '/api/v4/analyze-template';
        var payload = { repoUrl: repoUrl, ruleSet: ruleSet };
        var headers = { 'Content-Type':'application/json' };
        if(cfg.functionKey) headers['x-functions-key'] = cfg.functionKey;
        if((window as any).GitHubClient && (window as any).GitHubClient.auth && (window as any).GitHubClient.auth.isAuthenticated()) {
          try { var token = (window as any).GitHubClient.auth.getToken(); if(token) headers['Authorization'] = 'Bearer ' + token; } catch(_){ }
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
        console.error('[server-bridge] analyzeTemplateServerSide error', e);
        throw e;
      }
    };
    return instance;
  }

  function enforceServerOnly(instance){
    if(!instance || typeof instance.analyzeTemplateServerSide !== 'function') return false;
    instance.analyzeTemplate = function(repoUrl, ruleSet){ return this.analyzeTemplateServerSide(repoUrl, ruleSet || 'dod'); };
    instance.analyzeTemplateClientSide = function(){ throw new Error('Client-side analysis disabled'); };
    (window as any).TemplateDoctorConfig = (window as any).TemplateDoctorConfig || {};
    (window as any).TemplateDoctorConfig.analysis = (window as any).TemplateDoctorConfig.analysis || {};
    (window as any).TemplateDoctorConfig.analysis.useServerSide = true;
    (window as any).TemplateDoctorConfig.analysis.fallbackToClientSide = false;
    return true;
  }

  function ensure(){
    var ta = (window as any).TemplateAnalyzer;
    if(!ta) return false;
    if(typeof ta === 'function'){
      try { ta = new ta(); (window as any).TemplateAnalyzer = ta; } catch(e){ return false; }
    }
    if(!ta || typeof ta !== 'object') return false;
    attachServerMethod(ta);
    enforceServerOnly(ta);
    if(!(window as any).analyzeTemplateServerSide){
      (window as any).analyzeTemplateServerSide = function(repoUrl, opts){ return ta.analyzeTemplateServerSide(repoUrl, opts || 'dod'); };
    }
    if(!(window as any).__templateAnalyzerReady){ (window as any).__templateAnalyzerReady = Promise.resolve(ta); }
    return true;
  }

  function ready(fn){ if(document.readyState === 'complete' || document.readyState === 'interactive'){ setTimeout(fn,0); } else { document.addEventListener('DOMContentLoaded', fn); } }

  function poll(maxMs){
    var start = Date.now();
    (function loop(){
      if(ensure()) return;
      if(Date.now() - start > maxMs){ console.warn('[server-bridge] Timed out waiting for TemplateAnalyzer'); return; }
      setTimeout(loop,50);
    })();
  }

  ready(function(){ poll(5000); });
})();
