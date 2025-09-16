const crypto = require('crypto');
const { getDockerImageScore } = require('./scorecard');

module.exports = async function (context, req) {
  // Replace context.log with console.log in development mode
  if (process.env.NODE_ENV === "development") {
    context.log = console.log;
  }
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

    // maxScore is optional, defaults to 0
    // means 0 high severity issues allowed
    const { templateUrl, maxScore } = req.body;

    if (!templateUrl) {
      context.res = {
        status: 400,
        body: { error: "templateUrl is required" }
      };
      return;
    }

    const finalMaxScore = parseInt(maxScore, 10) || 0;
    const localRunId = crypto.randomUUID();

    const owner = process.env.GITHUB_REPO_OWNER || "Template-Doctor";
    const repo = process.env.GITHUB_REPO_NAME || "template-doctor";
    const workflowFile = process.env.GITHUB_WORKFLOW_FILE || "validate-docker-images.yml";
    const workflowUrl = `https://github.com/${owner}/${repo}/actions/workflows/${workflowFile}`;
    const workflowToken = process.env.GH_WORKFLOW_TOKEN;
    if (!workflowToken) throw new Error("Missing GH_WORKFLOW_TOKEN app setting");

    const issues = [];
    const compliance = [];

    // Set up a timeout promise that rejects after 3 minutes (180000 ms)
    const timeout = new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        reject(new Error('Docker images check timed out after 3 minutes'));
      }, 180000);
    });

    // Race the getDockerImageScore call against the timeout
    const score = await Promise.race([
      getDockerImageScore(context, workflowToken, `${owner}/${repo}`, workflowFile, templateUrl, localRunId, finalMaxScore, issues, compliance),
      timeout
    ]);

    // zero issues means pass
    const status = issues.length === 0 ? 'passed' : 'failed';

    context.res = {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: {
        runId: localRunId,
        githubRunId: localRunId || null,
        githubRunUrl: workflowUrl || null,
        message: `workflow='${workflowFile.replace('.yml', '')}' run='${localRunId}' status='${status}'`,
        score,
        issues,
        compliance
      }
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("validate-template error:", err);
    } else {
      context.log.error("validate-template error:", err);
    }
    
    // Extract error context if available
    const errorContext = err.context || {};
    const statusCode = errorContext.status || (err.message && err.message.includes('GitHub dispatch failed') ? 502 : 500);
    
    // Create a rich error response
    const errorResponse = {
      error: err.message,
      timestamp: new Date().toISOString()
    };
    
    // Determine error type and add helpful explanations
    const isGitHubError = err.message && err.message.includes('GitHub dispatch failed');
    
    if (isGitHubError) {
      errorResponse.type = 'github_api_error';
      
      // Add specific explanations based on status code
      if (statusCode === 400) {
        errorResponse.details = 'The GitHub API request was malformed or contains invalid parameters.';
        errorResponse.resolution = 'Check template URL format and workflow input parameters.';
      } else if (statusCode === 401) {
        errorResponse.details = 'Authentication to GitHub API failed. The workflow token may be invalid or expired.';
        errorResponse.resolution = 'Verify workflow token permissions and expiration.';
      } else if (statusCode === 404) {
        errorResponse.details = 'GitHub resource not found. The repository, workflow, or template may not exist.';
        errorResponse.resolution = 'Verify the repository, workflow file, and template paths are correct.';
      } else {
        errorResponse.details = 'Error communicating with GitHub API';
      }
      
      // Add GitHub-specific context if available
      if (errorContext.workflowOwnerRepo) {
        errorResponse.workflowRepo = errorContext.workflowOwnerRepo;
      }
      if (errorContext.workflowId) {
        errorResponse.workflowId = errorContext.workflowId;
      }
      if (errorContext.templateRepo) {
        errorResponse.templateRepo = errorContext.templateRepo;
      }
      if (errorContext.githubMessage) {
        errorResponse.githubMessage = errorContext.githubMessage;
      }
      if (errorContext.documentationUrl) {
        errorResponse.documentationUrl = errorContext.documentationUrl;
      }
    } else {
      errorResponse.type = 'server_error';
      errorResponse.details = 'Internal server error during Docker image validation';
    }
    
    // Include original error context for debugging
    if (process.env.NODE_ENV === "development" && Object.keys(errorContext).length > 0) {
      errorResponse.debugContext = errorContext;
    }
    
    context.res = {
      status: statusCode,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: errorResponse
    };
  }
};