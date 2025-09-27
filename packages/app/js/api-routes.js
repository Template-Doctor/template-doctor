// Centralized API route mapping for versioned backend endpoints.
// Ensures consistent use of /api/v4 prefix and eases future upgrades.
// Usage: const { validationTemplate } = window.ApiRoutes;
(function initApiRoutes(global){
  const prefix = '/api/v4';
  const routes = {
    runtimeConfig: prefix + '/runtime-config',
    validationTemplate: prefix + '/validation-template',
    validationStatus: prefix + '/validation-status',
    validationCancel: prefix + '/validation-cancel',
    workflowTrigger: prefix + '/workflow-trigger',
    workflowRunStatus: prefix + '/workflow-run-status',
    workflowRunArtifacts: prefix + '/workflow-run-artifacts',
    submitAnalysisDispatch: prefix + '/submit-analysis-dispatch',
    addTemplatePr: prefix + '/add-template-pr'
  };
  global.ApiRoutes = routes;
})(window);
