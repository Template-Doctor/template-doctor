const { get } = require("http");
const { extractFilesFromZip } = require('./zip-utils');
const { 
    extractTrivyResults, 
    calculateTrivyScore, 
    processDockerImageArtifacts,
    processRepoScanArtifact,
    processImageScanArtifact
} = require('./trivy-utils');
const { 
    GitHubApiClient, 
    sleep 
} = require('../shared/github-api-client');

const pollingTimeout = 120000; // 2 minutes in ms
const pollingInterval = 10000; // 10 seconds in ms
const initialDelayAfterTrigger = 3000; // 3 seconds initial delay after workflow trigger
const maxPollingDelay = 30000; // Maximum polling delay (30 seconds)
const jitterFactor = 0.2; // 20% jitter for exponential backoff
const backoffMultiplier = 1.5; // Multiplier for exponential backoff
const runCompletionPollInterval = 5000; // 5 seconds between run status checks

/**
 * Adds an issue to the issues array with standard format
 * @param {Array} issues - Issues array to add to
 * @param {string} id - Issue identifier
 * @param {string} severity - Issue severity (warning, error)
 * @param {string} message - Issue message
 * @param {Object} [details] - Optional details object
 */
function addIssue(issues, id, severity, message, details = null) {
    const issue = {
        id,
        severity,
        message
    };
    
    if (details) {
        issue.details = details;
    } else if (arguments.length > 4 && arguments[4] !== null) {
        issue.error = arguments[4];
    }
    
    issues.push(issue);
}

/**
 * Starts a GitHub workflow and waits until at least one artifact with the specified requestGuid is available
 * @param {GitHubApiClient} client - GitHub API client instance
 * @param {Object} context - Azure Function context for logging
 * @param {Array} issues - Issues array to add to if there's an error
 * @param {Object} params - Parameters for the function
 * @param {string} params.templateOwnerRepo - Repository in owner/repo format
 * @param {string} params.workflowUrl - The workflow URL
 * @param {string} params.workflowFile - The workflow file path
 * @param {string} params.requestGuid - The request GUID
 * @param {string} params.workflowToken - GitHub token for workflow operations
 * @param {number} [params.timeout=120000] - Maximum time to wait in milliseconds (default 2 minutes)
 * @returns {Promise<Object>} - Result object with success flag and artifact data
 */
