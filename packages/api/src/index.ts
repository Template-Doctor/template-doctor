// NOTE: Azure Functions v3 model in this project relies on per-directory function.json activation.
// Previous attempt to use the v4 'app' programmable model was reverted because the dependency
// upgrade introduced widespread type changes (Context removed) and would require a coordinated
// refactor across all handlers. We retain this index.ts as a central place for future shared
// initialization logic if/when migrating to v4. For now, it performs no side-effect registrations.

// Import handlers (default exports use alias *Handler for consistency)
// (Handlers imported here previously for programmatic registration; retained only for potential
// future side-effects. Commented out to avoid unused import churn.)
// import runtimeConfigHandler from './functions/runtime-config';
// import handlerAnalyzeTemplate from './functions/analyze-template';
// import githubOauthTokenHandler from './functions/github-oauth-token';
// import archiveCollectionDefault from './functions/archive-collection';
// import submitAnalysisDispatchDefault from './functions/submit-analysis-dispatch';
// import validationTemplateDefault from './functions/validation-template';
// import validationCallbackDefault from './functions/validation-callback';
// import validationStatusDefault from './functions/validation-status';
// import validationCancelDefault from './functions/validation-cancel';
// import addTemplatePrDefault from './functions/add-template-pr';
// import { issueCreateHandler } from './functions/issue-create';
// import { repoForkHandler } from './functions/repo-fork';
// import { batchScanStartHandler, batchScanStatusHandler } from './functions/batch-scan-start';
// import setupHandler from './functions/setup';

// Centralized registrations
// DEBUG MODE: All registrations commented out to isolate syntax/registration issues.
// Re-enable one at a time from the TOP of this block downward, rebuilding and restarting after each.
// (All HTTP function endpoints are activated via their own function.json directories.)
