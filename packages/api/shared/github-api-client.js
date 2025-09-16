/**
 * GitHub API Client
 * Handles all interactions with the GitHub REST API
 */

const gitHubApiVersion = "2022-11-28"; // GitHub API version for headers
const fetchTimeout = 30000; // 30 seconds for fetch requests
const retryDelayMultiplier = 1000; // Base milliseconds for retry (1 second)

/**
 * Process GitHub API error responses consistently
 * @param {Response} response - The fetch response object
 * @param {string} operation - Description of the operation being performed
 * @param {Object} contextData - Additional context data to include in error
 * @param {Object} logger - Logger object with log method
 * @returns {Promise<Object>} - Error object with message and context
 */
async function processGitHubApiError(response, operation, contextData, logger) {
    let errorDetails = `${response.status} ${response.statusText}`;
    
    // Create a detailed error context object with base information
    const errorContext = {
        status: response.status,
        statusText: response.statusText,
        operation: operation,
        ...contextData
    };
    
    // Create default error message
    let errorMessage = `GitHub API ${operation} failed: ${errorDetails}`;
    
    // Add specific explanations based on status code
    if (response.status === 400) {
        errorContext.explanation = "The request was improperly formatted or contains invalid parameters.";
        errorMessage = `GitHub API ${operation} failed: Bad request (400) - ${errorContext.explanation}`;
    } else if (response.status === 401) {
        errorContext.explanation = "The GitHub token is invalid or has expired.";
        errorMessage = `GitHub API ${operation} failed: Unauthorized (401) - ${errorContext.explanation}`;
    } else if (response.status === 404) {
        errorContext.explanation = "The requested resource was not found.";
        errorMessage = `GitHub API ${operation} failed: Not Found (404) - ${errorContext.explanation}`;
    } else if (response.status === 403) {
        errorContext.explanation = "Request forbidden. You may have exceeded rate limits or lack permission.";
        errorMessage = `GitHub API ${operation} failed: Forbidden (403) - ${errorContext.explanation}`;
    } else if (response.status === 422) {
        errorContext.explanation = "Validation failed or the request is not processable.";
        errorMessage = `GitHub API ${operation} failed: Unprocessable Entity (422) - ${errorContext.explanation}`;
    }
    
    // Attempt to get more details from the response body
    try {
        const errorBody = await response.text();
        if (errorBody) {
            // Try to parse as JSON, but handle as text if it fails
            try {
                const errorJson = JSON.parse(errorBody);
                if (errorJson.message) {
                    errorDetails += `: ${errorJson.message}`;
                    errorContext.githubMessage = errorJson.message;
                    errorMessage += `: ${errorJson.message}`;
                } else {
                    errorDetails += `: ${errorBody}`;
                    errorContext.responseBody = errorBody;
                }
                
                // Add any additional GitHub error details if available
                if (errorJson.errors) {
                    errorContext.errors = errorJson.errors;
                }
                if (errorJson.documentation_url) {
                    errorContext.documentationUrl = errorJson.documentation_url;
                }
            } catch (e) {
                // Not valid JSON, just include the text
                errorDetails += `: ${errorBody}`;
                errorContext.responseBody = errorBody;
            }
        }
    } catch (e) {
        // Ignore errors from trying to read the response body
        errorContext.responseReadError = e.message;
    }
    
    if (logger) {
        logger.log(`${errorMessage}`, errorContext);
    }
    
    // Create an error object with rich context
    const error = new Error(errorMessage);
    error.context = errorContext;
    
    return { error, errorContext, errorMessage };
}

/**
 * Creates standard GitHub API headers
 * @param {string} token - GitHub API token
 * @returns {Object} - Headers object for GitHub API requests
 */
function createGitHubHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        "X-GitHub-Api-Version": gitHubApiVersion
    };
}

/**
 * Utility function to sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * GitHub API Client class
 * Handles all interactions with the GitHub REST API
 */
class GitHubApiClient {
    constructor(context, baseUrl = 'https://api.github.com', token = null, workflowOwnerRepo = null, workflowId = null) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.token = token;