async function startWorkflowAndWaitForRunId(client, context, issues, params) {
    const { 
        templateOwnerRepo, 
        workflowUrl, 
        workflowFile, 
        requestGuid,
        workflowToken,
        timeout = pollingTimeout // Default to the global pollingTimeout
    } = params;
    
    try {
        // Trigger workflow
        try {
            // Use the trigger workflow method that adds detailed error context
            const triggeredResponse = await client.triggerWorkflow(templateOwnerRepo, requestGuid);
            if (!triggeredResponse || !triggeredResponse.ok) {
                // This should never happen since triggerWorkflow should throw for non-ok responses
                // But we'll handle it just in case
                throw new Error(`Unexpected non-ok response: ${triggeredResponse ? triggeredResponse.status : 'unknown'}`);
            }
            
            context.log(`Successfully triggered workflow for ${templateOwnerRepo} with GUID: ${requestGuid}`);
        } catch (error) {
            // The error from triggerWorkflow already has detailed context
            let errorMessage = `GitHubApiClient workflow not triggered: ${error.message}`;
            
            // Create a user-friendly message based on status code
            if (error.context && error.context.status) {
                if (error.context.status === 400) {
                    errorMessage = `GitHubApiClient workflow not triggered. Bad request (400): The request was improperly formatted or contains invalid parameters.`;
                } else if (error.context.status === 401) {
                    errorMessage = `GitHubApiClient workflow not triggered. Unauthorized (401): The GitHub token is invalid or has expired.`;
                } else if (error.context.status === 404) {
                    errorMessage = `GitHubApiClient workflow not triggered. Not Found (404): The workflow or repository was not found. Verify the workflow path '${workflowFile}' exists in repository '${workflowUrl}'.`;
                }
            }
            
            // Include all the rich context we have about the error
            addIssue(issues, 'docker-image-score-workflow-trigger-failed', 'warning', errorMessage, error.context || {
                originalError: error.message,
                templateOwnerRepo,
                requestGuid,
                workflowUrl,
                workflowFile
            });
            return { success: false };
        }

        // delay after workflow trigger - give workflow time to start
        await sleep(initialDelayAfterTrigger);

        // Call waitUntilRunStarted to get the run ID
        context.log(`Waiting for workflow run to start for ${templateOwnerRepo} with GUID: ${requestGuid}`);
        const runStartResult = await waitUntilRunStarted(client, context, requestGuid);
        
        if (runStartResult.success && runStartResult.runId) {
            // Successfully found a run ID
            context.log(`Successfully found run ID ${runStartResult.runId} for GUID: ${requestGuid}`);
            return runStartResult;
        } else {
            // No run ID found - create an issue with details
            let errorMessage = `Failed to get workflow run ID for GUID: ${requestGuid}`;
            let errorContext = runStartResult.context || {
                workflowUrl, 
                workflowFile, 
                templateOwnerRepo, 
                requestGuid
            };
            
            // Add error details from the result
            if (runStartResult.error) {
                errorMessage += `: ${runStartResult.error}`;
                errorContext.originalError = runStartResult.error;
            }
            
            // Include the detailed context from the error
            addIssue(issues, 'docker-image-score-artifact-failed', 'error', errorMessage, errorContext);
            return { success: false };
        }
        
        return { success: false };
    } catch (error) {
        // Handle any unexpected errors
        context.log(`Unexpected error in startWorkflowAndWaitForArtifact: ${error.message}`);
        addIssue(issues, 'docker-image-score-workflow-polling-error', 'error',
            `Unexpected error during workflow polling: ${error.message}`,
            {
                workflowUrl,
                workflowFile,
                templateOwnerRepo,
                requestGuid,
                error: error.message,
                stack: error.stack
            });
        return { success: false };
    }
}

/**
 * Waits until a GitHub workflow run has started by polling for artifacts with the provided GUID
 * @param {GitHubApiClient} client - GitHub API client instance
 * @param {Object} context - Azure Function context for logging
 * @param {string} inputGuid - The GUID to search for in artifacts
 * @returns {Promise<Object>} - Result object with success flag and run ID if found
 */
