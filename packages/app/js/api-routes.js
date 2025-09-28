// Centralized API route mapping for versioned backend endpoints.
// Ensures consistent use of /api/v4 prefix and eases future upgrades.
// Usage: const { validationTemplate } = window.ApiRoutes;
(function initApiRoutes(global){
  const DEFAULT_VERSION = 'v4';
  function currentVersion(){
    try {
      const cfg = global.TemplateDoctorConfig;
      const v = cfg && cfg.backend && cfg.backend.apiVersion;
      return typeof v === 'string' && /^v\d+$/i.test(v) ? v : DEFAULT_VERSION;
    } catch { return DEFAULT_VERSION; }
  }
  function build(name){
    const v = currentVersion();
    return `/api/${v}/${name}`.replace(/\/+/g,'/');
  }
  const pre = '/api/' + DEFAULT_VERSION;
  const routes = {
    runtimeConfig: pre + '/runtime-config',
  analyzeTemplate: pre + '/analyze-template',
  issueCreate: pre + '/issue-create',
  repoFork: pre + '/repo-fork',
  batchScanStart: pre + '/batch-scan-start',
  batchScanStatus: pre + '/batch-scan-status',
    validationTemplate: pre + '/validation-template',
    validationDockerImage: pre + '/validation-docker-image',
    validationOssf: pre + '/validation-ossf',
    validationStatus: pre + '/validation-status',
    validationCancel: pre + '/validation-cancel',
    workflowTrigger: pre + '/workflow-trigger',
    workflowRunStatus: pre + '/workflow-run-status',
    workflowRunArtifacts: pre + '/workflow-run-artifacts',
    submitAnalysisDispatch: pre + '/submit-analysis-dispatch',
    addTemplatePr: pre + '/add-template-pr',
    build
  };
  global.ApiRoutes = routes;
})(window);
