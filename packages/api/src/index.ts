// Temporarily disabling programmatic registrations to reduce type noise during migration.
// import { app } from "@azure/functions";

// Import handlers (default exports use alias *Handler for consistency)
import runtimeConfigHandler from './functions/runtime-config';
import handlerAnalyzeTemplate from './functions/analyze-template';
import githubOauthTokenHandler from './functions/github-oauth-token';
import archiveCollectionDefault from './functions/archive-collection';
import submitAnalysisDispatchDefault from './functions/submit-analysis-dispatch';
import validationTemplateDefault from './functions/validation-template';
import validationCallbackDefault from './functions/validation-callback';
import validationStatusDefault from './functions/validation-status';
import validationCancelDefault from './functions/validation-cancel';
import addTemplatePrDefault from './functions/add-template-pr';
// ping handler not yet implemented/migrated — left commented intentionally
import { issueCreateHandler } from './functions/issue-create';
import { repoForkHandler } from './functions/repo-fork';
import { batchScanStartHandler, batchScanStatusHandler } from './functions/batch-scan-start';
import setupHandler from './functions/setup';

// Centralized registrations
// DEBUG MODE: All registrations commented out to isolate syntax/registration issues.
// Re-enable one at a time from the TOP of this block downward, rebuilding and restarting after each.
// 1. runtime-config
// app.http('runtime-config', {
// 	methods: ['GET', 'OPTIONS'],
// 	authLevel: 'anonymous',
// 	route: 'v4/client-settings',
// 	handler: runtimeConfigHandler
// });
// 2. analyze-template
// app.http('analyze-template', {
//   methods: ['POST', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/analyze-template',
//   handler: analyzeTemplateHandler
// });
// 3. github-oauth-token
// app.http('github-oauth-token', {
//   methods: ['GET', 'POST', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/github-oauth-token',
//   handler: githubOauthTokenHandler
// });
// 4. archive-collection
// app.http('archive-collection', {
//   methods: ['POST', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/archive-collection',
//   handler: archiveCollectionHandler
// });
// 5. submit-analysis-dispatch
// app.http('submit-analysis-dispatch', {
//   methods: ['POST', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/submit-analysis-dispatch',
//   handler: submitAnalysisDispatchHandler
// });
// 6. validation-template
// app.http('validation-template', {
//   methods: ['POST', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/validation-template',
//   handler: validationTemplateHandler
// });
// 7. validation-callback
// app.http('validation-callback', {
//   methods: ['POST', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/validation-callback',
//   handler: validationCallbackHandler
// });
// 8. validation-status
// app.http('validation-status', {
//   methods: ['GET', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/validation-status',
//   handler: validationStatusHandler
// });
// 9. validation-cancel
// app.http('validation-cancel', {
//   methods: ['POST', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/validation-cancel',
//   handler: validationCancelHandler
// });
// 10. add-template-pr
// app.http('add-template-pr', {
//   methods: ['POST', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/add-template-pr',
//   handler: addTemplatePrHandler
// });

// 11. ping (placeholder; implementation file missing, keep disabled)
// 12. issue-create (added after existing stable endpoints)
// app.http('issue-create', {
//   methods: ['POST', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/issue-create',
//   handler: issueCreateHandler
// });
// 13. repo-fork
// app.http('repo-fork', {
//   methods: ['POST', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/repo-fork',
//   handler: repoForkHandler
// });
// 14. batch-scan-start
// app.http('batch-scan-start', {
//   methods: ['POST', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/batch-scan-start',
//   handler: batchScanStartHandler
// });
// 15. batch-scan-status
// app.http('batch-scan-status', {
//   methods: ['GET', 'OPTIONS'],
//   authLevel: 'anonymous',
//   route: 'v4/batch-scan-status',
//   handler: batchScanStatusHandler
// });