async function waitUntilRunStarted(client, context, inputGuid) {
    if (!inputGuid || typeof inputGuid !== 'string') {
        throw new Error('Invalid GUID provided for artifact search');
    }

    const maxWaitTime = 30000; // 30 seconds timeout
    const pollInterval = 5000; // 3 seconds between checks
    const startTime = Date.now();
    let attempts = 0;
    let response = null;
    let runId = null;

    // Do-while loop to poll until we find artifacts or timeout
    do {
        attempts++;
        try {
            // Call getWorkflowRunByUniqueInputId to check for artifacts
            response = await client.getWorkflowRunByUniqueInputId(inputGuid);

            context.log(`Polling for runs with input GUID ${inputGuid} (attempt ${attempts}, elapsed time: ${Math.round((Date.now() - startTime) / 1000)}s)`);
            
            // If we found runs successfully
            if (response.error === null && response.data && response.data.artifacts && Array.isArray(response.data.artifacts)) {
                // Look for a specific artifact with name pattern "scan-started-<inputGuid>"
                const scanStartedArtifact = response.data.artifacts.find(
                    artifact => typeof artifact.name === 'string' && 
                                artifact.name.startsWith('scan-started-') && 
                                artifact.name.includes(inputGuid)
                );
                
                if (scanStartedArtifact && scanStartedArtifact.workflow_run && scanStartedArtifact.workflow_run.id) {
                    runId = scanStartedArtifact.workflow_run.id;
                    context.log(`Found workflow run ID: ${runId} for scan-started artifact with GUID: ${inputGuid}`);
                    return { 
                        success: true, 
                        runId: runId, 
                        data: scanStartedArtifact
                    };
                } else {
                    // If we can't find the specific scan-started artifact but have any artifact with a workflow_run.id
                    const anyArtifactWithRunId = response.data.artifacts.find(
                        artifact => artifact.workflow_run && artifact.workflow_run.id
                    );
                    
                    if (anyArtifactWithRunId) {
                        runId = anyArtifactWithRunId.workflow_run.id;
                        context.log(`No scan-started artifact found, but got run ID: ${runId} from another artifact with GUID: ${inputGuid}`);
                        return { 
                            success: true, 
                            runId: runId, 
                            data: anyArtifactWithRunId 
                        };
                    }
                    
                    context.log(`Found ${response.data.artifacts.length} artifacts for GUID ${inputGuid} but none have the required workflow run ID`);
                    return { 
                        success: false, 
                        error: 'RUN_ID_NOT_FOUND',
                        data: response.data,
                        context: {
                            inputGuid,
                            artifactsCount: response.data.artifacts.length,
                            artifactNames: response.data.artifacts.map(a => a.name).slice(0, 5), // First 5 for debug
                            attemptsMade: attempts,
                            elapsedTimeMs: Date.now() - startTime
                        }
                    };
                }
            }
            
            // If there are no artifacts yet, or response has an error, continue polling
            if (Date.now() - startTime < maxWaitTime) {
                // Wait before trying again
                await sleep(pollInterval);
                // Continue to next iteration
                continue;
            }
            
            // If we reach here, we've timed out
            context.log(`Error or end of polling for GUID ${inputGuid}: ${response.error}`);
            break;
            
        } catch (err) {
            context.log(`Error during artifact polling: ${err.message}`);
            
            // Add context to the error
            const errorContext = {
                inputGuid,
                attemptsMade: attempts,
                elapsedTimeMs: Date.now() - startTime,
                errorType: err.name,
                errorStack: err.stack
            };
            
            return { 
                success: false, 
                error: err.message, 
                context: errorContext 
            };
        }
    } while (Date.now() - startTime < maxWaitTime);
    
    // If we get here, polling timed out or encountered an error
    return {
        success: false,
        error: response ? response.error : 'TIMEOUT',
        context: {
            inputGuid,
            attemptsMade: attempts,
            elapsedTimeMs: Date.now() - startTime,
            responseError: response ? response.error : null,
            responseContext: response ? response.context : null
        }
    };
}

/**
 * Waits until a GitHub workflow run completes by polling its status
 * @param {GitHubApiClient} client - GitHub API client instance
 * @param {Object} context - Azure Function context for logging
 * @param {Array} issues - Issues array to add to if there's an error
 * @param {Object} params - Parameters for the function
 * @param {string|number} params.runId - The workflow run ID
 * @param {string} params.templateOwnerRepo - Repository in owner/repo format
 * @param {string} params.workflowUrl - The workflow URL
 * @param {string} params.workflowFile - The workflow file path
 * @param {string} params.requestGuid - The request GUID
 * @param {number} [params.timeout=300000] - Maximum time to wait in milliseconds (default 5 minutes)
 * @returns {Promise<Object>} - Result object with success flag
 */
