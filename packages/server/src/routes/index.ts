import { Router } from 'express';

// Import existing route modules
import { analyzeRouter } from './analyze';
import { authRouter } from './auth';
import { configRouter } from './config';

const apiRouter = Router();

// Register all v4 routes
apiRouter.use(analyzeRouter);
apiRouter.use(authRouter);
apiRouter.use(configRouter);

// TODO: Add remaining routes as they're migrated:
// - validationRouter (validation-template, validation-status, validation-callback, etc.)
// - actionsRouter (action-trigger, action-run-status, action-run-artifacts)
// - issueRouter (issue-create, issue-ai-proxy)
// - repoRouter (repo-fork)
// - archiveRouter (archive-collection)
// - batchRouter (batch-scan-start)
// - setupRouter (setup endpoint)

export default apiRouter;

