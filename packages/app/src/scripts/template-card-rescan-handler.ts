// Listens for `template-card-rescan` events (dispatched by template-list.ts) and triggers fresh analysis
// Uses the fork=1 pattern to avoid SAML 403 errors on organization repositories

// Uses the shared ScannedTemplateEntry interface from global.d.ts

/**
 * Handles template rescan requests by triggering a fresh analysis.
 * Uses the fork=1 URL parameter pattern to avoid SAML/SSO authentication issues.
 */
function handleTemplateCardRescan(event: CustomEvent) {
  const tmpl = event.detail?.template as ScannedTemplateEntry | undefined;
  if (!tmpl || !tmpl.repoUrl) {
    console.warn('[template-card-rescan-handler] Missing template or repoUrl in event');
    return;
  }

  const repoUrl = tmpl.repoUrl;
  console.log('[template-card-rescan-handler] Rescanning repository:', repoUrl);

  // Check if forkAndAnalyzeRepo is available (uses fork=1 pattern)
  if (typeof (window as any).forkAndAnalyzeRepo === 'function') {
    console.log('[template-card-rescan-handler] Using forkAndAnalyzeRepo with fork=1 pattern');
    const ruleSet = tmpl.ruleSet || 'dod';
    (window as any).forkAndAnalyzeRepo(repoUrl, ruleSet);
    return;
  }

  // Fallback: use analyzeRepo if available
  if (typeof (window as any).analyzeRepo === 'function') {
    console.log('[template-card-rescan-handler] Using analyzeRepo (fallback)');
    const ruleSet = tmpl.ruleSet || 'dod';
    
    // Manually add fork=1 parameter to avoid SAML issues
    let urlWithFork = repoUrl;
    try {
      if (!/[?#].*fork/i.test(repoUrl)) {
        urlWithFork += (repoUrl.includes('?') ? '&' : '?') + 'fork=1';
      }
    } catch (_) {}
    
    (window as any).analyzeRepo(urlWithFork, ruleSet);
    return;
  }

  // Last resort: use TemplateAnalyzer directly
  if ((window as any).TemplateAnalyzer?.analyzeTemplate) {
    console.log('[template-card-rescan-handler] Using TemplateAnalyzer.analyzeTemplate (last resort)');
    const ruleSet = tmpl.ruleSet || 'dod';
    
    // Manually add fork=1 parameter
    let urlWithFork = repoUrl;
    try {
      if (!/[?#].*fork/i.test(repoUrl)) {
        urlWithFork += (repoUrl.includes('?') ? '&' : '?') + 'fork=1';
      }
    } catch (_) {}
    
    (window as any).TemplateAnalyzer.analyzeTemplate(urlWithFork, ruleSet);
    return;
  }

  console.error('[template-card-rescan-handler] No analysis function available. Cannot rescan.');
  
  // Show error notification if available
  if ((window as any).NotificationSystem?.showError) {
    (window as any).NotificationSystem.showError(
      'Rescan Failed',
      'Analysis system not ready. Please refresh the page and try again.',
      5000
    );
  }
}

// Register the event listener
document.addEventListener('template-card-rescan', handleTemplateCardRescan as EventListener);

console.debug('[TemplateDoctor] template-card-rescan-handler initialized');