async function waitUntilRunCompletes(client, context, issues, params) {
    const { 
        runId, 
        templateOwnerRepo, 
        workflowUrl, 
        workflowFile, 
        requestGuid,
        timeout = 300000 // Default 5 minute timeout
    } = params;
    
    context.log(`Waiting for workflow run ${runId} to complete...`);
    
    const startTime = Date.now();
    let runStatusCheck;
    let attempts = 0;
    
    do {
        attempts++;
        try {
            runStatusCheck = await client.getWorkflowRun(templateOwnerRepo, runId);
            
            if (runStatusCheck.error) {
                addIssue(issues, 'docker-image-score-artifact-find-run-id-failed', 'error', 
                    `Error fetching workflow run status: ${runStatusCheck.error}`, 
                    { 
                        workflowUrl, 
                        workflowFile, 
                        templateOwnerRepo, 
                        requestGuid,
                        runId,
                        attempts,
                        elapsedMs: Date.now() - startTime,
                        ...runStatusCheck.context
                    });
                return { success: false };
            }
            
            const status = runStatusCheck.data?.status;
            const conclusion = runStatusCheck.data?.conclusion;
            
            context.log(`Workflow run ${runId} status: ${status}, conclusion: ${conclusion} (attempt ${attempts})`);
            
            if (status === 'completed') {
                // Check if the workflow completed successfully
                if (conclusion !== 'success') {
                    context.log(`Workflow run ${runId} completed with non-success conclusion: ${conclusion}`);
                    addIssue(issues, 'docker-image-score-workflow-failed', 'warning', 
                        `Workflow run completed with ${conclusion} status`, 
                        { 
                            workflowUrl, 
                            workflowFile, 
                            templateOwnerRepo, 
                            requestGuid,
                            runId,
                            workflowStatus: status,
                            workflowConclusion: conclusion,
                            attempts,
                            elapsedMs: Date.now() - startTime
                        });
                    // Continue with artifact retrieval even if workflow didn't succeed
                    // as there might be partial artifacts available
                }
                
                return { success: true, data: runStatusCheck.data };
            }
            
            // Check for timeout
            if (Date.now() - startTime > timeout) {
                context.log(`Timeout waiting for workflow run ${runId} to complete after ${(Date.now() - startTime) / 1000} seconds`);
                addIssue(issues, 'docker-image-score-workflow-timeout', 'error', 
                    `Timeout waiting for workflow run to complete after ${Math.round((Date.now() - startTime) / 1000)} seconds`, 
                    { 
                        workflowUrl, 
                        workflowFile, 
                        templateOwnerRepo, 
                        requestGuid,
                        runId,
                        workflowStatus: status,
                        attempts,
                        timeoutMs: timeout,
                        elapsedMs: Date.now() - startTime
                    });
                return { success: false };
            }
            
            // Wait before polling again using the configured interval
            await sleep(runCompletionPollInterval);
            
        } catch (error) {
            // Handle unexpected errors during polling
            context.log(`Error polling workflow run status: ${error.message}`);
            addIssue(issues, 'docker-image-score-workflow-poll-error', 'error', 
                `Unexpected error polling workflow run status: ${error.message}`, 
                { 
                    workflowUrl, 
                    workflowFile, 
                    templateOwnerRepo, 
                    requestGuid,
                    runId,
                    attempts,
                    elapsedMs: Date.now() - startTime,
                    error: error.message,
                    stack: error.stack
                });
            return { success: false };
        }
    } while (true); // Loop will exit via return statements
}

