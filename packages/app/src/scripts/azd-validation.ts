/* AZD Provision Test and Live Log Streaming */
import { ApiClient } from './api-client';

let currentRunId: string | null = null;
let currentGithubRunId: string | null = null;
let currentGithubRunUrl: string | null = null;
let currentWorkflowOrgRepo: string | null = null;
let currentTemplateUrl: string | null = null; // Store the template repo URL being validated
let pollingInterval: number | null = null;
let logElement: HTMLPreElement | null = null;
let stopButton: HTMLButtonElement | null = null;
let isValidationRunning = false;

function notify() {
  return (window as any).NotificationSystem || (window as any).Notifications;
}

function showInfo(title: string, message: string) {
  const n = notify();
  if (n?.showInfo) n.showInfo(title, message, 4000);
  else console.log(`${title}: ${message}`);
}

function showError(title: string, message: string) {
  const n = notify();
  if (n?.showError) n.showError(title, message, 8000);
  else console.error(`${title}: ${message}`);
}

function showSuccess(title: string, message: string) {
  const n = notify();
  if (n?.showSuccess) n.showSuccess(title, message, 3000);
  else console.log(`${title}: ${message}`);
}

function showLoading(title: string, message: string) {
  const n = notify();
  if (n?.loading) return n.loading(title, message);
  console.log(`${title}: ${message}`);
  return null;
}

function appendLog(logEl: HTMLPreElement | Console, message: string) {
  const timestamp = new Date().toISOString().substring(11, 19);
  const line = `[${timestamp}] ${message}\n`;

  if (logEl instanceof HTMLPreElement) {
    logEl.textContent += line;
    logEl.scrollTop = logEl.scrollHeight;
  } else {
    console.log(line);
  }
}

