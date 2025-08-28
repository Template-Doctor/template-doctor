const crypto = require('crypto');

module.exports = async function (context, req) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    };
    return;
  }
  
  try {
    // Accept both parameter formats for flexibility
    const { targetRepoUrl, templateUrl, callbackUrl } = req.body || {};
    // Use targetRepoUrl if provided, otherwise fall back to templateUrl
    const repoUrl = targetRepoUrl || templateUrl;
    
    context.log('validate-template triggered with:');
    context.log(`targetRepoUrl: ${targetRepoUrl}`);
    context.log(`templateUrl: ${templateUrl}`);
    context.log(`Using repoUrl: ${repoUrl}`);
    context.log(`callbackUrl: ${callbackUrl || 'not provided'}`);
    
    if (!repoUrl) {
      context.log.warn('Missing required parameter: targetRepoUrl or templateUrl');
      context.res = { 
        status: 400, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: { error: "targetRepoUrl or templateUrl is required" } 
      };
      return;
    }

    const runId = crypto.randomUUID();

    const owner = "Template-Doctor";
    const repo = "template-doctor";
    const workflowFile = "validate-template.yml";
    const token = process.env.GH_WORKFLOW_TOKEN;
    if (!token) throw new Error("Missing GH_WORKFLOW_TOKEN app setting");

    const ghUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflowFile)}/dispatches`;

    const payload = {
      ref: "main",
      inputs: {
        target_validate_template_url: repoUrl,
        callback_url: callbackUrl || "",
        run_id: runId,
        customValidators: "azd-up,azd-down"  // Only run azd-up and azd-down validators
      }
    };

    context.log("Dispatching workflow", ghUrl, payload);

    const dispatchRes = await fetch(ghUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!dispatchRes.ok) {
      const errText = await dispatchRes.text();
      throw new Error(`GitHub dispatch failed: ${dispatchRes.status} ${dispatchRes.statusText} - ${errText}`);
    }

    context.res = {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { runId, message: "Workflow triggered successfully" }
    };
  } catch (err) {
    context.log.error("validate-template error:", err);
    // Determine if this is a GitHub API error or other error
    const isGitHubError = err.message && err.message.includes('GitHub dispatch failed');
    
    context.res = { 
      status: isGitHubError ? 502 : 500, // Use 502 Bad Gateway for GitHub API errors
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { 
        error: err.message,
        type: isGitHubError ? 'github_api_error' : 'server_error',
        details: isGitHubError ? 'Error communicating with GitHub API' : 'Internal server error',
        timestamp: new Date().toISOString()
      } 
    };
  }
}