// A successful workflow should have
// 1 workflow artifact for the Trivy repo scan (file name starts with "scan-repo-<repo-name>-<input-guid>")
// N workflow artifacts for any images discovered in the repo (file name starts with "scan-image-<image-name-and-tag>")
// Find the workflow with the input guid to get run id, then use run id to get all artifacts for the run
async function getDockerImageScore(context, workflowToken, workflowUrl, workflowFile, templateOwnerRepo, requestGuid, maxScore, issues, compliance) {

    context.log(`Maximum score: ${maxScore.toFixed(1)}`); 

    if (!workflowToken || typeof workflowToken !== 'string') {
        addIssue(issues, 'docker-image-score-invalid-workflow-token', 'warning', 'Invalid workflow token for Docker image score.');
        return;
    }
    if (!workflowUrl || typeof workflowUrl !== 'string' || workflowUrl.indexOf('/') === -1) {
        addIssue(issues, 'docker-image-score-invalid-workflow-repo', 'warning', 'Invalid workflow URL for docker-image score. Use owner/repo format.');
        return;
    }

    if (!workflowFile || typeof workflowFile !== 'string') {
        addIssue(issues, 'docker-image-score-invalid-workflow-file', 'warning', 'Invalid workflow file for docker-image score. ');
        return;
    }

    // templateOwnerRepo should be in the form 'owner/repo'
    if (!templateOwnerRepo || typeof templateOwnerRepo !== 'string' || templateOwnerRepo.indexOf('/') === -1) {
        addIssue(issues, 'docker-image-score-invalid-template-repo', 'warning', 'Invalid template repo string for docker-image score. Use owner/repo format.');
        return;
    }

    if (!requestGuid || typeof requestGuid !== 'string') {
        addIssue(issues, 'docker-image-score-invalid-request-guid', 'warning', 'Invalid request GUID for docker-image score.');
        return;
    }

    try {
        const client = new GitHubApiClient(context, undefined, workflowToken, workflowUrl, workflowFile);
        if (!client) {
            addIssue(issues, 'docker-image-score-workflow-trigger-failed', 'warning', `GitHubApiClient client can't be created`);
            return;
        }

        // Start workflow and wait for artifact
        const workflowResult = await startWorkflowAndWaitForRunId(client, context, issues, {
            templateOwnerRepo,
            workflowUrl,
            workflowFile,
            requestGuid,
            workflowToken
        });
        
        if (!workflowResult.success) {
            return; // Issue already added by startWorkflowAndWaitForArtifact
        }

        // Wait until the workflow run completes
        const runId = workflowResult.runId;
        const waitResult = await waitUntilRunCompletes(client, context, issues, {
            runId,
            templateOwnerRepo,
            workflowUrl,
            workflowFile,
            requestGuid
        });
        
        if (!waitResult.success) {
            return; // Issue was already added by waitUntilRunCompletes
        }

        // use run id to get all artifacts for the run
        // GitHub workflow run ID is a number, make sure we handle it properly
        const artifactsResp = await client.getArtifactsList(runId);
        if (artifactsResp.error || !artifactsResp.data || !Array.isArray(artifactsResp.data.artifacts)) {
            addIssue(issues, 'docker-image-score-artifact-list-failed', 'error', 
                `Workflow artifacts not found for run id ${runId}: ${artifactsResp.error || 'No artifacts array'}`, 
                artifactsResp.context || { 
                    workflowUrl, 
                    workflowFile, 
                    templateOwnerRepo, 
                    requestGuid, 
                    runId,
                    originalError: artifactsResp.error
                });
            return;
        }

        const artifacts = artifactsResp.data.artifacts;
        if (artifacts.length === 0) {
            addIssue(issues, 'docker-image-score-no-artifacts', 'warning', 
                `No workflow artifacts found for run id ${runId}`, 
                { 
                    workflowUrl, 
                    workflowFile, 
                    templateOwnerRepo, 
                    requestGuid, 
                    runId,
                    artifactsResponseData: JSON.stringify(artifactsResp.data)
                });
            return;
        }

        // process workflow artifact zip file to determine score
        // score determined from Trivy output in artifact files
        processDockerImageArtifacts(context, client, runStatus, templateOwnerRepo, artifacts, maxScore, issues, compliance);

    } catch (err) {
        // Create a comprehensive error object with all available context
        const errorContext = err.context || {};
        let errorDetails = {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            workflowUrl,
            workflowFile,
            templateOwnerRepo,
            requestGuid
        };
        
        // Merge in any additional context from the error
        if (Object.keys(errorContext).length > 0) {
            errorDetails = { ...errorDetails, ...errorContext };
        }
        
        context.log('Error fetching Scorecard:', err, errorDetails);
        
        // Create a user-friendly error message based on the error type
        let userFriendlyMessage = 'Failed to fetch docker-image Scorecard';
        
        if (err.message && err.message.includes('GitHub dispatch failed')) {
            userFriendlyMessage = `Failed to trigger GitHub workflow: ${err.message}`;
        } else if (err.message && err.message.includes('Failed to download artifact')) {
            userFriendlyMessage = `Failed to download workflow artifact: ${err.message}`;
        } else if (err.message && err.message.includes('Failed to fetch artifacts')) {
            userFriendlyMessage = `Failed to fetch workflow artifacts: ${err.message}`;
        } else if (err.message && err.message.includes('timed out')) {
            userFriendlyMessage = `Operation timed out: ${err.message}`;
        }
        
        addIssue(issues, 'docker-image-score-error', 'warning', userFriendlyMessage, errorDetails);
    }
}


module.exports = { 
    getDockerImageScore,
    waitUntilRunCompletes,
    startWorkflowAndWaitForArtifact: startWorkflowAndWaitForRunId,
    waitUntilRunStarted
};