function createLogContainer(): HTMLPreElement {
  // Remove existing log container if present
  const existing = document.getElementById('azd-provision-logs');
  if (existing) existing.remove();

  const existingControls = document.getElementById('azd-provision-controls');
  if (existingControls) existingControls.remove();

    // Remove old status elements if they exist (they'll be recreated in controls container)
  const existingStatusBar = document.getElementById('azd-status-bar');
  if (existingStatusBar) existingStatusBar.remove();
  const existingPrincipalError = document.getElementById('azd-principal-error');
  if (existingPrincipalError) existingPrincipalError.remove();
  const existingIssueSection = document.getElementById('azd-issue-section');
  if (existingIssueSection) existingIssueSection.remove();
  const existingErrorDetails = document.getElementById('azd-error-details');
  if (existingErrorDetails) existingErrorDetails.remove();
  const existingFailedJobs = document.getElementById('azd-failed-jobs');
  if (existingFailedJobs) existingFailedJobs.remove();
  const existingGhRunLink = document.getElementById('azd-gh-run-link');
  if (existingGhRunLink) existingGhRunLink.remove();
  const existingLogsArchive = document.getElementById('azd-logs-archive-link');
  if (existingLogsArchive) existingLogsArchive.remove();
  const existingSuccessTile = document.getElementById('azd-success-tile');
  if (existingSuccessTile) existingSuccessTile.remove();

  // Create or get validation section container
  let validationSection = document.getElementById('validation-section') as HTMLElement | null;

  if (!validationSection) {
    validationSection = document.createElement('section');
    validationSection.id = 'validation-section';
    validationSection.className = 'validation-section';
    validationSection.style.cssText = `
      display: block;
      margin: 20px auto;
      max-width: 1200px;
      padding: 20px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    // Find best insertion point
    const searchSection = document.getElementById('search-section');
    const analysisSection = document.getElementById('analysis-section');
    const main = document.querySelector('main') || document.body;

    if (searchSection && searchSection.style.display !== 'none') {
      // Insert after search section
      searchSection.parentNode?.insertBefore(validationSection, searchSection.nextSibling);
    } else if (analysisSection) {
      // Insert before analysis section
      analysisSection.parentNode?.insertBefore(validationSection, analysisSection);
    } else {
      // Insert at beginning of main
      main.insertBefore(validationSection, main.firstChild);
    }

    // Add section header
    const header = document.createElement('h2');
    header.style.cssText = 'margin: 0 0 15px 0; color: #0078d4; font-size: 1.5rem;';
    header.innerHTML = '<i class="fas fa-rocket"></i> AZD Validation';
    validationSection.appendChild(header);
  }

  // Make sure validation section is visible
  validationSection.style.display = 'block';

  // Create log container
  const logEl = document.createElement('pre');
  logEl.id = 'azd-provision-logs';
  logEl.style.cssText = `
    max-height: 400px;
    overflow: auto;
    background: #0b0c0c;
    color: #d0d0d0;
    padding: 20px;
    border-radius: 6px;
    font-size: 12px;
    margin: 10px 0 20px 0;
    font-family: 'Courier New', monospace;
  `;

  // Append to validation section
  validationSection.appendChild(logEl);

  // Create controls container with cancel button
  const controls = document.createElement('div');
  controls.id = 'azd-provision-controls';
  controls.style.cssText = 'margin: 0 0 10px 0; display: flex; flex-direction: column; gap: 10px;';

  const stopBtn = document.createElement('button');
  stopBtn.id = 'azd-stop-btn';
  stopBtn.textContent = 'Cancel Validation';
  stopBtn.style.cssText = `
    padding: 8px 16px;
    background: #b10e1e;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
    font-size: 14px;
    font-weight: 500;
  `;
  stopBtn.disabled = true;

  controls.appendChild(stopBtn);
  validationSection.insertBefore(controls, logEl);

  stopButton = stopBtn;

  // Scroll to validation section
  setTimeout(() => {
    validationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  return logEl;
}

export async function testAzdProvision(repoUrl?: string) {
  // Prevent duplicate execution
  if (isValidationRunning) {
    console.warn('[azd-validation] Validation already running, ignoring duplicate request');
    showInfo('Validation Running', 'A validation is already in progress');
    return;
  }

  console.log('[azd-validation] Starting new validation request', { repoUrl });

  // Get report data from window or use provided repoUrl
  const reportData = (window as any).reportData;

  if (!repoUrl && !reportData) {
    showError('Error', 'No report data available to test AZD provision');
    return;
  }

  const templateUrl = repoUrl || reportData?.repoUrl;

  if (!templateUrl) {
    showError('Error', 'No repository URL found');
    return;
  }

  // Show confirmation dialog
  const n = notify();
  if (n?.confirm) {
    n.confirm(
      'Test AZD Provision',
      'This will trigger the template validation GitHub workflow for this repository. Proceed?',
      {
        confirmLabel: 'Start Validation',
        cancelLabel: 'Cancel',
        onConfirm: () => runValidation(templateUrl),
        onCancel: () => console.log('Validation cancelled by user'),
      },
    );
  } else {
    if (
      confirm(
        'This will trigger the template validation GitHub workflow for this repository. Proceed?',
      )
    ) {
      runValidation(templateUrl);
    }
  }
}

async function runValidation(templateUrl: string) {
  // Set running flag
  isValidationRunning = true;

  // Create log container
  logElement = createLogContainer();

  appendLog(logElement, 'Starting AZD validation...');
  appendLog(logElement, `Target repository: ${templateUrl}`);

  // Get API base
  const cfg: any = (window as any).TemplateDoctorConfig || {};
  const apiBase = cfg.apiBase || window.location.origin;

  appendLog(logElement, `API base: ${apiBase}`);

  // Show button loading state
  const testProvisionButton =
    document.getElementById('testProvisionButton') ||
    document.getElementById('testProvisionButton-direct') ||
    document.getElementById('testProvisionButton-fallback');

  let originalText = '';
  if (testProvisionButton) {
    originalText = testProvisionButton.innerHTML;
    testProvisionButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting…';
    (testProvisionButton as HTMLButtonElement).disabled = true;
  }

  const loadingNotification = showLoading(
    'Starting AZD Provision',
    'Triggering validation workflow...',
  );

  try {
    // Call validation-template endpoint
    const endpoint = `${apiBase}/api/v4/validation-template`;
    appendLog(logElement, `Calling: POST ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetRepoUrl: templateUrl,
        callbackUrl: window.location.href,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Validation start failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    currentRunId = data.runId || null;
    // Backend now returns workflowRunId instead of githubRunId
    currentGithubRunId = data.workflowRunId || data.githubRunId || null;
    currentWorkflowOrgRepo = data.workflowOrgRepo || null;
    currentGithubRunUrl = data.githubRunUrl || null;
    currentTemplateUrl = templateUrl; // Store the template URL for issue creation

    appendLog(logElement, `✓ Validation started`);
    appendLog(logElement, `Run ID: ${currentRunId}`);

    if (currentGithubRunId) {
      appendLog(logElement, `GitHub Run ID: ${currentGithubRunId}`);
    }

    if (currentGithubRunUrl) {
      appendLog(logElement, `GitHub Run URL: ${currentGithubRunUrl}`);

      // Add clickable button in controls (not logs)
      const controlsContainer = document.getElementById('azd-provision-controls');
      if (controlsContainer && !document.getElementById('azd-gh-run-link')) {
        const linkDiv = document.createElement('div');
        linkDiv.id = 'azd-gh-run-link';
        linkDiv.style.cssText =
          'margin: 0 0 15px 0; padding: 8px; background: #1a1b1c; border-left: 3px solid #0078d4; border-radius: 6px;';

        const linkButton = document.createElement('button');
        linkButton.textContent = '🔗 View GitHub Actions Run';
        linkButton.style.cssText =
          'background: #0078d4; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;';
        linkButton.onclick = () => window.open(currentGithubRunUrl!, '_blank');

        linkDiv.appendChild(linkButton);
        controlsContainer.appendChild(linkDiv);
      }
    }

    // Store in localStorage for correlation
    if (currentRunId) {
      try {
        localStorage.setItem(
          `validation_${currentRunId}`,
          JSON.stringify({
            githubRunId: currentGithubRunId,
            githubRunUrl: currentGithubRunUrl,
            templateUrl,
          }),
        );
        localStorage.setItem(
          'lastValidationRunInfo',
          JSON.stringify({
            runId: currentRunId,
            githubRunId: currentGithubRunId,
            githubRunUrl: currentGithubRunUrl,
            templateUrl,
          }),
        );
      } catch (e) {
        console.warn('Failed to save validation info to localStorage:', e);
      }
    }

    if (loadingNotification?.success) {
      loadingNotification.success(
        'Validation Started',
        currentGithubRunUrl
          ? 'Workflow started. Opening GitHub run in a new tab.'
          : 'Workflow started. Monitor status below.',
      );
    } else {
      showSuccess('Validation Started', 'Workflow triggered successfully');
    }

    // Enable cancel button
    if (stopButton && currentRunId) {
      stopButton.disabled = false;
      stopButton.onclick = () => cancelValidation();
    }

    // Start polling for status
    if (currentRunId) {
      startStatusPolling(apiBase, currentRunId);
    }
  } catch (error: any) {
    appendLog(logElement, `✗ Error: ${error.message}`);
    showError('Validation Failed', error.message || 'Failed to start validation');

    // Clear running flag on error
    isValidationRunning = false;

    if (loadingNotification?.error) {
      loadingNotification.error('Validation Failed', error.message);
    }
  } finally {
    // Restore button state
    if (testProvisionButton) {
      setTimeout(() => {
        testProvisionButton.innerHTML = originalText || 'Test AZD Provision';
        (testProvisionButton as HTMLButtonElement).disabled = false;
        (testProvisionButton as HTMLButtonElement).style.backgroundColor = '';
      }, 500);
    }
  }
}

