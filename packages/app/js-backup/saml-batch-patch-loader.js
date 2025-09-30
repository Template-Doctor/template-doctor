/**
 * Template Doctor SAML/SSO Batch Scan Patch Loader
 * 
 * This script patches the GitHub client and repository URL handling functions 
 * to improve support for SAML/SSO protected repositories in batch scan mode.
 * 
 * Usage:
 * 1. Include this script after the main application scripts
 * 2. It will automatically apply the patches when loaded
 */

(function() {
  function initPatches() {
    console.log('[PatchLoader] Initializing Template Doctor SAML/SSO batch scan patches');
    if (window.__TemplateDoctorPatchesApplied) {
      console.log('[PatchLoader] Patches already applied, skipping');
      return;
    }

    let attempts = 0;
    let lastErrorMsg = null;
    let patchInterval;

    const safeLog = (level, msg, err) => {
      try { (console[level]||console.log)(msg, err||''); } catch(_) {}
    };

    const applyEnhancements = () => {
      attempts++;
      try {
        if (!window.GitHubClient) {
          // Throttle noisy polling logs
            if (attempts === 1 || attempts % 200 === 0) {
              safeLog('debug', `[PatchLoader] Waiting for GitHubClient (attempt ${attempts})`);
            }
          return; // keep polling
        }

        // Patch GitHub client
        try {
          if (window.TemplateDoctorPatches?.patchGitHubClient) {
            const ok = window.TemplateDoctorPatches.patchGitHubClient();
            safeLog('log', `[PatchLoader] GitHubClient patch ${ok ? 'succeeded' : 'failed'}`);
          } else {
            safeLog('warn', '[PatchLoader] GitHubClient patch function not found');
          }
        } catch(e){
          lastErrorMsg = e?.message||String(e);
          safeLog('warn', '[PatchLoader] Error patching GitHubClient', lastErrorMsg);
        }

        // Enhance / establish checkAndUpdateRepoUrl
        try {
          const enhancedFactory = window.TemplateDoctorPatches?.getEnhancedCheckAndUpdateRepoUrl;
          const baseExists = typeof window.checkAndUpdateRepoUrl === 'function';
          if (baseExists && enhancedFactory) {
            if (!window.__originalCheckAndUpdateRepoUrl) {
              window.__originalCheckAndUpdateRepoUrl = window.checkAndUpdateRepoUrl;
              window.checkAndUpdateRepoUrl = enhancedFactory();
              safeLog('log', '[PatchLoader] checkAndUpdateRepoUrl function enhanced for batch mode');
            }
          } else if (!baseExists && enhancedFactory && attempts > 40) {
            // After ~20s (40 * 500ms) create a synthetic base to unblock batch mode
            if (!window.__originalCheckAndUpdateRepoUrl) {
              window.__originalCheckAndUpdateRepoUrl = async function(u){ return u; };
              window.checkAndUpdateRepoUrl = enhancedFactory();
              safeLog('warn', '[PatchLoader] Base checkAndUpdateRepoUrl missing after 20s; installed enhanced fallback');
            }
          } else if (!baseExists) {
            if (attempts === 1 || attempts % 200 === 0) {
              safeLog('warn', '[PatchLoader] checkAndUpdateRepoUrl function not found (still waiting)');
            }
          }
        } catch(e){
          lastErrorMsg = e?.message||String(e);
          safeLog('warn', '[PatchLoader] Error enhancing checkAndUpdateRepoUrl', lastErrorMsg);
        }

        // Enhance batch processing
        try {
          if (window.processBatchUrls && typeof window.processBatchUrls === 'function' && !window.__TD_ProcessBatchUrlsEnhanced) {
            const originalProcessBatchUrls = window.processBatchUrls;
            window.processBatchUrls = async function(urls, options) {
              safeLog('log', '[PatchLoader] Using enhanced batch processing with SAML/SSO handling');
              try {
                const valid = (urls||[]).filter(u => u && u.trim());
                const resolved = await Promise.all(valid.map(async url => {
                  try { return await window.checkAndUpdateRepoUrl(url, true); } catch(e){ safeLog('warn', `[PatchLoader] URL process error for ${url}`, e?.message||e); return url; }
                }));
                return originalProcessBatchUrls.call(this, resolved, options);
              } catch(e){
                safeLog('error', '[PatchLoader] Error in batch processing', e?.message||e);
                return originalProcessBatchUrls.call(this, urls, options);
              }
            };
            window.__TD_ProcessBatchUrlsEnhanced = true;
            safeLog('log', '[PatchLoader] processBatchUrls function enhanced for SAML/SSO handling');
          }
        } catch(e){
          lastErrorMsg = e?.message||String(e);
          safeLog('warn', '[PatchLoader] Error enhancing processBatchUrls', lastErrorMsg);
        }

        window.__TemplateDoctorPatchesApplied = true;
        safeLog('log', '[PatchLoader] All patches applied successfully');
        cleanup();
      } catch(err){
        lastErrorMsg = err?.message || String(err);
        if (attempts === 1 || attempts % 100 === 0) {
          safeLog('warn', `[PatchLoader] Unexpected error (attempt ${attempts})`, lastErrorMsg);
        }
      }

      // Hard cap attempts to prevent runaway intervals (e.g., if GitHubClient never appears)
      if (!window.__TemplateDoctorPatchesApplied && attempts >= 400) { // ~200s at 500ms if not earlier cleared
        safeLog('warn', '[PatchLoader] Giving up after 400 attempts');
        cleanup();
      }
    };

    function cleanup(){
      try { document.removeEventListener('DOMContentLoaded', applyEnhancements); } catch{}
      try { window.removeEventListener('load', applyEnhancements); } catch{}
      try { clearInterval(patchInterval); } catch{}
    }

    try {
      applyEnhancements();
      document.addEventListener('DOMContentLoaded', applyEnhancements);
      window.addEventListener('load', applyEnhancements);
      patchInterval = setInterval(applyEnhancements, 500);
      // legacy safety timeout (kept shorter now – 20s)
      setTimeout(() => {
        if (!window.__TemplateDoctorPatchesApplied) {
          safeLog('warn', '[PatchLoader] Timed out waiting for GitHubClient (20s)');
          cleanup();
        }
      }, 20000);
    } catch(e){
      safeLog('error', '[PatchLoader] Error initializing patches root', e?.message||e);
    }
  }
  initPatches();
})();