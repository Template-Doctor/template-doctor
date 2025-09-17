const gitHubApiVersion = "2022-11-28"; // GitHub API version for headers
const fetchTimeout = 30000; // 30 seconds for fetch requests

function createGitHubHeaders() {

  const workflowToken = process.env.GH_WORKFLOW_TOKEN;
  if (!workflowToken) throw new Error("Missing GH_WORKFLOW_TOKEN app setting");

  return {
    "Authorization": `Bearer ${workflowToken}`,
    "Accept": 'application/vnd.github+json',
    "X-GitHub-Api-Version": gitHubApiVersion,
    "Content-Type": "application/json"
  };
}

async function fetchWithGitHubAuth(url, options = {}) {

  const requestOptions = {
    ...options,
    headers: {
      ...createGitHubHeaders(),
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(options.timeout || fetchTimeout)
  };

  return fetch(url, requestOptions);
}

async function getWorkflowRun(workflowOwner, workflowRepo, workflowRunId) {

  const workflowUrl = `https://api.github.com/repos/${encodeURIComponent(workflowOwner)}/${encodeURIComponent(workflowRepo)}/actions/runs/${workflowRunId}`;

  return fetchWithGitHubAuth(workflowUrl);
}

async function getWorkflowRunData(workflowOwner, workflowRepo, workflowRunId) {

  const rawResponse = await getWorkflowRun(workflowOwner, workflowRepo, workflowRunId)

  if (!rawResponse.ok) {
    const errText = await rawResponse.text();
    throw new Error(`Trigger workflow failed: ${rawResponse.status} ${rawResponse.statusText} - ${errText}`);
  }

  const data = await rawResponse.json();

  if (!data) {
    throw new Error("Invalid response from GitHub when fetching workflow run data");
  }
  return data;
}

module.exports = async function (context, req) {

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

    // Extract incoming fields
    const { workflowOrgRep, workflowRunId } = req.body;

    if (!workflowOrgRep) {
      context.res = { status: 400, body: { error: 'workflowOrgRep is required' } };
      return;
    }

    const [incomingWorkflowOwner, incomingWorkflowRepo] = workflowOrgRep.split('/');
    if (!incomingWorkflowOwner || !incomingWorkflowRepo) {
      context.res = { status: 400, body: { error: 'workflowOrgRep must be in owner/repo format' } };
      return;
    }

    if (!workflowRunId) {
      context.res = { status: 400, body: { error: 'workflowRunId is required' } };
      return;
    }

    const workflowOwner = incomingWorkflowOwner || "Template-Doctor";
    const workflowRepo = incomingWorkflowRepo || "template-doctor";

    const workflowRunData = await getWorkflowRunData(workflowOwner, workflowRepo, workflowRunId);

    context.res = {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { error: null, data: workflowRunData, context: { url: workflowUrl, uniqueInputId, ownerRepo: `${workflowOwner}/${workflowRepo}` } }
    };
  } catch (error) {
    context.log.error('trigger-action: Error in trigger-action:', error);
    context.res = {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { error: error.message || 'Internal Server Error' }
    };
  }
};

module.exports.getWorkflowRunData = getWorkflowRunData;