async function cancelValidation() {
  if (!currentRunId || !logElement || !stopButton) return;

  stopButton.disabled = true;
  const prevText = stopButton.textContent;
  stopButton.textContent = 'Cancelling…';

  appendLog(logElement, 'Requesting cancellation...');

  try {
    const cfg: any = (window as any).TemplateDoctorConfig || {};
    const apiBase = cfg.apiBase || window.location.origin;
    const endpoint = `${apiBase}/api/v4/validation-cancel`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: currentRunId,
        githubRunId: currentGithubRunId,
        githubRunUrl: currentGithubRunUrl,
        workflowOrgRepo: currentWorkflowOrgRepo,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cancel failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    appendLog(
      logElement,
      `✓ Cancellation requested for GitHub run ${data.githubRunId || currentGithubRunId}`,
    );
    appendLog(logElement, 'Waiting for status to reflect "cancelled"...');

    showInfo('Cancellation Requested', 'Workflow will stop shortly');
  } catch (error: any) {
    appendLog(logElement, `✗ Cancel error: ${error.message}`);
    showError('Cancel Failed', error.message);
    stopButton.disabled = false;
    stopButton.textContent = prevText || 'Cancel Validation';
  }
}

function startStatusPolling(apiBase: string, runId: string) {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  let attempts = 0;
  const MAX_ATTEMPTS = 60; // ~30 minutes at 30s intervals

  const poll = async () => {
    attempts++;

    if (!logElement || attempts > MAX_ATTEMPTS) {
      stopPolling();
      if (logElement) {
        appendLog(logElement, 'Polling stopped (max attempts reached)');
      }
      return;
    }

    try {
      const url = new URL(`${apiBase}/api/v4/validation-status`);
      // Send workflowRunId (numeric GitHub run ID) and workflowOrgRepo
      if (currentGithubRunId) {
        url.searchParams.set('workflowRunId', currentGithubRunId);
      } else {
        // Fallback to runId if workflowRunId not available (shouldn't happen)
        console.warn(
          'Fallback: workflowRunId not available, using runId instead. This should not happen.',
          { runId, currentGithubRunId },
        );
        url.searchParams.set('runId', runId);
      }
      if (currentWorkflowOrgRepo) {
        url.searchParams.set('workflowOrgRepo', currentWorkflowOrgRepo);
      }
      url.searchParams.set('includeLogsUrl', '1');
      if (currentGithubRunId) {
        url.searchParams.set('githubRunId', currentGithubRunId);
      }

      const response = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const status = await response.json();

      if (status.status) {
        const statusMsg = status.conclusion
          ? `${status.status} (${status.conclusion})`
          : status.status;
        appendLog(logElement!, `[status] ${statusMsg}`);
      }

      // Check for logs archive URL - move to controls
      if (status.logsArchiveUrl && !document.getElementById('azd-logs-archive-link')) {
        const controlsContainer = document.getElementById('azd-provision-controls');
        if (controlsContainer) {
          const linkDiv = document.createElement('div');
          linkDiv.id = 'azd-logs-archive-link';
          linkDiv.style.cssText =
            'margin: 0 0 15px 0; padding: 8px; background: #1a1b1c; border-left: 3px solid #28a745; border-radius: 6px;';
          linkDiv.innerHTML = `<a href="${status.logsArchiveUrl}" target="_blank" style="color: #4fc3f7; text-decoration: none;">📥 Download Logs Archive</a>`;
          controlsContainer.appendChild(linkDiv);
        }
      }

      // Check if workflow is complete
      if (status.status === 'completed' || status.conclusion) {
        stopPolling();

        // Clear running flag
        isValidationRunning = false;

        if (status.conclusion === 'success') {
          appendLog(logElement!, '✓ Validation completed successfully!');

          // Show celebratory success tile in controls (not logs)
          const controlsContainer = document.getElementById('azd-provision-controls');
          if (controlsContainer && !document.getElementById('azd-success-tile')) {
            const successTile = document.createElement('div');
            successTile.id = 'azd-success-tile';
            successTile.style.cssText =
              'margin: 0 0 15px 0; padding: 20px; background: linear-gradient(135deg, #1e4620 0%, #2d5a2e 100%); border-left: 4px solid #4caf50; border-radius: 8px; box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);';
            successTile.innerHTML = `
              <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 48px;">🏆</div>
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 8px 0; color: #4caf50; font-size: 20px; font-weight: bold;">Validation Passed!</h3>
                  <p style="margin: 0; color: #a5d6a7; font-size: 14px;">All checks completed successfully. Your template meets all requirements! 🎉</p>
                </div>
              </div>
            `;
            controlsContainer.appendChild(successTile);
          }

          showSuccess('Validation Complete', 'Template validation passed!');
        } else if (status.conclusion === 'failure') {
          appendLog(logElement!, '✗ Validation failed');

          // Calculate elapsed time
          const startTime = status.started_at ? new Date(status.started_at) : null;
          const endTime = status.completed_at ? new Date(status.completed_at) : new Date();
          const elapsedMs = startTime ? endTime.getTime() - startTime.getTime() : 0;
          const elapsedMin = Math.floor(elapsedMs / 60000);
          const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
          const elapsedTime = `${elapsedMin}m ${elapsedSec}s`;

          console.log('[DEBUG] Elapsed time calculation:', { startTime, endTime, elapsedMs, elapsedTime });

          // Get controls container to append action buttons
          const controlsContainer = document.getElementById('azd-provision-controls');
          console.log('[azd-validation] Controls container found:', controlsContainer);
          console.log('[azd-validation] Controls container HTML:', controlsContainer?.outerHTML);
          if (!controlsContainer) {
            console.error('[azd-validation] Controls container not found!');
            return;
          }

          // Create status bar in controls (only if it doesn't exist)
          if (!document.getElementById('azd-status-bar')) {
            const statusBar = document.createElement('div');
            statusBar.id = 'azd-status-bar';
            statusBar.style.cssText =
              'margin: 0 0 15px 0; padding: 15px; background: linear-gradient(135deg, #1a1b1c 0%, #2d1f1f 100%); border-radius: 8px; border: 1px solid #f44336;';
            statusBar.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="font-size: 32px;">❌</div>
                  <div>
                    <h3 style="margin: 0; color: #f44336; font-size: 18px;">Validation Failed</h3>
                    <div style="display: flex; gap: 20px; margin-top: 4px;">
                      <span style="color: #999; font-size: 13px;">⏱️ ${elapsedTime}</span>
                      <span style="color: #999; font-size: 13px;">📋 Failed Jobs: ${status.failedJobs?.length || 0}</span>
                    </div>
                  </div>
                </div>
                ${
                  currentGithubRunUrl
                    ? `<a href="${currentGithubRunUrl}" target="_blank" style="padding: 8px 16px; background: #0078d4; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">🔗 View GitHub Run</a>`
                    : ''
                }
              </div>
            `;

            // Append to controls container
            console.log('[azd-validation] Appending status bar to controls');
            console.log('[DEBUG] controlsContainer:', controlsContainer);
            console.log('[DEBUG] controlsContainer.parentElement:', controlsContainer.parentElement);
            debugger; // STOP HERE TO INSPECT
            controlsContainer.appendChild(statusBar);
            console.log('[azd-validation] Status bar appended. Controls HTML:', controlsContainer.outerHTML.substring(0, 200));
          }

          // Check for UnmatchedPrincipalType error (ServicePrincipal vs User mismatch)
          const errorText = status.errorSummary || '';
          const hasUnmatchedPrincipalError = /UnmatchedPrincipalType[\s\S]*has type[\s\S]*ServicePrincipal[\s\S]*different from[\s\S]*PrinciaplType[\s\S]*User/i.test(errorText);

          if (hasUnmatchedPrincipalError && !document.getElementById('azd-principal-error')) {
            // Show specific guidance for UnmatchedPrincipalType error in controls
            const principalErrorDiv = document.createElement('div');
            principalErrorDiv.id = 'azd-principal-error';
            principalErrorDiv.style.cssText =
              'margin: 0 0 15px 0; padding: 15px; background: linear-gradient(135deg, #2d1f1f 0%, #3d2f1f 100%); border-left: 4px solid #ff9800; border-radius: 8px; flex: 1;';
            principalErrorDiv.innerHTML = `
              <div style="display: flex; align-items: start; gap: 12px;">
                <div style="font-size: 32px;">⚠️</div>
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 10px 0; color: #ff9800; font-size: 16px;">Detected: Principal Type Mismatch</h4>
                  <p style="margin: 0 0 10px 0; color: #ffa726; font-size: 14px; line-height: 1.5;">
                    Your template is trying to assign a <strong>Service Principal</strong> to a role that expects a <strong>User</strong>.
                    This happens when GitHub Actions runs with a Service Principal but your Bicep files expect a user principal.
                  </p>
                  <div style="background: #1a1b1c; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    <p style="margin: 0 0 8px 0; color: #4fc3f7; font-size: 13px; font-weight: bold;">✨ Solution:</p>
                    <p style="margin: 0; color: #ccc; font-size: 12px; line-height: 1.6;">
                      Add a <code style="background: #2d1f1f; padding: 2px 6px; border-radius: 3px; color: #4fc3f7;">createRoleForUser</code> flag to your <code style="background: #2d1f1f; padding: 2px 6px; border-radius: 3px;">main.bicep</code> file to conditionally create role assignments based on the principal type.
                    </p>
                  </div>
                  <a href="https://github.com/Azure-Samples/azd-template-artifacts/blob/main/docs/development-guidelines/trouble-shooting.md#error-unmatchedprincipaltype-the-principalid-id-has-type-serviceprincipal--which-is-different-from-specified-princiapltype-user" 
                     target="_blank" 
                     style="display: inline-block; padding: 8px 16px; background: #0078d4; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">
                    📚 View Fix Documentation
                  </a>
                </div>
              </div>
            `;
            // Append to controls container
            controlsContainer.appendChild(principalErrorDiv);
          }

          // Add "Create Issue" button in controls (only if it doesn't exist)
          if (status.html_url && !document.getElementById('azd-issue-section')) {
            const issueSection = document.createElement('div');
            issueSection.id = 'azd-issue-section';
            issueSection.style.cssText =
              'margin: 0 0 15px 0; padding: 15px; background: linear-gradient(135deg, #1a1b1c 0%, #1f2c3d 100%); border-radius: 8px; border: 1px solid #0078d4;';
            
            const issueButton = document.createElement('button');
            issueButton.textContent = '🐛 Create GitHub Issue with Fix Guidance';
            issueButton.style.cssText =
              'width: 100%; background: #0078d4; color: white; border: none; padding: 12px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.2s;';
            issueButton.onmouseover = () => (issueButton.style.background = '#005a9e');
            issueButton.onmouseout = () => (issueButton.style.background = '#0078d4');
            issueButton.onclick = () => createValidationIssue(status);

            issueSection.appendChild(issueButton);
            // Append to controls container
            console.log('[azd-validation] Appending issue section to controls');
            console.log('[DEBUG ISSUE] controlsContainer:', controlsContainer);
            console.log('[DEBUG ISSUE] controlsContainer.parentElement:', controlsContainer.parentElement);
            console.log('[DEBUG ISSUE] controlsContainer in DOM?', document.contains(controlsContainer));
            debugger; // STOP HERE TO INSPECT ISSUE BUTTON
            controlsContainer.appendChild(issueSection);
            console.log('[azd-validation] Issue section appended. Controls children count:', controlsContainer.children.length);
          }

          // Show error details if available - move to controls
          if (status.errorSummary && !document.getElementById('azd-error-details')) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'azd-error-details';
            errorDiv.style.cssText =
              'margin: 0 0 15px 0; padding: 12px; background: #2d1f1f; border-left: 3px solid #f44336; font-family: monospace; font-size: 12px; white-space: pre-wrap; border-radius: 6px;';
            errorDiv.innerHTML = `<strong style="color: #f44336;">Error Details:</strong>\n${status.errorSummary}`;
            controlsContainer.appendChild(errorDiv);
          }

          // Add links to failed jobs - move to controls
          if (status.failedJobs && status.failedJobs.length > 0 && !document.getElementById('azd-failed-jobs')) {
            const jobsDiv = document.createElement('div');
            jobsDiv.id = 'azd-failed-jobs';
            jobsDiv.style.cssText =
              'margin: 0 0 15px 0; padding: 12px; background: #1a1b1c; border-left: 3px solid #ff9800; border-radius: 6px;';

            let jobsHtml = '<strong style="color: #ff9800;">Failed Jobs:</strong><br>';
            status.failedJobs.forEach((job: any) => {
              jobsHtml += `<a href="${job.html_url}" target="_blank" style="color: #4fc3f7; text-decoration: none; display: block; margin: 5px 0;">📋 ${job.name}</a>`;
              if (job.failedSteps && job.failedSteps.length > 0) {
                jobsHtml += '<div style="margin-left: 20px; color: #999;">';
                job.failedSteps.forEach((step: any) => {
                  jobsHtml += `  ❌ Step ${step.number}: ${step.name}<br>`;
                });
                jobsHtml += '</div>';
              }
            });
            jobsDiv.innerHTML = jobsHtml;
            controlsContainer.appendChild(jobsDiv);
          }

          showError('Validation Failed', 'Template validation encountered errors');
        } else if (status.conclusion === 'cancelled') {
          appendLog(logElement!, '⚠ Validation cancelled');
          showInfo('Validation Cancelled', 'Workflow was cancelled');
        } else {
          appendLog(logElement!, `⚠ Validation ended: ${status.conclusion || 'unknown'}`);
        }

        // Disable cancel button
        if (stopButton) {
          stopButton.disabled = true;
          stopButton.textContent = 'Validation Complete';
        }
      }
    } catch (error: any) {
      console.error('Status polling error:', error);
      appendLog(logElement!, `⚠ Status check failed: ${error.message}`);
    }
  };

  // Poll immediately, then every 30 seconds
  poll();
  pollingInterval = window.setInterval(poll, 30000);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  // Clear running flag when polling stops
  isValidationRunning = false;
}

/**
 * Create a GitHub issue for validation failures
 */
function createValidationIssue(status: any) {
  // Use the stored template URL from the current validation
  const targetRepoUrl = currentTemplateUrl || '';

  if (!targetRepoUrl) {
    showError('Missing Information', 'Cannot determine target repository. Please ensure validation was started with a valid repo URL.');
    return;
  }

  // Extract owner/repo from URL
  const match = targetRepoUrl.match(/https?:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    showError('Invalid URL', 'Could not parse repository from URL');
    return;
  }

  const [, owner, repo] = match;

  // Check for UnmatchedPrincipalType error
  const errorText = status.errorSummary || '';
  const hasUnmatchedPrincipalError = /UnmatchedPrincipalType[\s\S]*has type[\s\S]*ServicePrincipal[\s\S]*different from[\s\S]*PrinciaplType[\s\S]*User/i.test(errorText);

  // Build issue title
  const title = hasUnmatchedPrincipalError
    ? `[Template Doctor] Fix: Principal Type Mismatch in Role Assignment`
    : `[Template Doctor] AZD Validation Failed`;

  // Build issue body
  let body = `## AZD Validation Failure Report\n\n`;
  body += `**Repository:** ${targetRepoUrl}\n`;
  body += `**Validation Run:** ${status.html_url || 'N/A'}\n`;
  body += `**Status:** ${status.status} (${status.conclusion})\n`;
  body += `**Date:** ${new Date().toISOString()}\n\n`;

  // Add specific guidance for UnmatchedPrincipalType error
  if (hasUnmatchedPrincipalError) {
    body += `### ⚠️ Detected Issue: Principal Type Mismatch\n\n`;
    body += `Your template has a **Service Principal** vs **User** principal type mismatch in role assignments. `;
    body += `This happens when GitHub Actions runs with a Service Principal but your Bicep files expect a user principal.\n\n`;
    body += `### ✅ Recommended Fix\n\n`;
    body += `Add a \`createRoleForUser\` parameter to conditionally create role assignments:\n\n`;
    body += `\`\`\`bicep\n`;
    body += `// In main.bicep\n`;
    body += `@description('Flag to decide whether to create OpenAI role for current user')\n`;
    body += `param createRoleForUser bool = true\n\n`;
    body += `// User roles (conditional)\n`;
    body += `module openAiRoleUser 'core/security/role.bicep' = if (createRoleForUser) {\n`;
    body += `  scope: resourceGroup\n`;
    body += `  name: 'openai-role-user'\n`;
    body += `  params: {\n`;
    body += `    principalId: principalId\n`;
    body += `    roleDefinitionId: cognitiveServicesOpenAIUserRole.id\n`;
    body += `    principalType: 'User'\n`;
    body += `  }\n`;
    body += `}\n`;
    body += `\`\`\`\n\n`;
    body += `**Reference:** [Azure Samples Troubleshooting Guide](https://github.com/Azure-Samples/azd-template-artifacts/blob/main/docs/development-guidelines/trouble-shooting.md#error-unmatchedprincipaltype-the-principalid-id-has-type-serviceprincipal--which-is-different-from-specified-princiapltype-user)\n\n`;
    body += `**Example PR:** [azure-openai-assistant-javascript#18](https://github.com/Azure-Samples/azure-openai-assistant-javascript/pull/18/files)\n\n`;
  }

  if (status.errorSummary) {
    body += `### Error Summary\n\n\`\`\`\n${status.errorSummary}\n\`\`\`\n\n`;
  }

  if (status.failedJobs && status.failedJobs.length > 0) {
    body += `### Failed Jobs\n\n`;
    status.failedJobs.forEach((job: any) => {
      body += `- [${job.name}](${job.html_url})\n`;
      if (job.failedSteps && job.failedSteps.length > 0) {
        job.failedSteps.forEach((step: any) => {
          body += `  - ❌ Step ${step.number}: ${step.name}\n`;
        });
      }
    });
    body += `\n`;
  }

  body += `### Next Steps\n\n`;
  body += `1. Review the [workflow run logs](${status.html_url})\n`;
  body += `2. Check for common issues:\n`;
  body += `   - Missing or incorrect Azure infrastructure files\n`;
  body += `   - Invalid azd template configuration\n`;
  body += `   - Docker image build failures\n`;
  body += `   - Resource deployment errors\n`;
  body += `3. Fix identified issues and re-run validation\n\n`;
  body += `---\n`;
  body += `*This issue was created automatically by [Template Doctor](https://github.com/Template-Doctor/template-doctor)*`;

  // Create GitHub issue URL with pre-filled data
  const issueUrl =
    `https://github.com/${owner}/${repo}/issues/new?` +
    `title=${encodeURIComponent(title)}&` +
    `body=${encodeURIComponent(body)}&` +
    `labels=bug,azd-validation`;

  // Open in new tab
  window.open(issueUrl, '_blank');

  showInfo('Issue Created', 'Opening GitHub issue form in new tab');
}

// Track if listeners are already registered to prevent duplicates
let listenersRegistered = false;

// Expose globally for compatibility
(window as any).testAzdProvision = testAzdProvision;

// Listen for validation requests from template cards and dashboard
if (!listenersRegistered) {
  document.addEventListener('template-card-validate', (e: any) => {
    const template = e.detail?.template;
    if (template?.repoUrl) {
      testAzdProvision(template.repoUrl);
    }
  });

  // Listen for dashboard button clicks (when reportData is available)
  document.addEventListener('DOMContentLoaded', () => {
    // Wire up test provision button if it exists
    const testProvisionButton =
      document.getElementById('testProvisionButton') ||
      document.getElementById('testProvisionButton-direct') ||
      document.getElementById('testProvisionButton-fallback');

    if (testProvisionButton) {
      testProvisionButton.addEventListener('click', () => {
        testAzdProvision();
      });
    }
  });

  listenersRegistered = true;
}

export { testAzdProvision as default };
