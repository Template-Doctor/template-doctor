# Get Docker image status of repo

Order and purpose of GitHub API calls:

* trigger workflow run with unique input (POST /actions/workflows/{workflow_id}/dispatches)
* get all workflow artifacts (GET /actions/artifacts)   
    - find artifact with unique name to appear get runId from response
* get workflow run status (GET /actions/runs/{run_id}) until completed
* get workflow run artifacts list (GET /actions/runs/{run_id}/artifacts)


Better Approach for Tracking Workflow Runs
1. Use a unique identifier in workflow dispatch: When triggering a workflow run, include a unique identifier in the workflow dispatch inputs or commit message.
2. Find the run by querying workflow runs: After dispatching, search for this unique identifier in the workflow run titles or commit messages.

## Tests with curl

```bash
curl -X POST "http://localhost:7071/api/validation-docker-image" \
     -H "content-type: application/json" \
     -d '{
         "templateUrl": "azure-samples/azure-search-static-web-app",
         "maxScore": 0
     }'



curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer github_pat_" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/diberry/template-doctor/actions/workflows/validate-docker-images.yml/runs
```
