const https = require('https');
const runIdStore = require('../shared/run-id-store');

const OWNER = process.env.GITHUB_REPO_OWNER || 'Template-Doctor';
const REPO = process.env.GITHUB_REPO_NAME || 'template-doctor';
const TOKEN = process.env.GH_WORKFLOW_TOKEN;

if (!TOKEN) throw new Error('Missing GH_WORKFLOW_TOKEN');

function githubCancelRun(runId) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${OWNER}/${REPO}/actions/runs/${runId}/cancel`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'User-Agent': 'azure-functions',
      Accept: 'application/vnd.github+json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 202) resolve(true);
        else reject(new Error(`GitHub cancel failed: ${res.statusCode} ${res.statusMessage} - ${data}`));
      });
    });

    req.on('error', reject);
    req.end();
  });
}

module.exports = async function (context, req) {
  context.log('API - Validation cancel triggered');

  try {
    let localRunId = null;
    if (req.query && req.query.runId) localRunId = req.query.runId;
    if (!localRunId && req.body && req.body.localRunId) localRunId = req.body.localRunId;

    if (!localRunId) {
      context.res = { status: 400, body: { error: 'Missing localRunId or runId' } };
      return;
    }

    // Get stored GitHub run ID
    const mapping = await runIdStore.getRunIdMapping(localRunId);
    if (!mapping || !mapping.githubRunId) {
      context.res = { status: 404, body: { error: `No GitHub run found for localRunId ${localRunId}` } };
      return;
    }

    const githubRunId = mapping.githubRunId;
    context.log(`Cancelling GitHub workflow run ${githubRunId}...`);

    await githubCancelRun(githubRunId);

    await runIdStore.updateRunIdMapping(localRunId, { status: 'cancelled', updatedAt: new Date().toISOString() });

    context.res = {
      status: 200,
      body: {
        message: `Workflow run ${githubRunId} cancelled.`,
        localRunId,
        githubRunId
      }
    };

  } catch (err) {
    context.log.error('Validation cancel error:', err);
    context.res = { status: 500, body: { error: err.message } };
  }
};
