import { Context } from '@azure/functions';
import { wrapHttp } from '../shared/http';
import { loadEnv } from '../shared/env';
import { createGitHubHelper } from '../shared/githubClient';

interface RequestBody {
  workflowOrgRep?: string; // owner/repo
  workflowRunId?: string | number;
}

export default wrapHttp(async (req: any, ctx: Context, requestId: string) => {
  if (req.method !== 'POST') {
    return { status: 405, body: { error: 'Method Not Allowed', requestId } };
  }

  const body: RequestBody = (req.body && typeof req.body === 'object') ? req.body : {};
  const { workflowOrgRep, workflowRunId } = body;

  if (!workflowOrgRep) {
    return { status: 400, body: { error: 'workflowOrgRep is required', errorType: 'MISSING_PARAMETER', requestId } };
  }
  const parts = workflowOrgRep.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { status: 400, body: { error: 'workflowOrgRep must be in owner/repo format', errorType: 'INVALID_FORMAT', requestId } };
  }
  if (!workflowRunId) {
    return { status: 400, body: { error: 'workflowRunId is required', errorType: 'MISSING_PARAMETER', requestId } };
  }

  const [owner, repo] = parts;
  const env = loadEnv();
  if (!env.GH_WORKFLOW_TOKEN) {
    // Legacy implementation previously allowed unauth fetch; we require token for consistency with other endpoints
    return { status: 500, body: { error: 'Server not configured (missing GH_WORKFLOW_TOKEN)', requestId } };
  }

  try {
    const helper = await createGitHubHelper(ctx, { owner, repo });
    const runIdNum = typeof workflowRunId === 'string' ? parseInt(workflowRunId, 10) : workflowRunId;
    if (!Number.isFinite(runIdNum)) {
      return { status: 400, body: { error: 'workflowRunId must be numeric', errorType: 'INVALID_FORMAT', requestId } };
    }
    ctx.log('action-run-status: fetching workflow run', { owner, repo, runId: runIdNum, requestId });
    const data = await helper.getWorkflowRun(runIdNum);
    return {
      status: 200,
      body: {
        error: null,
        data,
        context: { workflowOrgRep, workflowRunId, requestId }
      }
    };
  } catch (err: any) {
    const status = (err && typeof err.status === 'number') ? err.status : 500;
    const isAuth = status === 401 || status === 403;
    ctx.log.error('action-run-status: error fetching run', { requestId, status, message: err?.message });
    return {
      status: isAuth ? 502 : 500,
      body: { error: 'GitHub workflow run fetch failed', details: err?.message, errorType: 'GITHUB_API_ERROR', requestId }
    };
  }
});
