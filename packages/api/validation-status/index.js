const { Octokit } = require('@octokit/rest');

module.exports = async function (context, req) {
  function corsHeaders() {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
  }

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders() };
    return;
  }

  try {
    // Try to get runId from query or cookie
    let runId = req.query.runId || req.params?.runId || req.query.localRunId;
    // TODO(route-cleanup): If we decide to use path params, change the route to
    // validation-status/{runId} in function.json and rely solely on bindingData/params
    // for runId instead of query/cookie fallbacks.
    if (!runId && req.headers && req.headers.cookie) {
      const m = req.headers.cookie.match(/(?:^|;\s*)td_runId=([^;]+)/);
      if (m && m[1]) runId = decodeURIComponent(m[1]);
    }
    if (!runId) {
      context.res = {
        status: 400,
        headers: corsHeaders(),
        body: { error: "Missing required parameter: runId" }
      };
      return;
    }

    // Prefer explicit githubRunId if client provided
    let githubRunId = req.query.githubRunId || null;
    let runUrl = req.query.githubRunUrl || null;

    const [owner, repo] = (process.env.GITHUB_REPOSITORY || "Template-Doctor/template-doctor").split("/");
    const token = process.env.GH_WORKFLOW_TOKEN;
    const branch = process.env.GITHUB_REPO_BRANCH || 'main';
    // The workflow file in this repo is at .github/workflows/validation-template.yml
    const workflowFile = process.env.GITHUB_WORKFLOW_FILE || 'validation-template.yml';

    // Allow unauthenticated fallback for public repos to avoid hard dependency on GH_WORKFLOW_TOKEN in PROD
    let octokit;
    if (token) {
      octokit = new Octokit({ auth: token, userAgent: 'TemplateDoctorApp' });
    } else {
      context.log.warn('GH_WORKFLOW_TOKEN not set; using unauthenticated GitHub API (rate-limited).');
      octokit = new Octokit({ userAgent: 'TemplateDoctorApp' });
    }

    // If we don't have a GitHub run id, try to discover it by correlating run metadata to local runId
    if (!githubRunId) {
      let discoveredRun = null;
      try {
        const runsResp = await octokit.actions.listWorkflowRuns({ owner, repo, workflow_id: workflowFile, branch, event: 'workflow_dispatch', per_page: 50 });
        const candidates = runsResp.data.workflow_runs || [];
        // Prefer most recent first
        for (const r of candidates) {
          const title = r.display_title || r.name || '';
          const commitMsg = (r.head_commit && r.head_commit.message) ? String(r.head_commit.message) : '';
          if ((title && String(title).includes(runId)) || commitMsg.includes(runId)) {
            discoveredRun = r; break;
          }
        }
      } catch (wfErr) {
        context.log.warn(`listWorkflowRuns failed for ${workflowFile}: ${wfErr.message}`);
      }

      if (!discoveredRun) {
        const repoRuns = await octokit.actions.listWorkflowRunsForRepo({ owner, repo, per_page: 50, branch, event: 'workflow_dispatch' });
        const candidates = repoRuns.data.workflow_runs || [];
        for (const r of candidates) {
          const title = r.display_title || r.name || '';
          const commitMsg = (r.head_commit && r.head_commit.message) ? String(r.head_commit.message) : '';
          if ((title && String(title).includes(runId)) || commitMsg.includes(runId)) {
            discoveredRun = r; break;
          }
        }
      }

      if (discoveredRun) {
        githubRunId = discoveredRun.id;
        runUrl = discoveredRun.html_url;
        context.log(`Discovered workflow run ${githubRunId} for local runId ${runId}`);
      } else {
        context.res = {
          status: 200,
          headers: corsHeaders(),
          body: { runId, status: 'pending', conclusion: null }
        };
        return;
      }
    }

    // Fetch the workflow run details
    const runResp = await octokit.actions.getWorkflowRun({ owner, repo, run_id: Number(githubRunId) });
    const ghData = runResp.data;

    context.res = {
      status: 200,
      headers: corsHeaders(),
      body: {
        runId,
        githubRunId,
        status: ghData.status,
        conclusion: ghData.conclusion,
        runUrl: runUrl || ghData.html_url,
        startTime: ghData.run_started_at,
        endTime: ghData.updated_at
      }
    };
  } catch (err) {
    context.log.error("validation-status error:", err);
    
    // Return proper error status code instead of masking errors with 200
    const isGitHubError = err.status || (err.message && err.message.toLowerCase().includes('github'));
    
    context.res = {
      status: isGitHubError ? 502 : 500, // 502 for GitHub API issues, 500 for other errors
      headers: corsHeaders(),
      body: { 
        error: err.message,
        type: isGitHubError ? 'github_api_error' : 'server_error',
        errorCode: isGitHubError ? 'GITHUB_API_ERROR' : 'SERVER_ERROR',
        timestamp: new Date().toISOString()
      }
    };
  }
};
