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

async function getRunList(workflowOwner, workflowRepo, workflowId) {

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const isoDate = tenMinutesAgo.toISOString();

  const workflowUrl = `https://api.github.com/repos/${encodeURIComponent(workflowOwner)}/${encodeURIComponent(workflowRepo)}/actions/workflows/${encodeURIComponent(workflowId)}/runs?event=workflow_dispatch&per_page=100&branch=main&created:>=${encodeURIComponent(isoDate)}`;

  return fetchWithGitHubAuth(workflowUrl);
}

async function triggerAction(workflowOwner, workflowRepo, workflowId, workflowInput) {

  const workflowUrl = `https://api.github.com/repos/${workflowOwner}/${workflowRepo}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`;

  const body = {
    ref: 'main',
    inputs: workflowInput
  };

  return fetchWithGitHubAuth(workflowUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
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
async function triggerWorkflow(workflowOwner, workflowRepo, workflowId, workflowInput, runIdInputProperty, context) {

    // Trigger workflow
    const rawResponse = await triggerAction(workflowOwner, workflowRepo, workflowId, workflowInput);

    context.log(`Triggered workflow ${workflowOwner}/${workflowRepo}#${workflowId}, response status: ${rawResponse.status}`);

    if (!rawResponse.ok) {
      const errText = await rawResponse.text();
      return {
        found: false,
        status: 502,
        error: `Trigger workflow failed: ${rawResponse.status} ${rawResponse.statusText} - ${errText}`,
        ownerRepo: `${workflowOwner}/${workflowRepo}/actions/workflows/${workflowId}/runs`
      };
    }

    // wait 5 seconds to give GitHub time to start the run (preserves original behaviour)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get recent runs for the workflow
    const rawResponseFindRunId = await getRunList(workflowOwner, workflowRepo, workflowId);

    context.log(`Fetched recent runs for workflow ${workflowOwner}/${workflowRepo}#${workflowId}, response status: ${rawResponseFindRunId.status}`);

    if (!rawResponseFindRunId.ok) {
      const errText = await rawResponseFindRunId.text();
      return {
        found: false,
        status: 502,
        error: `Get workflow runs failed: ${rawResponseFindRunId.status} ${rawResponseFindRunId.statusText} - ${errText}`,
        ownerRepo: `${workflowOwner}/${workflowRepo}/actions/workflows/${workflowId}/runs`
      };
    }

    // Ensure the caller provided the input property to search for
    const uniqueInputId = workflowInput && Object.prototype.hasOwnProperty.call(workflowInput, runIdInputProperty)
      ? workflowInput[runIdInputProperty]
      : undefined;


    // const workflowUrl = `https://github.com/${workflowOwner}/${workflowRepo}/actions/workflows/${workflowId}`;

    // context.log(`Workflow URL: ${workflowUrl}`);

    if (!uniqueInputId) {
      return {
        found: false,
        status: 400,
        error: `Input property ${runIdInputProperty} is missing in workflowInput`,
        uniqueInputId: null,
        ownerRepo: `${workflowOwner}/${workflowRepo}/actions/workflows/${workflowId}/runs`
      };
    }
    context.log(`Searching for run with input property ${runIdInputProperty}=${uniqueInputId}`);

    const rawDataFindRunId = await rawResponseFindRunId.json();

    if (!rawDataFindRunId || !Array.isArray(rawDataFindRunId.workflow_runs)) {
      return {
        found: false,
        status: 502,
        error: 'trigger-action: Invalid response structure from GitHub when fetching workflow runs',
        uniqueInputId,
        ownerRepo: `${workflowOwner}/${workflowRepo}/actions/workflows/${workflowId}/runs`
      };
    }

    // be resilient: check display_title, name, and head_commit.message
    const matchingRun = rawDataFindRunId.workflow_runs.find(run => {
      const title = run.display_title || run.name || '';
      const commitMsg = (run.head_commit && run.head_commit.message) ? String(run.head_commit.message) : '';
      return (title && title.includes(String(uniqueInputId))) || (commitMsg && commitMsg.includes(String(uniqueInputId)));
    });

    if (matchingRun) {
      context.log(`Matching run ${matchingRun.id} found with input property ${runIdInputProperty}=${uniqueInputId}`);

      return {
        status: 200,
        found: true,
        runId: matchingRun.id,
        run: matchingRun,
        uniqueInputId,
        ownerRepo: `${workflowOwner}/${workflowRepo}/actions/workflows/${workflowId}/runs`,
      };
    }

    context.log(`No matching run found with input property ${runIdInputProperty}=${uniqueInputId}`);
    // not found
    return {
      found: false,
      status: 404,
      error: 'trigger-action: Could not find the triggered workflow run',
      uniqueInputId,
      ownerRepo: `${workflowOwner}/${workflowRepo}/actions/workflows/${workflowId}/runs`
    };

};

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

    // Extract fields
    const { workflowOrgRep, workflowId, workflowInput, runIdInputProperty } = req.body;

    if (!workflowOrgRep) {
      context.res = { status: 400, body: { error: 'workflowOrgRep is required' } };
      return;
    }

    // Validate workflowId (accept number or string)
    if (workflowId === undefined || workflowId === null || workflowId === '') {
      context.res = { status: 400, body: { error: 'workflowId is required' } };
      return;
    }

    if (!runIdInputProperty) {
      context.res = { status: 400, body: { error: 'runIdInputProperty is required' } };
      return;
    }

    const [incomingWorkflowOwner, incomingWorkflowRepo] = workflowOrgRep.split('/');
    if (!incomingWorkflowOwner || !incomingWorkflowRepo) {
      context.res = { status: 400, body: { error: 'workflowOrgRep must be in owner/repo format' } };
      return;
    }

    const workflowOwner = incomingWorkflowOwner || "Template-Doctor";
    const workflowRepo = incomingWorkflowRepo || "template-doctor";

    // Use the helper to trigger and discover run id
    const result = await triggerWorkflow(workflowOwner, workflowRepo, workflowId, workflowInput, runIdInputProperty, context);

    if (result.found) {
      const runId = result.runId;
      context.res = {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: { error: null, data: { runId }, context: { uniqueInputId: result.uniqueInputId, ownerRepo: result.ownerRepo, run: result.run } }
      };
      return;
    } else {
      // propagate structured error responses
      const status = result.status || 500;
      context.res = {
        status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: {
          error: result.error || 'trigger-action: Could not locate run',
          data: null,
          context: {
            url: result.workflowUrl,
            uniqueInputId: result.uniqueInputId || null,
            ownerRepo: result.ownerRepo || `${workflowOwner}/${workflowRepo}`
          }
        }
      };
      return;
    }

  } catch (error) {
    context.log.error('trigger-action: Error in trigger-action:', error);
    context.res = {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { error: error.message || 'Internal Server Error' }
    };
  }
};


module.exports.triggerWorkflow = triggerWorkflow;
