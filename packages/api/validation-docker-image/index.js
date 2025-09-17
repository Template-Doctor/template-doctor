const crypto = require('crypto');
const { triggerWorkflow } = require('../action-trigger/index');
const { getWorkflowRunData } = require('../action-run-status/index');
const { getArtifactsForRun } = require('../action-run-artifacts/index');
const { extractTrivyResults, processTrivyResultsDetails } = require('./trivy-utils');

const workflowOwner = process.env.GITHUB_REPO_OWNER || "Template-Doctor";
const workflowRepo = process.env.GITHUB_REPO_NAME || "template-doctor";
const workflowFile = process.env.GITHUB_WORKFLOW_FILE || "validate-docker-images.yml";
const gitHubApiVersion = "2022-11-28"; // GitHub API version for headers
const fetchTimeout = 30000; // 30 seconds for fetch requests
const runIdInputProperty = 'runId';

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
async function getRepoScanArtifactUrl(artifacts) {
  const repoArtifact = artifacts.find(a => typeof a.name === 'string' && a.name.startsWith('scan-repo-'));
  if (!repoArtifact) {
    throw new Error('No repository scan artifact found');
  }
  return repoArtifact.archive_download_url; // return URL string, not a buffer/promise
}
async function getImageArtifactUrls(artifacts) {
  const imageArtifacts = artifacts.filter(a => typeof a.name === 'string' && a.name.startsWith('scan-image-'));
  if (!imageArtifacts || imageArtifacts.length === 0) {
    return [];
  }
  return imageArtifacts.map(a => a.archive_download_url);
}
async function getZipAsBuffer(downloadUrl) {

  const response = await fetchWithGitHubAuth(downloadUrl, {
    method: 'GET',
    redirect: 'manual' // we want to handle the redirect ourselves
  });

  // If GitHub returned a redirect, follow it manually WITHOUT Authorization
  if (response.status === 302 || response.status === 301 || response.status === 307 || response.status === 308) {
    const location = response.headers.get('location');
    if (!location) {
      const error = new Error('Redirected but no Location header');
      error.context = {
        status: response.status,
        statusText: response.statusText,
        downloadUrl,
        headers: Array.from(response.headers.entries()).reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {})
      };
      throw error;
    }

    console.log(`Following redirect to zip file: ${location}`);

    const fileResp = await fetch(location, {
      method: 'GET',
      headers: {
        // do NOT include Authorization here
        Accept: 'application/octet-stream'
      },
      signal: AbortSignal.timeout(fetchTimeout)
    });
    if (!fileResp.ok) {
      let errorDetails = '';
      try {
        errorDetails = await fileResp.text();
      } catch (e) {
        errorDetails = 'Could not read response body';
      }

      const error = new Error(`Failed to download artifact from storage: ${fileResp.status} ${fileResp.statusText}`);
      throw error;
    }

    // return binary data (ArrayBuffer) so caller can save/unzip
    const zipFilebuffer = await fileResp.arrayBuffer();
    return zipFilebuffer;
  } else if (response.status > 399) {
    throw new Error(`Failed to get artifact zip from download URL: ${response.status} ${response.statusText}`);
  } else {
    if (response.ok) {
      // may be JSON or binary depending on response; return ArrayBuffer for binary safety
      return await response.arrayBuffer();
    } else {
      throw new Error(`Unexpected response when fetching artifact: ${response.status} ${response.statusText}`);
    }
  }


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

async function processRepoArtifact(artifacts){
  const repoUrl = await getRepoScanArtifactUrl(artifacts);
  const buffer = await getZipAsBuffer(repoUrl); 
  const repoScanJsonResult = await extractTrivyResults(buffer);
  const repoTrivyResults = processTrivyResultsDetails(repoScanJsonResult);
  return repoTrivyResults;
}
async function processImageArtifact(artifacts){
  const imageUrls = await getImageArtifactUrls(artifacts);
  if (!imageUrls || imageUrls.length === 0) return [];

  // Start all downloads concurrently (returns an array of promises -> Promise.all waits for them)
  const downloadPromises = imageUrls.map(url => getZipAsBuffer(url));
  const buffers = await Promise.all(downloadPromises);

  // Extract and process each buffer (can run extractTrivyResults concurrently if it's async-safe)
  const extractPromises = buffers.map(buf => extractTrivyResults(buf));
  const imageJsonResults = await Promise.all(extractPromises);

  // Process details synchronously (or map -> processTrivyResultsDetails)
  const imagesTrivyResults = imageJsonResults.map(r => processTrivyResultsDetails(r));
  return imagesTrivyResults;
}

async function processArtifacts(artifactsObj) {
  const artifacts = artifactsObj && artifactsObj.artifacts ? artifactsObj.artifacts : null;

  if (!artifacts || !Array.isArray(artifacts) || artifacts.length === 0) {
    throw new Error('No artifacts provided for processing');
  }

  // Repo scan
  const repoScanResult = await processRepoArtifact(artifacts);

  // Images
  const imageScanResults = await processImageArtifact(artifacts);

  // ... continue your aggregation/score logic using repoScanResult and imageScanResults ...
  // (return whatever structure your handler expects)
  return {
    repositoryScan: repoScanResult,
    imageScans: imageScanResults
  };

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

    const { templateUrl } = req.body;

    if (!templateUrl) {
      context.res = {
        status: 400,
        body: { error: "templateUrl is required" }
      };
      return;
    }

    const runRequestIdValue = crypto.randomUUID();
    const [owner, repo] = templateUrl.split('/');

    const triggerWorkflowBody = {
      repoOwner: owner,
      repoName: repo,
      runId: runRequestIdValue
    }

    const triggerResult = await triggerWorkflow(workflowOwner, workflowRepo, workflowFile, triggerWorkflowBody, 'runId', context);

    if (triggerResult.status !== 200 || !triggerResult.found) {
      context.res = {
        status: triggerResult.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: { error: "Validation docker image api: Failed to trigger workflow or retrieve run ID" }
      };
      return;
    }

    const runId = triggerResult.runId;

    // wait until the run is completed
    let run;
    let attempts = 0;
    const maxAttempts = 30; // e.g., wait up to 5 minutes
    const delayMs = 10000; // 10 seconds

    while (attempts < maxAttempts) {
      await new Promise(res => setTimeout(res, delayMs));
      run = await getWorkflowRunData(workflowOwner, workflowRepo, runId);
      if (run.status === 'completed') break;
      attempts++;
    }

    if (run.status !== 'completed') {
      context.res = {
        status: 504,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: { error: "Validation docker image api: Workflow run did not complete in expected time" }
      };
      return;
    }

    // get the artifacts data
    const artifacts = await getArtifactsForRun(workflowOwner, workflowRepo, runId);

    if (!artifacts || !artifacts.artifacts || artifacts.artifacts.length === 0) {
      context.res = {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: { error: "Validation docker image api: No artifacts found from workflow run" }
      };
      return;
    }
    const complianceResults = await processArtifacts(artifacts);

    context.res = {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: {
        templateUrl,
        runId: runRequestIdValue,
        complianceResults
      }
    };
  } catch (err) {

    context.res = {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: err
    };
  }
};