        // if worflowOwnerRepo is a full url, pull out owner/repo and workflow file
        const matches = workflowOwnerRepo ? workflowOwnerRepo.match(/^(.*\/(.*))\/actions\/workflows\/(.*)$/) : null;
        if (matches) {
            this.workflowOwnerRepo = matches[1];
            this.workflowId = matches[3];
        } else {
            this.workflowOwnerRepo = workflowOwnerRepo;
            this.workflowId = workflowId;
        }
        this.context = context ? context : { log: (str) => { console.log(str) } };
    }

    /**
     * Creates a fetch request with GitHub API headers
     * @param {string} url - The URL to fetch
     * @param {Object} options - Additional fetch options
     * @returns {Promise<Response>} - The fetch response
     */
    async fetchWithGitHubAuth(url, options = {}) {
        const requestOptions = {
            ...options,
            headers: {
                ...createGitHubHeaders(this.token),
                ...(options.headers || {})
            },
            signal: AbortSignal.timeout(options.timeout || fetchTimeout)
        };

        this.context.log(`Fetching URL: ${url} with options: ${JSON.stringify(requestOptions)}`);
        
        return fetch(url, requestOptions);
    }

    /**
     * Triggers a GitHub workflow dispatch event
     * @param {string} templateOwnerRep - Repository in owner/repo format
     * @param {string} incomingGuid - Unique identifier for this run
     * @returns {Promise<Response>} - The response from the workflow trigger
     */
    async triggerWorkflow(templateOwnerRep, incomingGuid) {
        try {
            if (!this.token) throw new Error('GitHub token is required to trigger workflow');
            if (!this.baseUrl) throw new Error('Base URL is required to trigger workflow');
            if (!this.workflowOwnerRepo) throw new Error('workflowOwnerRepo is required to trigger workflow');
            if (!this.workflowId) throw new Error('workflowId is required to trigger workflow');

            if (!templateOwnerRep) throw new Error('templateOwnerRepo is required');
            if (!incomingGuid) throw new Error('incomingGuid is required to trigger workflow');

            const url = `${this.baseUrl}/repos/${this.workflowOwnerRepo}/actions/workflows/${this.workflowId}/dispatches`;
            this.context.log(`URL: ${url}`);

            const [owner, repo] = templateOwnerRep.split('/');
            if (!owner || !repo) {
                throw new Error('templateOwnerRepo must be in the format "owner/repo"');
            }

            const body = {
                ref: 'main',
                inputs: {
                    repoOwner: owner,
                    repoName: repo,
                    runId: incomingGuid
                }
            };

            const response = await this.fetchWithGitHubAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                // Use the common GitHub API error handler with context specific to this operation
                const contextData = {
                    url: url,
                    workflowOwnerRepo: this.workflowOwnerRepo,
                    workflowId: this.workflowId,
                    templateRepo: templateOwnerRep,
                    requestGuid: incomingGuid
                };
                
                const { error } = await processGitHubApiError(
                    response, 
                    'workflow dispatch', 
                    contextData, 
                    this.context
                );
                
                throw error;
            }

            return response;
        } catch (err) {
            this.context.log(`GitHub API client trigger workflow error: ${err.message}`);
            throw err;
        }
    }

    /**
     * Gets the list of artifacts for a workflow run
     * @param {number|string} workflowRunId - The ID of the workflow run
     * @returns {Promise<Object>} - The artifacts list response
     */
    async getArtifactsList(workflowRunId) {
        try {
            // GitHub workflow run ID should be a number or a string containing a number
            if (!workflowRunId || (isNaN(Number(workflowRunId)) && typeof workflowRunId !== 'number')) {
                throw new Error(`Invalid workflowRunId provided for artifact search: ${workflowRunId}`);
            }

            const url = `${this.baseUrl}/repos/${this.workflowOwnerRepo}/actions/runs/${workflowRunId}/artifacts`;

            const resp = await this.fetchWithGitHubAuth(url);
            if (!resp.ok) {
                // Use the common GitHub API error handler with context specific to this operation
                const contextData = {
                    url: url,
                    workflowRunId: workflowRunId,
                    workflowOwnerRepo: this.workflowOwnerRepo
                };
                
                const { error, errorContext, errorMessage } = await processGitHubApiError(
                    resp, 
                    'fetch artifacts for workflow run', 
                    contextData, 
                    this.context
                );
                
                return { 
                    error: errorMessage, 
                    data: null,
                    context: errorContext
                };
            }
            
            const data = await resp.json();
            if (data) {
                return { error: null, data };
            }
            
            return { 
                error: 'No data found', 
                data: null,
                context: {
                    workflowRunId: workflowRunId,
                    workflowOwnerRepo: this.workflowOwnerRepo,
                    url: url
                }
            };
        } catch (err) {
            this.context.log(`GitHub API client artifact list workflow error: ${err.message}`);
            
            // If it's not one of our error objects with context, add context now
            if (!err.context) {
                err.context = {
                    workflowRunId: workflowRunId,
                    workflowOwnerRepo: this.workflowOwnerRepo,
                    errorType: err.name,
                    errorStack: err.stack
                };
            }
            
            // Create a new error with context for consistency
            const enrichedError = new Error(err.message);
            enrichedError.context = err.context;
            throw enrichedError;
        }
    }

    /**
     * Finds an artifact by its name containing the specified GUID
     * @param {string} inputGuid - GUID to search for in artifact names
     * @param {string} [ownerRepo] - Repository in owner/repo format (optional, uses this.workflowOwnerRepo if not provided)
     * @returns {Promise<Object>} - The artifact item response
     */
    async getArtifactsListItem(inputGuid, ownerRepo) {
        try {
            if (!inputGuid || typeof inputGuid !== 'string') {
                throw new Error('Invalid GUID provided for artifact search');
            }

            // Use provided ownerRepo or fallback to the instance's workflowOwnerRepo
            const repoToUse = ownerRepo || this.workflowOwnerRepo;
            
            if (!repoToUse || typeof repoToUse !== 'string' || repoToUse.indexOf('/') === -1) {
                throw new Error('Invalid ownerRepo format. Must be in format "owner/repo"');
            }

            const url = `${this.baseUrl}/repos/${this.workflowOwnerRepo}/actions/artifacts`;

            const resp = await this.fetchWithGitHubAuth(url);
            if (!resp.ok) {
                // Use the common GitHub API error handler with context specific to this operation
                const contextData = {
                    url: url,
                    inputGuid: inputGuid,
                    ownerRepo: repoToUse
                };
                
                const { error, errorContext, errorMessage } = await processGitHubApiError(
                    resp, 
                    'fetch artifacts list', 
                    contextData, 
                    this.context
                );
                
                return { 
                    error: errorMessage, 
                    data: null,
                    context: errorContext
                };
            }
            
            const data = await resp.json();
            if (data && Array.isArray(data.artifacts)) {
                return { error: null, data }
            }
            
            return { 
                error: 'No artifacts array in response', 
                data: null,
                context: {
                    inputGuid: inputGuid,
                    ownerRepo: repoToUse,
                    responseKeys: Object.keys(data || {})
                }
            };
        } catch (err) {
            this.context.log(`GitHub API client artifact list workflow error: ${err.message}`);
            
            // If it's not one of our error objects with context, add context now
            if (!err.context) {
                err.context = {
                    inputGuid: inputGuid,
                    ownerRepo: ownerRepo || this.workflowOwnerRepo,
                    errorType: err.name,
                    errorStack: err.stack
                };
            }
            
            // Create a new error with context for consistency
            const enrichedError = new Error(err.message);
            enrichedError.context = err.context;
            throw enrichedError;
        }
    }

    /**
     * Downloads an artifact from GitHub Actions.
     * This is a two part request:
     * 1: GitHub api to artifact with bearer token, get 302 and read location header
     * 2: Use URL in location header without authorization
     * @param {string} downloadUrl - The GitHub API URL for the artifact
     * @returns {Promise<ArrayBuffer>} - The artifact contents as binary data
     */
    async getArtifactDownload(downloadUrl) {
        try {
            const response = await this.fetchWithGitHubAuth(downloadUrl, {
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

                this.context.log(`Following redirect to zip file: ${location}`);

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
                    error.context = {
                        status: fileResp.status,
                        statusText: fileResp.statusText,
                        downloadUrl,
                        redirectUrl: location,
                        responseDetails: errorDetails
                    };
                    throw error;
                }

                // return binary data (ArrayBuffer) so caller can save/unzip
                const zipFilebuffer = await fileResp.arrayBuffer();
                return zipFilebuffer;
            }

            if (response.ok) {
                // may be JSON or binary depending on response; return ArrayBuffer for binary safety
                return await response.arrayBuffer();
            }

            // Use the common GitHub API error handler with context specific to this operation
            const contextData = {
                downloadUrl
            };
            
            const { error } = await processGitHubApiError(
                response, 
                'download artifact', 
                contextData, 
                this.context
            );
            
            throw error;
        } catch (err) {
            this.context.log(`GitHub API client artifact download error: ${err.message}`);
            
            // If it's not one of our error objects with context, add context now
            if (!err.context) {
                err.context = {
                    downloadUrl,
                    errorType: err.name,
                    errorStack: err.stack
                };
            }
            
            throw err;
        }
    }

    /**
     * Triggers workflow with retry capability for improved resilience
     * @param {string} templateOwnerRep - Repository in owner/repo format
     * @param {string} incomingGuid - Unique identifier for this run
     * @param {number} maxRetries - Maximum number of retry attempts
     * @returns {Promise<Response>} - The final response from the workflow trigger
     */
    async triggerWorkflowWithRetry(templateOwnerRep, incomingGuid, maxRetries = 3) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.triggerWorkflow(templateOwnerRep, incomingGuid);
            } catch (err) {
                lastError = err;
                this.context.log(`Attempt ${attempt} failed: ${err.message}`);
                if (attempt < maxRetries) {
                    await sleep(retryDelayMultiplier * attempt); // Exponential backoff
                }
            }
        }
        throw lastError;
    }

    async getWorkflowRunByUniqueInputId(uniqueInputId) {
        try {

            // create utc date range from last 10 minutes
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const isoDate = tenMinutesAgo.toISOString();

            const url = `${this.baseUrl}/repos/${this.workflowOwnerRepo}/actions/workflows/${this.workflowId}/runs?per_page=100&branch=main&created:>=${isoDate}`;
            this.context.log(`Searching for workflow runs with unique input ID: ${uniqueInputId}`);

            const resp = await this.fetchWithGitHubAuth(url);
            if (!resp.ok) {
                const contextData = {
                    url: url,
                    uniqueInputId: uniqueInputId,
                    ownerRepo: ownerRepo
                };
                const { error, errorContext, errorMessage } = await processGitHubApiError(
                    resp,
                    'search workflow runs by unique input ID',
                    contextData,
                    this.context
                );
                return {
                    error: errorMessage,
                    data: null,
                    context: errorContext
                };
            }

            const data = await resp.json();
            const matchingRun = data.workflow_runs.find(run => run.head_commit.id === uniqueInputId);
            if (matchingRun) {
                return { error: null, data: matchingRun };
            }

            return {
                error: 'No matching workflow run found',
                data: null,
                context: {
                    uniqueInputId: uniqueInputId,
                    ownerRepo: ownerRepo,
                    url: url
                }
            };
        } catch (err) {
            this.context.log(`GitHub API client get workflow run by unique input ID error: ${err.message}`);

            if (!err.context) {
                err.context = {
                    uniqueInputId: uniqueInputId,
                    ownerRepo: ownerRepo,
                    errorType: err.name,
                    errorStack: err.stack
                };
            }

            const enrichedError = new Error(err.message);
            enrichedError.context = err.context;
            throw enrichedError;
        }
    }


    /**
     * Gets details for a specific workflow run
     * @param {string} ownerRepo - Repository in owner/repo format
     * @param {number|string} runId - The ID of the workflow run
     * @returns {Promise<Object>} - The workflow run details response
     */
    async getWorkflowRun(ownerRepo, runId) {
        try {
            // Validate input parameters
            if (!runId || (isNaN(Number(runId)) && typeof runId !== 'number')) {
                throw new Error(`Invalid runId provided for workflow run search: ${runId}`);
            }

            // GitHub workflow run ID should be a number or a string containing a number
            if (!runId || (isNaN(Number(runId)) && typeof runId !== 'number')) {
                throw new Error(`Invalid runId provided for workflow run search: ${runId}`);
            }

            const url = `${this.baseUrl}/repos/${this.workflowOwnerRepo}/actions/runs/${runId}`;
            this.context.log(`Fetching workflow run details: ${url}`);

            const resp = await this.fetchWithGitHubAuth(url);
            
            if (!resp.ok) {
                // Use the common GitHub API error handler with context specific to this operation
                const contextData = {
                    url: url,
                    runId: runId,
                    ownerRepo: ownerRepo
                };
                
                const { error, errorContext, errorMessage } = await processGitHubApiError(
                    resp, 
                    'fetch workflow run details', 
                    contextData, 
                    this.context
                );
                
                return { 
                    error: errorMessage, 
                    data: null,
                    context: errorContext
                };
            }
            
            const data = await resp.json();
            if (data) {
                return { error: null, data };
            }
            
            return { 
                error: 'No data found in workflow run response', 
                data: null,
                context: {
                    runId: runId,
                    ownerRepo: ownerRepo,
                    url: url
                }
            };
        } catch (err) {
            this.context.log(`GitHub API client get workflow run error: ${err.message}`);
            
            // If it's not one of our error objects with context, add context now
            if (!err.context) {
                err.context = {
                    runId: runId,
                    ownerRepo: ownerRepo,
                    errorType: err.name,
                    errorStack: err.stack
                };
            }
            
            // Create a new error with context for consistency
            const enrichedError = new Error(err.message);
            enrichedError.context = err.context;
            throw enrichedError;
        }
    }
}

module.exports = {
    GitHubApiClient,
    processGitHubApiError,
    createGitHubHeaders,
    sleep
};
