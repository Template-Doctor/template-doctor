// Transitional unified entrypoint for Vite. Mirrors prior index.html script ordering.
// @ts-nocheck removed – incremental typing applied where practical without altering legacy globals.

import '../js/debug-console.js';
// Legacy JS imports removed: api-routes.js, notification-system.js (fully migrated to TS)
// import '../js/api-routes.js'; // removed during Phase 2 cleanup
// import '../js/notification-system.js'; // removed during Phase 2 cleanup
import '../js/notifications.js';
import '../js/notifications-compat.js';
import '../js/notifications-init.js';
// Typed facades (TS) layering on top of legacy implementations
import './notifications/notification-system.ts';
import './notifications/notifications.ts';
// Legacy config-loader.js removed (TS version in scripts/config-loader.ts)
// import '../js/config-loader.js';

// Early CSP/apiBase normalization (previous inline script)
(function(){
  try {
    var host = window.location.hostname;
    var githubHosted = /\.github\.io$/i.test(host) || /github\.com$/i.test(host);
    if (githubHosted) {
      (window as any).TemplateDoctorConfig = (window as any).TemplateDoctorConfig || {};
      (window as any).TemplateDoctorConfig.apiBase = window.location.origin;
      (window as any).getTemplateDoctorApiBase = function(){ return window.location.origin; };
      (window as any).__TD_CSP_FORCED_SAME_ORIGIN__ = true;
    }
  } catch(e) { console.warn('CSP init failed', e); }
})();

import './scripts/runtime-config.ts'; // (replaces legacy ../js/runtime-config.js)
// Legacy auth.js removed (scripts/auth.ts authoritative)
// import '../js/auth.js';
// Replaced legacy github-client-new.js with TS version
import './github/github-client.ts';
// Use TypeScript source directly (legacy bundle removed)
import './scripts/api-client.ts';
import '../js/github-client-patch.js';
import '../js/markdown-renderer.js';
// Legacy dashboard-renderer.js removed (scripts/dashboard-renderer.ts authoritative)
// import '../js/dashboard-renderer.js';
// TS extraction: dashboard data adapter (used by legacy renderer via window.__TD_adaptResultData)
import './dashboard/adapt.ts';
import './dashboard/agents-enrichment.ts';
import './dashboard/category-breakdown.ts';
import './dashboard/overview.ts';
import './dashboard/patch.ts';
// TS migration: report loader
import './report/report-loader.ts';
// TS migration: issue template engine
import './issue/template-engine.ts';
// TS migration: issue service (provides TemplateDoctorIssueService global for tests & UI)
import './scripts/issue-service.ts';
import '../js/issue-ai-provider.js';
import '../js/github-issue-handler.js';
// Direct TS analyzer (was previously bundled)
import './scripts/analyzer.ts';
// New unified TS server analysis bridge (combines bridge + server-only enforcement)
import './analyzer/server-bridge.ts';
import '../js/ruleset-docs/analyzer.js';
// TS migration: templates data loader
import './data/templates-loader.ts';
import '../js/tooltips.js';
import '../js/ruleset-modal.js';
import '../js/github-action-hook.js';
import '../js/azd-provision.js';
import '../js/github-workflow-validation.js';
import '../js/enable-demo-mode.js';
// Transitional TS wrapper for legacy app logic
import './app.ts';
import '../js/action-buttons-fallback.js';
import '../js/action-buttons-direct.js';
import '../js/docs-validation-badge.js';
import '../js/github-fork-patch-fix.js';
import '../js/saml-batch-patch-loader.js';
// New TS batch facade (non-disruptive; wraps legacy processBatchUrls)
import './batch/facade.ts';

// Expose a typed-friendly facade (will refine later)
// Minimal surface typings; deeper analyzer/api client types live in their respective modules.
export const Analyzer: any = (window as any).TemplateAnalyzer;
export const ApiClient: any = (window as any).TemplateDoctorApiClient;

console.log('[vite] main.ts loaded');
// Aggregated entry importing migrated modules.
// ORDER MATTERS for test stability:
// Order adjusted: ensure configuration + auth + GitHub client load BEFORE analyzer so
// server-side analysis has user token and TemplateDataLoader can activate early.
// 1. Notifications (flush queue)
// (Migration placeholder removed: './modules/notifications')
// 2. Config & routes (API base, runtime config)
// (Migration placeholders removed: config-loader, api-routes, runtime-config TS versions)
// 3. Auth & GitHub client BEFORE analyzer (previously analyzer loaded first causing missing token on early server calls)
// (Migration placeholders removed: auth, github-client TS versions)
// 4. Analyzer & bridge
// (Migration placeholder removed: analyzer TS migrated path already covered by legacy bundle)
// Ensure core styles (previously missing in production build) are part of bundle
// Import core legacy CSS assets so they get bundled (fallback if path changes)
const legacyCss = [
	'/css/style.css',
	'/css/templates.css',
	'/css/dashboard.css'
];
legacyCss.forEach(p => {
	try {
		// Vite will treat this as a fetch of a public asset if it exists in root public path
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = p;
		document.head.appendChild(link);
	} catch (e){
		console.warn('[main] unable to append legacy stylesheet', p, e);
	}
});
// (Migration placeholder removed: templates-data-loader TS version)
// Remaining analytic & rendering modules (analyzer already loaded above)
// (Migration placeholders removed: report-loader, dashboard-renderer TS versions)
// Minimal scanned templates renderer shim (temporary until full app.js migration)
// (Removed placeholder imports for yet-to-be-migrated modules.)
// TODO: migrate and add remaining legacy scripts progressively.

// Simple runtime confirmation that the module graph executed.
// This will be removed once migration stabilizes.
console.debug('[TemplateDoctor] main.ts module entry loaded');
