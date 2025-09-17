/**
 * Trivy scanner utility functions for processing scan results and calculating security scores
 */
const { extractFilesFromZip } = require('./zip-utils');


/**
 * Processes Trivy scan results to extract detailed information about vulnerabilities, 
 * misconfigurations, secrets, and license issues
 * @param {Object} trivyResults - Parsed Trivy results from extractTrivyResults
 * @returns {Object} - Detailed analysis of the scan results
 */
function processTrivyResultsDetails(trivyResults, includeAllDetails = false) {
    // Aggregated counters for overall summary
    let totalMisconfigurations = 0;
    let criticalMisconfigurations = 0;
    let highMisconfigurations = 0;
    let mediumMisconfigurations = 0;
    let lowMisconfigurations = 0;
    let misconfigurationDetails = [];

    // Count vulnerabilities
    let totalVulnerabilities = 0;
    let criticalVulns = 0;
    let highVulns = 0;
    let mediumVulns = 0;
    let lowVulns = 0;
    let vulnerabilityDetails = [];

    // Count secrets and licenses
    let secretsFound = 0;
    let licenseIssues = 0;
    let secretDetails = [];
    let licenseDetails = [];

    // Create an object to store per-artifact results
    const artifactResults = {};

    // Analyze each Trivy result file for security issues
    for (const [filename, result] of Object.entries(trivyResults)) {
        // Initialize per-artifact counters and metadata
        const artifactInfo = {
            filename,
            artifactName: result.ArtifactName || 'unknown',
            artifactType: result.ArtifactType || 'unknown',
            imageId: '',
            repository: '',
            tag: '',
            digest: '',
            metadata: {},
            os: {
                family: '',
                name: '',
                version: ''
            },
            vulnerabilities: {
                total: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                details: []
            },
            misconfigurations: {
                total: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                details: []
            },
            secrets: {
                count: 0,
                details: []
            },
            licenses: {
                count: 0,
                details: []
            }
        };

        // Extract image metadata if available
        if (result.Metadata && includeAllDetails) {
            artifactInfo.metadata = result.Metadata;

            // Size info
            if (result.Metadata.Size) {
                artifactInfo.size = result.Metadata.Size;
            }

            // OS info
            if (result.Metadata.OS) {
                artifactInfo.os.family = result.Metadata.OS.Family || '';
                artifactInfo.os.name = result.Metadata.OS.Name || '';
                artifactInfo.os.version = result.Metadata.OS.Version || '';
            }

            // Image repository/tag info (from name or repo fields)
            if (result.Metadata.ImageID) {
                artifactInfo.imageId = result.Metadata.ImageID;
            }
            if (result.Metadata.RepoDigests && result.Metadata.RepoDigests.length > 0) {
                const digestParts = result.Metadata.RepoDigests[0].split('@');
                if (digestParts.length > 0) {
                    artifactInfo.repository = digestParts[0].split(':')[0];
                    artifactInfo.digest = digestParts.length > 1 ? digestParts[1] : '';
                }
            }
            if (result.Metadata.RepoTags && result.Metadata.RepoTags.length > 0) {
                const tagParts = result.Metadata.RepoTags[0].split(':');
                artifactInfo.repository = artifactInfo.repository || tagParts[0];
                artifactInfo.tag = tagParts.length > 1 ? tagParts[1] : 'latest';
            }
        }

        if (result.Results) {

            for (const scanResult of result.Results) {
                // Process misconfigurations
                if (scanResult.MisconfSummary) {
                    if (scanResult.MisconfSummary.Failures) {
                        totalMisconfigurations += scanResult.MisconfSummary.Failures;
                        artifactInfo.misconfigurations.total += scanResult.MisconfSummary.Failures;
                    }
                }

                if (scanResult.Misconfigurations && Array.isArray(scanResult.Misconfigurations)) {
                    for (const misconfig of scanResult.Misconfigurations) {
                        if (misconfig.Severity === 'CRITICAL') {
                            criticalMisconfigurations++;
                            artifactInfo.misconfigurations.critical++;
                        } else if (misconfig.Severity === 'HIGH') {
                            highMisconfigurations++;
                            artifactInfo.misconfigurations.high++;
                        } else if (misconfig.Severity === 'MEDIUM') {
                            mediumMisconfigurations++;
                            artifactInfo.misconfigurations.medium++;
                        } else if (misconfig.Severity === 'LOW') {
                            lowMisconfigurations++;
                            artifactInfo.misconfigurations.low++;
                        }

                        // Create misconfiguration detail object
                        const misconfigDetail = {
                            id: misconfig.ID,
                            title: misconfig.Title,
                            severity: misconfig.Severity,
                            target: scanResult.Target || misconfig.FilePath || 'unknown',
                            type: scanResult.Type || misconfig.Type || 'unknown',
                            message: misconfig.Message || 'No message provided',
                            resolution: misconfig.Resolution || 'No resolution provided'
                        };

                        // Add to global and per-artifact lists
                        if(includeAllDetails){
                            misconfigurationDetails.push(misconfigDetail);
                            artifactInfo.misconfigurations.details.push(misconfigDetail);
                        }
                    }
                }

                // Process vulnerabilities
                if (scanResult.Vulnerabilities && Array.isArray(scanResult.Vulnerabilities)) {
                    for (const vuln of scanResult.Vulnerabilities) {
                        totalVulnerabilities++;
                        artifactInfo.vulnerabilities.total++;

                        if (vuln.Severity === 'CRITICAL') {
                            criticalVulns++;
                            artifactInfo.vulnerabilities.critical++;
                        } else if (vuln.Severity === 'HIGH') {
                            highVulns++;
                            artifactInfo.vulnerabilities.high++;
                        } else if (vuln.Severity === 'MEDIUM') {
                            mediumVulns++;
                            artifactInfo.vulnerabilities.medium++;
                        } else if (vuln.Severity === 'LOW') {
                            lowVulns++;
                            artifactInfo.vulnerabilities.low++;
                        }

                        // Create vulnerability detail object
                        const vulnDetail = {
                            id: vuln.VulnerabilityID,
                            package: vuln.PkgName,
                            installedVersion: vuln.InstalledVersion,
                            fixedVersion: vuln.FixedVersion || 'Not available',
                            severity: vuln.Severity,
                            title: vuln.Title || 'N/A',
                            description: vuln.Description || 'N/A',
                            target: scanResult.Target || 'unknown'
                        };

                        // Add critical and high vulnerabilities to global details
                        if (vuln.Severity === 'CRITICAL' || vuln.Severity === 'HIGH') {
                            if(includeAllDetails){
                                vulnerabilityDetails.push(vulnDetail);
                            }
                        }

                        // Add all vulnerabilities to per-artifact details
                        if(includeAllDetails){
                            artifactInfo.vulnerabilities.details.push(vulnDetail);
                        }
                    }
                }

                // Process secrets
                if (scanResult.Secrets && Array.isArray(scanResult.Secrets)) {
                    secretsFound += scanResult.Secrets.length;
                    artifactInfo.secrets.count += scanResult.Secrets.length;

                    for (const secret of scanResult.Secrets) {
                        const secretDetail = {
                            category: secret.Category || 'Unknown',
                            title: secret.Title || 'Secret found',
                            target: scanResult.Target || secret.FilePath || 'unknown',
                            match: secret.Match ? secret.Match.substring(0, 10) + '...' : 'Hidden'
                        };

                        if(includeAllDetails){
                            secretDetails.push(secretDetail);
                            artifactInfo.secrets.details.push(secretDetail);
                        }
                    }
                }

                // Process license issues
                if (scanResult.Licenses && Array.isArray(scanResult.Licenses)) {
                    for (const license of scanResult.Licenses) {
                        if (license.Severity) {
                            licenseIssues++;
                            artifactInfo.licenses.count++;

                            const licenseDetail = {
                                pkgName: license.PkgName || 'Unknown',
                                license: license.Name || 'Unknown license',
                                severity: license.Severity || 'UNKNOWN',
                                target: scanResult.Target || 'unknown'
                            };

                            if(includeAllDetails){
                                licenseDetails.push(licenseDetail);
                                artifactInfo.licenses.details.push(licenseDetail);
                            }
                        }
                    }
                }
            }
        }

        // Store the artifact results
        artifactResults[filename] = artifactInfo;
    }

    // Find the primary artifact if there are multiple results
    let primaryArtifact = null;
    const artifactKeys = Object.keys(artifactResults);
    if (artifactKeys.length > 0) {
        // Look for container or image scan first
        primaryArtifact = artifactResults[artifactKeys.find(k =>
            artifactResults[k].artifactType === 'container' ||
            artifactResults[k].artifactType === 'image'
        ) || artifactKeys[0]];
    }

    // Return the processed results
    return {
        // Summary counters
        totalMisconfigurations,
        criticalMisconfigurations,
        highMisconfigurations,
        mediumMisconfigurations,
        lowMisconfigurations,
        misconfigurationDetails,
        totalVulnerabilities,
        criticalVulns,
        highVulns,
        mediumVulns,
        lowVulns,
        vulnerabilityDetails,
        secretsFound,
        licenseIssues,
        secretDetails,
        licenseDetails,

        // Artifact information
        artifacts: artifactResults,
        artifactCount: artifactKeys.length,

        // Primary artifact information (if available)
        artifactName: primaryArtifact ? primaryArtifact.artifactName : '',
        artifactType: primaryArtifact ? primaryArtifact.artifactType : '',
        imageId: primaryArtifact ? primaryArtifact.imageId : '',
        repository: primaryArtifact ? primaryArtifact.repository : '',
        tag: primaryArtifact ? primaryArtifact.tag : '',
        digest: primaryArtifact ? primaryArtifact.digest : '',
        os: primaryArtifact ? primaryArtifact.os : { family: '', name: '', version: '' }
    };
}

/**
 * Extracts Trivy results from ZIP archive containing scan results
 * @param {Object} context - Azure Functions context for logging
 * @param {ArrayBuffer} zipData - The ZIP file as an ArrayBuffer
 * @param {string} [correlationId] - Optional ID to correlate logs across operations
 * @returns {Promise<Object>} - Parsed Trivy results
 */
async function extractTrivyResults(context, zipData, correlationId = null) {
    const requestId = correlationId || `trivy-extract-${Date.now()}`;
    
    try {
        const files = await extractFilesFromZip(zipData, context, correlationId);
        context.log(`Extracted ${Object.keys(files).length} files from ZIP archive`, { 
            operation: 'extractTrivyResults',
            fileCount: Object.keys(files).length,
            requestId
        });

        // Look for Trivy results files in the extracted files
        const trivyResults = {};

        for (const [filename, content] of Object.entries(files)) {
            // Typically Trivy outputs JSON files with scan results
            if (filename.endsWith('.json')) {
                try {
                    const parsed = JSON.parse(content);
                    trivyResults[filename] = parsed;
                } catch (parseErr) {
                    context.log.warn(`Failed to parse JSON from ${filename}`, {
                        error: parseErr.message,
                        stack: parseErr.stack,
                        filename,
                        operation: 'extractTrivyResults',
                        requestId
                    });
                }
            }
        }

        context.log(`Found ${Object.keys(trivyResults).length} valid Trivy result files`, {
            operation: 'extractTrivyResults',
            validFiles: Object.keys(trivyResults).length,
            requestId
        });
        
        return trivyResults;
    } catch (err) {
        context.log.error(`Error extracting Trivy results`, {
            error: err.message,
            stack: err.stack,
            operation: 'extractTrivyResults',
            requestId
        });
        throw new Error(`Failed to extract Trivy results: ${err.message}`);
    }
}

/**
 * Calculates a security score based on Trivy scan results
 * @param {Object} trivyResults - Parsed Trivy results from extractTrivyResults
 * @returns {Object} - Object containing security score and detailed breakdown
 */
function calculateTrivyScore(trivyResults) {
    // Initialize counters for different types of security issues
    let totalVulnerabilities = 0;
    let criticalVulns = 0;
    let highVulns = 0;
    let mediumVulns = 0;
    let lowVulns = 0;
    let unknownVulns = 0;

    let fixableVulns = 0;
    let unfixableVulns = 0;

    let totalMisconfigurations = 0;
    let criticalMisconfigs = 0;
    let highMisconfigs = 0;
    let mediumMisconfigs = 0;
    let lowMisconfigs = 0;

    let secretsFound = 0;
    let licenseIssues = 0;

    // Analyze each Trivy result file
    for (const [filename, result] of Object.entries(trivyResults)) {
        // Check if the result has Results section in the expected format
        if (result.Results && Array.isArray(result.Results)) {
            for (const scanResult of result.Results) {
                // Process vulnerabilities
                if (scanResult.Vulnerabilities && Array.isArray(scanResult.Vulnerabilities)) {
                    for (const vuln of scanResult.Vulnerabilities) {
                        totalVulnerabilities++;

                        // Count by severity
                        if (vuln.Severity === 'CRITICAL') {
                            criticalVulns++;
                        } else if (vuln.Severity === 'HIGH') {
                            highVulns++;
                        } else if (vuln.Severity === 'MEDIUM') {
                            mediumVulns++;
                        } else if (vuln.Severity === 'LOW') {
                            lowVulns++;
                        } else {
                            unknownVulns++;
                        }

                        // Count fixable vs unfixable
                        if (vuln.FixedVersion) {
                            fixableVulns++;
                        } else {
                            unfixableVulns++;
                        }
                    }
                }

                // Process misconfigurations
                if (scanResult.Misconfigurations && Array.isArray(scanResult.Misconfigurations)) {
                    for (const misconfig of scanResult.Misconfigurations) {
                        totalMisconfigurations++;

                        if (misconfig.Severity === 'CRITICAL') {
                            criticalMisconfigs++;
                        } else if (misconfig.Severity === 'HIGH') {
                            highMisconfigs++;
                        } else if (misconfig.Severity === 'MEDIUM') {
                            mediumMisconfigs++;
                        } else if (misconfig.Severity === 'LOW') {
                            lowMisconfigs++;
                        }
                    }
                }

                // Check for secrets
                if (scanResult.Secrets && Array.isArray(scanResult.Secrets)) {
                    secretsFound += scanResult.Secrets.length;
                }

                // Check for license issues
                if (scanResult.Licenses && Array.isArray(scanResult.Licenses)) {
                    for (const license of scanResult.Licenses) {
                        if (license.Severity) {
                            licenseIssues++;
                        }
                    }
                }
            }
        }
    }

    // Enhanced weighted scoring algorithm
    // Base score is 10.0
    let score = 10.0;

    // Deduct points for vulnerabilities based on severity and weighted impact
    // Critical vulnerabilities have the highest impact
    const criticalImpact = Math.min(4.0, criticalVulns * 0.8);
    score -= criticalImpact;

    // High vulnerabilities have significant impact
    const highImpact = Math.min(3.0, highVulns * 0.3);
    score -= highImpact;

    // Medium vulnerabilities have moderate impact
    const mediumImpact = Math.min(2.0, mediumVulns * 0.1);
    score -= mediumImpact;

    // Low vulnerabilities have minimal impact
    const lowImpact = Math.min(1.0, lowVulns * 0.02);
    score -= lowImpact;

    // Misconfigurations also impact the score
    const misconfigImpact = Math.min(
        3.0,
        (criticalMisconfigs * 0.5) +
        (highMisconfigs * 0.2) +
        (mediumMisconfigs * 0.05) +
        (lowMisconfigs * 0.01)
    );
    score -= misconfigImpact;

    // Secrets found are a serious concern
    const secretsImpact = Math.min(2.0, secretsFound * 0.5);
    score -= secretsImpact;

    // License issues have a smaller impact
    const licenseImpact = Math.min(1.0, licenseIssues * 0.1);
    score -= licenseImpact;

    // Apply a bonus for high percentage of fixable vulnerabilities
    let fixableBonus = 0;
    if (totalVulnerabilities > 0) {
        const fixablePercentage = fixableVulns / totalVulnerabilities;
        fixableBonus = fixablePercentage * 0.5; // Max bonus of 0.5
    }
    score += fixableBonus;

    // Ensure score is between 0 and 10
    score = Math.max(0, Math.min(10, score));

    // Generate descriptive security assessment
    let securityAssessment = '';
    if (score >= 9.0) {
        securityAssessment = 'Excellent security posture with very few or no significant vulnerabilities';
    } else if (score >= 7.0) {
        securityAssessment = 'Good security posture with some minor vulnerabilities that should be reviewed';
    } else if (score >= 5.0) {
        securityAssessment = 'Moderate security concerns with some significant vulnerabilities that should be addressed';
    } else if (score >= 3.0) {
        securityAssessment = 'Serious security issues with multiple high or critical vulnerabilities that must be fixed';
    } else {
        securityAssessment = 'Critical security problems that make this image unsuitable for production use without remediation';
    }

    // Return comprehensive result
    return {
        score: Math.round(score * 10) / 10, // Round to 1 decimal place
        assessment: securityAssessment,
        deductions: {
            criticalVulnerabilities: criticalImpact,
            highVulnerabilities: highImpact,
            mediumVulnerabilities: mediumImpact,
            lowVulnerabilities: lowImpact,
            misconfigurations: misconfigImpact,
            secrets: secretsImpact,
            licenses: licenseImpact
        },
        bonus: {
            fixable: fixableBonus
        },
        counts: {
            vulnerabilities: {
                total: totalVulnerabilities,
                critical: criticalVulns,
                high: highVulns,
                medium: mediumVulns,
                low: lowVulns,
                unknown: unknownVulns,
                fixable: fixableVulns,
                unfixable: unfixableVulns
            },
            misconfigurations: {
                total: totalMisconfigurations,
                critical: criticalMisconfigs,
                high: highMisconfigs,
                medium: mediumMisconfigs,
                low: lowMisconfigs
            },
            secrets: secretsFound,
            licenseIssues: licenseIssues
        }
    };
}

/**
 * Helper function to add issues consistently with improved error classification
 * @param {Array} issues - The issues array to add to
 * @param {string} id - Unique identifier for the issue
 * @param {string} severity - Severity level (critical, error, warning, info)
 * @param {string} message - Human-readable message describing the issue
 * @param {Object} details - Optional details about the issue
 * @param {Object} context - Optional logging context
 */
function addIssue(issues, id, severity, message, details = null, context = null) {
    // Determine issue type based on details and error pattern
    let issueType = 'general';
    let adjustedSeverity = severity;
    
    if (details) {
        // Check for network errors
        if (details.error && (
            details.code === 'ECONNREFUSED' || 
            details.code === 'ETIMEDOUT' || 
            details.code === 'ENOTFOUND' ||
            String(details.error).includes('network') ||
            String(details.error).includes('connection') ||
            String(details.error).includes('timeout')
        )) {
            issueType = 'network_error';
            // Network errors are usually more critical than general errors
            if (adjustedSeverity === 'warning') {
                adjustedSeverity = 'error';
            }
        }
        
        // Check for permission/auth errors
        else if (details.error && (
            details.code === 'EACCES' ||
            details.code === 'EPERM' ||
            String(details.error).includes('permission') ||
            String(details.error).includes('unauthorized') ||
            String(details.error).includes('forbidden') ||
            String(details.error).includes('auth')
        )) {
            issueType = 'permission_error';
            // Auth errors are usually critical
            if (adjustedSeverity === 'warning') {
                adjustedSeverity = 'error';
            }
        }
        
        // Check for GitHub API errors
        else if (details.error && (
            String(details.error).includes('GitHub') ||
            String(details.error).includes('rate limit') ||
            String(details.error).includes('API')
        )) {
            issueType = 'github_api_error';
        }
        
        // Check for file system errors
        else if (details.error && (
            details.code === 'ENOENT' ||
            details.code === 'EISDIR' ||
            String(details.error).includes('file') ||
            String(details.error).includes('directory') ||
            String(details.error).includes('not found')
        )) {
            issueType = 'filesystem_error';
        }
        
        // Check for parsing errors
        else if (details.error && (
            String(details.error).includes('parse') ||
            String(details.error).includes('JSON') ||
            String(details.error).includes('syntax')
        )) {
            issueType = 'parsing_error';
        }
    }

    const issue = {
        id,
        severity: adjustedSeverity,
        type: issueType,
        message,
        timestamp: new Date().toISOString()
    };

    if (details) {
        // If details contains an error property with just a message, enhance it
        if (details.error && typeof details.error === 'string' && !details.stack) {
            details.errorMessage = details.error;
            delete details.error;
        }
        
        issue.details = details;
    } else if (arguments.length > 4 && arguments[4] !== null) {
        issue.error = arguments[4];
    }
    
    // Log the issue if context is provided
    if (context && context.log) {
        const logLevel = adjustedSeverity === 'critical' ? 'error' : 
                        adjustedSeverity === 'error' ? 'error' :
                        adjustedSeverity === 'warning' ? 'warn' : 'info';
        
        // Use the appropriate log level method
        if (logLevel === 'error' && context.log.error) {
            context.log.error(`Issue [${id}] (${issueType}): ${message}`, { 
                issueId: id, 
                severity: adjustedSeverity,
                type: issueType,
                ...(details ? { details } : {})
            });
        } else if (logLevel === 'warn' && context.log.warn) {
            context.log.warn(`Issue [${id}] (${issueType}): ${message}`, { 
                issueId: id, 
                severity: adjustedSeverity,
                type: issueType,
                ...(details ? { details } : {})
            });
        } else {
            context.log(`Issue [${id}] (${issueType}): ${message}`, { 
                issueId: id, 
                severity: adjustedSeverity, 
                type: issueType,
                logLevel,
                ...(details ? { details } : {})
            });
        }
    }

    issues.push(issue);
}

/**
 * Process the repository scan artifact (scan-repo-*)
 * @param {Object} context - Azure Functions context for logging
 * @param {Object} client - ScorecardClient instance
 * @param {Object} repoArtifact - Repository scan artifact
 * @param {string} templateOwnerRepo - Repository in owner/repo format
 * @param {Object} artifact - Workflow run artifact
 * @param {number} maxScore - Maximum possible security score
 * @param {Array} issues - Array to add issues to
 * @param {Array} compliance - Array to add compliance information to
 * @param {string} [correlationId] - Optional ID to correlate logs across operations
 * @returns {Promise<Object>} - Result of processing the repository scan
 */

/* Trivy command which created .json 
trivy repo --scanners vuln,secret,misconfig,license $REPO_NAME  --format json
*/
async function processRepoScanArtifact(context, client, repoArtifact, templateOwnerRepo, artifact, maxScore, issues, compliance, correlationId = null) {
    const requestId = correlationId || `repo-scan-${repoArtifact.id || Date.now()}`;
    
    try {
        const repoZipData = await client.getArtifactDownload(repoArtifact.archive_download_url);

        if (!repoZipData) {
            addIssue(issues, 'docker-image-score-repo-artifact-download-failed', 'warning',
                `Failed to download repository scan artifact`,
                { templateOwnerRepo, artifact, repoArtifact });
            return { success: false, error: 'Failed to download artifact' };
        }

        // Process the zip data to extract Trivy results and calculate score
        context.log(`Repository scan artifact downloaded`, {
            operation: 'processRepoScanArtifact',
            templateOwnerRepo,
            bytesDownloaded: repoZipData.byteLength,
            artifactName: repoArtifact.name,
            correlationId: repoArtifact.id
        });

        // Extract files from the ZIP archive
        const extractedFiles = await extractFilesFromZip(repoZipData);
        context.log(`Extracted files from repository scan artifact`, {
            operation: 'processRepoScanArtifact',
            fileCount: Object.keys(extractedFiles).length,
            templateOwnerRepo
        });

        // Extract Trivy results from the files
        const trivyResults = await extractTrivyResults(context, repoZipData);
        context.log(`Processed Trivy result files`, {
            operation: 'processRepoScanArtifact',
            resultCount: Object.keys(trivyResults).length,
            templateOwnerRepo
        });

        // Call function to process Trivy results
        const processedResults = processTrivyResultsDetails(trivyResults, true);

        // Extract processed results
        const {
            totalMisconfigurations,
            criticalMisconfigurations,
            highMisconfigurations,
            mediumMisconfigurations,
            lowMisconfigurations,
            misconfigurationDetails,
            totalVulnerabilities,
            criticalVulns,
            highVulns,
            mediumVulns,
            lowVulns,
            vulnerabilityDetails,
            secretsFound,
            licenseIssues,
            secretDetails,
            licenseDetails
        } = processedResults;

        context.log(`Analysis results`, {
            operation: 'processRepoScanArtifact',
            templateOwnerRepo,
            misconfigurations: {
                total: totalMisconfigurations,
                critical: criticalMisconfigurations,
                high: highMisconfigurations,
                medium: mediumMisconfigurations,
                low: lowMisconfigurations
            },
            vulnerabilities: {
                total: totalVulnerabilities,
                critical: criticalVulns,
                high: highVulns,
                medium: mediumVulns,
                low: lowVulns
            },
            secrets: secretsFound,
            licenseIssues: licenseIssues
        });

        // Calculate comprehensive security score
        const securityResult = calculateTrivyScore(trivyResults);
        const score = securityResult.score;
        const assessment = securityResult.assessment;

        context.log(`Repository scan artifact processed. Trivy score: ${score.toFixed(1)} - ${assessment}`);

        // Add the score to compliance if it meets minimum threshold
        const threshold = maxScore * 0.7; // Example threshold: 70% of max score

        if (score >= threshold) {
            compliance.push({
                id: 'docker-image-score-meets-minimum',
                category: 'security',
                message: `Docker image security score ${score.toFixed(1)} >= ${threshold.toFixed(1)} - ${assessment}`,
                details: {
                    templateOwnerRepo,
                    score: score.toFixed(1),
                    assessment,
                    threshold: threshold.toFixed(1),
                    maxScore: maxScore.toFixed(1),
                    fileCount: Object.keys(extractedFiles).length,
                    resultCount: Object.keys(trivyResults).length,
                    scoreBreakdown: {
                        deductions: securityResult.deductions,
                        bonus: securityResult.bonus
                    },
                    vulnerabilities: {
                        total: totalVulnerabilities,
                        critical: criticalVulns,
                        high: highVulns,
                        medium: mediumVulns,
                        low: lowVulns
                    },
                    misconfigurations: {
                        total: totalMisconfigurations,
                        critical: criticalMisconfigurations,
                        high: highMisconfigurations,
                        medium: mediumMisconfigurations,
                        low: lowMisconfigurations
                    },
                    secrets: secretsFound,
                    licenseIssues: licenseIssues
                }
            });
        } else {
            addIssue(issues, 'docker-image-score-below-minimum', 'warning',
                `Docker image security score ${score.toFixed(1)} < ${threshold.toFixed(1)} - ${assessment}`,
                {
                    templateOwnerRepo,
                    score: score.toFixed(1),
                    assessment,
                    threshold: threshold.toFixed(1),
                    maxScore: maxScore.toFixed(1),
                    fileCount: Object.keys(extractedFiles).length,
                    resultCount: Object.keys(trivyResults).length,
                    scoreBreakdown: {
                        deductions: securityResult.deductions,
                        bonus: securityResult.bonus
                    },
                    vulnerabilities: {
                        total: totalVulnerabilities,
                        critical: criticalVulns,
                        high: highVulns,
                        medium: mediumVulns,
                        low: lowVulns
                    },
                    misconfigurations: {
                        total: totalMisconfigurations,
                        critical: criticalMisconfigurations,
                        high: highMisconfigurations,
                        medium: mediumMisconfigurations,
                        low: lowMisconfigurations
                    },
                    secrets: secretsFound,
                    licenseIssues: licenseIssues
                });
        }

        // Add specific issues for critical and high misconfigurations if found
        if (criticalMisconfigurations > 0 || highMisconfigurations > 0) {
            addIssue(issues, 'docker-image-critical-high-misconfigurations', 'warning',
                `Found ${criticalMisconfigurations} critical and ${highMisconfigurations} high severity misconfigurations`,
                {
                    templateOwnerRepo,
                    misconfigurations: {
                        critical: criticalMisconfigurations,
                        high: highMisconfigurations,
                        details: misconfigurationDetails.filter(m =>
                            m.severity === 'CRITICAL' || m.severity === 'HIGH'
                        )
                    },
                    recommendations: [
                        'Review Docker security best practices',
                        'Fix identified misconfigurations',
                        'Implement proper file permissions',
                        'Remove hardcoded secrets or credentials'
                    ]
                });
        }

        // Add specific issues for critical and high vulnerabilities if found
        if (criticalVulns > 0 || highVulns > 0) {
            addIssue(issues, 'docker-image-critical-high-vulnerabilities', 'warning',
                `Found ${criticalVulns} critical and ${highVulns} high severity vulnerabilities`,
                {
                    templateOwnerRepo,
                    vulnerabilities: {
                        critical: criticalVulns,
                        high: highVulns,
                        details: vulnerabilityDetails.slice(0, 10) // Limit to 10 most severe
                    },
                    recommendations: [
                        'Update dependencies to patched versions',
                        'Consider alternative packages if fixes not available',
                        'Implement security scanning in CI/CD pipeline',
                        'Regularly update base images'
                    ]
                });
        }

        // If secrets found, add a critical issue
        if (secretsFound > 0) {
            addIssue(issues, 'docker-image-secrets-found', 'critical',
                `Found ${secretsFound} potential secrets in repository code`,
                {
                    templateOwnerRepo,
                    secretsCount: secretsFound,
                    details: secretDetails,
                    recommendations: [
                        'Remove all secrets from code immediately',
                        'Rotate any exposed credentials',
                        'Use environment variables or secure secret storage',
                        'Implement pre-commit hooks to prevent secrets in code'
                    ]
                });
        }

        // If any misconfigurations exist, add them to compliance as something to improve
        if (totalMisconfigurations > 0) {
            compliance.push({
                id: 'docker-image-misconfigurations-found',
                category: 'security',
                message: `Found ${totalMisconfigurations} misconfigurations that should be addressed`,
                details: {
                    templateOwnerRepo,
                    misconfigurations: {
                        total: totalMisconfigurations,
                        critical: criticalMisconfigurations,
                        high: highMisconfigurations,
                        medium: mediumMisconfigurations,
                        low: lowMisconfigurations,
                        details: misconfigurationDetails.slice(0, 20) // Limit to top 20
                    },
                    recommendations: [
                        'Follow Docker security best practices',
                        'Use minimal base images',
                        'Remove unnecessary permissions',
                        'Implement proper user contexts'
                    ]
                }
            });
        }

        return {
            success: true,
            score,
            assessment,
            threshold,
            fileCount: Object.keys(extractedFiles).length,
            resultCount: Object.keys(trivyResults).length,
            scoreBreakdown: {
                deductions: securityResult.deductions,
                bonus: securityResult.bonus
            },
            vulnerabilities: {
                total: totalVulnerabilities,
                critical: criticalVulns,
                high: highVulns,
                medium: mediumVulns,
                low: lowVulns,
                details: vulnerabilityDetails
            },
            misconfigurations: {
                total: totalMisconfigurations,
                critical: criticalMisconfigurations,
                high: highMisconfigurations,
                medium: mediumMisconfigurations,
                low: lowMisconfigurations,
                details: misconfigurationDetails
            },
            secrets: {
                count: secretsFound,
                details: secretDetails
            },
            licenses: {
                issuesCount: licenseIssues,
                details: licenseDetails
            }
        };
    } catch (err) {
        context.log.error(`Error processing repository scan artifact`, {
            operation: 'processRepoScanArtifact',
            templateOwnerRepo,
            artifactName: repoArtifact?.name,
            error: err.message,
            stack: err.stack,
            code: err.code
        });
        
        addIssue(issues, 'docker-image-score-repo-artifact-processing-error', 'warning',
            'Failed to process repository scan artifact',
            { 
                templateOwnerRepo,
                artifactName: repoArtifact?.name,
                error: err.message,
                stack: err.stack,
                code: err.code
            }, 
            context);
            
        return { success: false, error: err.message, errorDetails: { stack: err.stack, code: err.code } };
    }
}

/**
 * Process an individual image scan artifact (scan-image-*)
 * @param {Object} context - Azure Functions context for logging
 * @param {Object} client - ScorecardClient instance
 * @param {Object} imageArtifact - Image scan artifact
 * @param {string} templateOwnerRepo - Repository in owner/repo format
 * @param {number} maxScore - Maximum possible security score
 * @param {Array} issues - Array to add issues to
 * @param {Array} compliance - Array to add compliance information to
 * @param {string} [correlationId] - Optional ID to correlate logs across operations
 * @returns {Promise<Object>} - Result of processing the image scan
 */
async function processImageScanArtifact(context, client, imageArtifact, templateOwnerRepo, maxScore, issues, compliance, correlationId = null) {
    const requestId = correlationId || `image-scan-${imageArtifact.id || Date.now()}`;
    const imageName = imageArtifact.name.replace('scan-image-', '').replace(/-/g, '/');
    
    try {
        context.log(`Processing image scan artifact`, {
            operation: 'processImageScanArtifact',
            templateOwnerRepo,
            imageName,
            artifactName: imageArtifact.name,
            requestId
        });
        // Extract image name and tag from artifact name
        const imageName = imageArtifact.name.replace('scan-image-', '').replace(/-/g, '/');

        const imageZipData = await client.getArtifactDownload(imageArtifact.archive_download_url);

        if (!imageZipData) {
            addIssue(issues, 'docker-image-score-image-artifact-download-failed', 'warning',
                `Failed to download image scan artifact for ${imageName}`,
                { templateOwnerRepo, imageArtifact });
            return {
                success: false,
                error: 'Failed to download artifact',
                imageName
            };
        }

        // Process the zip data to extract Trivy results and calculate score
        context.log(`Image scan artifact downloaded (${imageZipData.byteLength} bytes). Processing...`);

        // Extract files from the ZIP archive
        const extractedFiles = await extractFilesFromZip(imageZipData);
        context.log(`Extracted ${Object.keys(extractedFiles).length} files from image scan artifact`);

        // Extract Trivy results from the files
        const trivyResults = await extractTrivyResults(imageZipData);
        context.log(`Found ${Object.keys(trivyResults).length} Trivy result files for image ${imageName}`);

        // Analyze vulnerabilities in detail
        let totalVulnerabilities = 0;
        let criticalVulns = 0;
        let highVulns = 0;
        let mediumVulns = 0;
        let lowVulns = 0;
        let vulnerabilityDetails = [];

        // Analyze image metadata
        let imageSize = 0;
        let osFamily = '';
        let osVersion = '';
        let layersCount = 0;

        // Analyze each Trivy result file
        for (const [filename, result] of Object.entries(trivyResults)) {
            // Extract image metadata if available
            if (result.Metadata) {
                if (result.Metadata.Size) {
                    imageSize = result.Metadata.Size;
                }
                if (result.Metadata.OS) {
                    osFamily = result.Metadata.OS.Family || '';
                    osVersion = result.Metadata.OS.Name || '';
                }
                if (result.Metadata.Layers && Array.isArray(result.Metadata.Layers)) {
                    layersCount = result.Metadata.Layers.length;
                }
            }

            // Analyze vulnerabilities
            if (result.Results) {
                for (const scanResult of result.Results) {
                    if (scanResult.Vulnerabilities && Array.isArray(scanResult.Vulnerabilities)) {
                        for (const vuln of scanResult.Vulnerabilities) {
                            totalVulnerabilities++;

                            if (vuln.Severity === 'CRITICAL') {
                                criticalVulns++;
                            } else if (vuln.Severity === 'HIGH') {
                                highVulns++;
                            } else if (vuln.Severity === 'MEDIUM') {
                                mediumVulns++;
                            } else if (vuln.Severity === 'LOW') {
                                lowVulns++;
                            }

                            // Add detailed information for critical and high vulnerabilities
                            if (vuln.Severity === 'CRITICAL' || vuln.Severity === 'HIGH') {
                                vulnerabilityDetails.push({
                                    id: vuln.VulnerabilityID,
                                    package: vuln.PkgName,
                                    installedVersion: vuln.InstalledVersion,
                                    severity: vuln.Severity,
                                    title: vuln.Title || 'N/A',
                                    description: vuln.Description || 'N/A',
                                    fixedVersion: vuln.FixedVersion || 'N/A'
                                });
                            }
                        }
                    }
                }
            }
        }

        // Enhanced scoring algorithm:
        // Base score is 10, with deductions based on vulnerabilities by severity
        let score = 10.0;

        // Critical vulnerabilities have the highest impact
        score -= Math.min(5, criticalVulns * 1.0);

        // High vulnerabilities have significant impact
        score -= Math.min(3, highVulns * 0.5);

        // Medium vulnerabilities have moderate impact
        score -= Math.min(1.5, mediumVulns * 0.1);

        // Low vulnerabilities have minimal impact
        score -= Math.min(0.5, lowVulns * 0.02);

        // Ensure score is between 0 and 10
        score = Math.max(0, Math.min(10, score));

        // Generate descriptive text explaining the score
        let securityText = '';

        if (score >= 9.0) {
            securityText = 'This image has excellent security with very few or no vulnerabilities.';
        } else if (score >= 7.0) {
            securityText = 'This image has good security but contains some minor vulnerabilities that should be reviewed.';
        } else if (score >= 5.0) {
            securityText = 'This image has moderate security concerns with some significant vulnerabilities that should be addressed.';
        } else if (score >= 3.0) {
            securityText = 'This image has serious security issues with multiple high or critical vulnerabilities that must be fixed.';
        } else {
            securityText = 'This image has critical security problems and should not be used in production until fixed.';
        }

        context.log(`Image scan artifact processed for ${imageName}. Trivy score: ${score.toFixed(1)} - ${securityText}`);

        // Add the score to compliance if it meets minimum threshold
        const threshold = maxScore * 0.7; // Example threshold: 70% of max score

        if (score >= threshold) {
            compliance.push({
                id: 'docker-image-individual-score-meets-minimum',
                category: 'security',
                message: `Docker image ${imageName} security score ${score.toFixed(1)} >= ${threshold.toFixed(1)} - ${securityText}`,
                details: {
                    templateOwnerRepo,
                    imageName,
                    score: score.toFixed(1),
                    threshold: threshold.toFixed(1),
                    maxScore: maxScore.toFixed(1),
                    securityText,
                    imageMetadata: {
                        size: imageSize,
                        os: `${osFamily} ${osVersion}`.trim(),
                        layersCount
                    },
                    vulnerabilities: {
                        total: totalVulnerabilities,
                        critical: criticalVulns,
                        high: highVulns,
                        medium: mediumVulns,
                        low: lowVulns
                    }
                }
            });
        } else {
            addIssue(issues, 'docker-image-individual-score-below-minimum', 'warning',
                `Docker image ${imageName} security score ${score.toFixed(1)} < ${threshold.toFixed(1)} - ${securityText}`,
                {
                    templateOwnerRepo,
                    imageName,
                    score: score.toFixed(1),
                    threshold: threshold.toFixed(1),
                    maxScore: maxScore.toFixed(1),
                    securityText,
                    imageMetadata: {
                        size: imageSize,
                        os: `${osFamily} ${osVersion}`.trim(),
                        layersCount
                    },
                    vulnerabilities: {
                        total: totalVulnerabilities,
                        critical: criticalVulns,
                        high: highVulns,
                        medium: mediumVulns,
                        low: lowVulns
                    }
                });
        }

        // Add specific issues for critical and high vulnerabilities if found
        if (criticalVulns > 0 || highVulns > 0) {
            addIssue(issues, 'docker-image-individual-critical-high-vulnerabilities', 'warning',
                `Image ${imageName} has ${criticalVulns} critical and ${highVulns} high severity vulnerabilities`,
                {
                    templateOwnerRepo,
                    imageName,
                    vulnerabilities: {
                        critical: criticalVulns,
                        high: highVulns,
                        details: vulnerabilityDetails.slice(0, 10) // Limit to 10 most severe vulnerabilities
                    },
                    remediationAdvice: 'Update base image to latest version or use a more secure alternative. Regularly update dependencies and apply security patches.'
                });
        }

        return {
            success: true,
            imageName,
            score,
            securityText,
            threshold,
            fileCount: Object.keys(extractedFiles).length,
            resultCount: Object.keys(trivyResults).length,
            imageMetadata: {
                size: imageSize,
                os: `${osFamily} ${osVersion}`.trim(),
                layersCount
            },
            vulnerabilities: {
                total: totalVulnerabilities,
                critical: criticalVulns,
                high: highVulns,
                medium: mediumVulns,
                low: lowVulns,
                details: vulnerabilityDetails
            }
        };
    } catch (err) {
        const imageName = imageArtifact.name.replace('scan-image-', '').replace(/-/g, '/');
        context.log.error(`Error processing image scan artifact`, {
            operation: 'processImageScanArtifact',
            templateOwnerRepo,
            imageName,
            artifactName: imageArtifact?.name,
            error: err.message,
            stack: err.stack,
            code: err.code
        });
        
        addIssue(issues, 'docker-image-image-artifact-processing-error', 'warning',
            `Failed to process image scan artifact for ${imageName}`,
            { 
                templateOwnerRepo,
                imageName,
                artifactName: imageArtifact?.name,
                error: err.message,
                stack: err.stack,
                code: err.code
            }, 
            context);
            
        return {
            success: false,
            error: err.message,
            errorDetails: { stack: err.stack, code: err.code },
            imageName
        };
    }
}

/**
 * Process all Docker image artifacts from a workflow run and extract security information
 * @param {Object} context - Azure Functions context for logging
 * @param {Object} client - ScorecardClient instance
 * @param {Object} artifact - Workflow run artifact
 * @param {string} templateOwnerRepo - Repository in owner/repo format
 * @param {Array} artifacts - Array of workflow artifacts
 * @param {number} maxScore - Maximum possible security score
 * @param {Array} issues - Array to add issues to
 * @param {Array} compliance - Array to add compliance information to
 * @param {string} [correlationId] - Optional ID to correlate logs across operations
 * @returns {Promise<Object>} - Comprehensive security analysis result
 */
async function processDockerImageArtifacts(context, client, artifact, templateOwnerRepo, artifacts, maxScore, issues, compliance, correlationId = null) {
    const requestId = correlationId || `docker-artifacts-${artifact?.id || Date.now()}`;
    
    try {
        if (!artifacts || !Array.isArray(artifacts) || artifacts.length === 0) {
            addIssue(issues, 'docker-image-score-no-artifacts', 'warning',
                `No workflow artifacts found for docker-image score`,
                { templateOwnerRepo, artifact });
            return { success: false, error: 'No artifacts found' };
        }

        // Find the artifact that contains the Trivy scan results for the repo
        const repoArtifact = artifacts.find(a => typeof a.name === 'string' && a.name.startsWith(`scan-repo-`));
        if (!repoArtifact) {
            addIssue(issues, 'docker-image-score-no-repo-artifact', 'warning',
                `No repository scan artifact found in workflow artifacts`,
                { templateOwnerRepo, artifact, artifacts });
            return { success: false, error: 'No repository scan artifact found' };
        }

        // find all artifacts that contain Trivy scan results for images
        const imageArtifacts = artifacts.filter(a => typeof a.name === 'string' && a.name.startsWith(`scan-image-`));
        if (!imageArtifacts || imageArtifacts.length === 0) {
            addIssue(issues, 'docker-image-score-no-image-artifacts', 'warning',
                `No image scan artifacts found in workflow artifacts`,
                { templateOwnerRepo, artifact, artifacts });
            return { success: false, error: 'No image scan artifacts found' };
        }

        context.log(`Found ${imageArtifacts.length} image scan artifacts and 1 repo scan artifact for processing.`);

        // Process the repository scan artifact
        const repoScanResult = await processRepoScanArtifact(
            context, client, repoArtifact, templateOwnerRepo, artifact, maxScore, issues, compliance, requestId
        );

        // Process each image scan artifact
        const imageScanResults = [];
        for (const imageArtifact of imageArtifacts) {
            const imageScanResult = await processImageScanArtifact(
                context, client, imageArtifact, templateOwnerRepo, maxScore, issues, compliance, requestId
            );
            imageScanResults.push(imageScanResult);
        }

        // Calculate overall security score and generate comprehensive assessment
        const successfulImageScans = imageScanResults.filter(r => r.success);
        context.log(`Processed ${successfulImageScans.length} image scans successfully out of ${imageArtifacts.length} total.`);

        // If no successful scans, return early
        if (successfulImageScans.length === 0) {
            addIssue(issues, 'docker-image-score-no-successful-scans', 'warning',
                'No image scans were processed successfully',
                { templateOwnerRepo, artifact });
            return {
                success: false,
                error: 'No successful image scans',
                repoScan: repoScanResult,
                imageScans: imageScanResults
            };
        }

        // Calculate aggregate statistics from all successful scans
        let totalVulnerabilities = 0;
        let criticalVulns = 0;
        let highVulns = 0;
        let mediumVulns = 0;
        let lowVulns = 0;

        let totalMisconfigurations = 0;
        let criticalMisconfigs = 0;
        let highMisconfigs = 0;

        // Aggregate security metrics from all successful image scans
        for (const scan of successfulImageScans) {
            if (scan.vulnerabilities) {
                totalVulnerabilities += scan.vulnerabilities.total || 0;
                criticalVulns += scan.vulnerabilities.critical || 0;
                highVulns += scan.vulnerabilities.high || 0;
                mediumVulns += scan.vulnerabilities.medium || 0;
                lowVulns += scan.vulnerabilities.low || 0;
            }
        }

        // Also include repository misconfigurations if available
        if (repoScanResult && repoScanResult.success && repoScanResult.misconfigurations) {
            totalMisconfigurations += repoScanResult.misconfigurations.total || 0;
            criticalMisconfigs += repoScanResult.misconfigurations.critical || 0;
            highMisconfigs += repoScanResult.misconfigurations.high || 0;
        }

        // Calculate average score from successful scans
        const avgScore = successfulImageScans.reduce((sum, scan) => sum + (scan.score || 0), 0) / successfulImageScans.length;

        // Generate overall security assessment text
        let overallAssessment = '';
        if (avgScore >= 9.0) {
            overallAssessment = 'Excellent overall security posture with minimal vulnerabilities. These Docker images are well-maintained and suitable for production use.';
        } else if (avgScore >= 7.0) {
            overallAssessment = 'Good overall security posture, with some minor vulnerabilities that should be reviewed. These Docker images are generally safe but could benefit from updates.';
        } else if (avgScore >= 5.0) {
            overallAssessment = 'Moderate security concerns detected. These Docker images have significant vulnerabilities that should be addressed before production use.';
        } else if (avgScore >= 3.0) {
            overallAssessment = 'Serious security issues detected. These Docker images have multiple high or critical vulnerabilities that must be fixed before deployment.';
        } else {
            overallAssessment = 'Critical security problems detected. These Docker images are not suitable for production use without major security remediation.';
        }

        // Add comprehensive security report to compliance
        compliance.push({
            id: 'docker-image-security-assessment',
            category: 'security',
            message: `Docker image security assessment: ${avgScore.toFixed(1)}/10.0 - ${overallAssessment}`,
            details: {
                templateOwnerRepo,
                overallScore: avgScore.toFixed(1),
                assessment: overallAssessment,
                imagesScanned: successfulImageScans.length,
                aggregateVulnerabilities: {
                    total: totalVulnerabilities,
                    critical: criticalVulns,
                    high: highVulns,
                    medium: mediumVulns,
                    low: lowVulns
                },
                misconfigurations: {
                    total: totalMisconfigurations,
                    critical: criticalMisconfigs,
                    high: highMisconfigs
                },
                recommendations: [
                    criticalVulns > 0 ? 'Address all critical vulnerabilities immediately' : null,
                    highVulns > 0 ? 'Review and fix high severity vulnerabilities' : null,
                    criticalMisconfigs > 0 ? 'Fix critical security misconfigurations' : null,
                    avgScore < 7.0 ? 'Consider using more secure base images' : null,
                    'Implement regular security scanning in CI/CD pipelines',
                    'Keep base images updated with latest security patches'
                ].filter(Boolean) // Remove null values
            }
        });

        // If serious security issues found, add an issue
        if (criticalVulns > 0 || criticalMisconfigs > 0 || avgScore < 5.0) {
            addIssue(issues, 'docker-image-security-concerns', 'warning',
                `Serious security concerns detected in Docker images (Score: ${avgScore.toFixed(1)}/10.0)`,
                {
                    templateOwnerRepo,
                    score: avgScore.toFixed(1),
                    criticalVulnerabilities: criticalVulns,
                    highVulnerabilities: highVulns,
                    criticalMisconfigurations: criticalMisconfigs,
                    highMisconfigurations: highMisconfigs,
                    assessment: overallAssessment,
                    recommendations: [
                        'Update base images to latest secure versions',
                        'Apply security patches to dependencies',
                        'Review and fix Dockerfile security best practices',
                        'Implement vulnerability scanning in CI/CD pipeline'
                    ]
                });
        }

        return {
            success: true,
            overallScore: avgScore.toFixed(1),
            assessment: overallAssessment,
            repoScan: repoScanResult,
            imageScans: imageScanResults,
            aggregateStatistics: {
                imagesScanned: successfulImageScans.length,
                vulnerabilities: {
                    total: totalVulnerabilities,
                    critical: criticalVulns,
                    high: highVulns,
                    medium: mediumVulns,
                    low: lowVulns
                },
                misconfigurations: {
                    total: totalMisconfigurations,
                    critical: criticalMisconfigs,
                    high: highMisconfigs
                }
            }
        };
    } catch (err) {
        context.log.error(`Error processing Docker image artifacts`, {
            operation: 'processDockerImageArtifacts',
            templateOwnerRepo,
            artifactCount: artifacts?.length || 0,
            error: err.message,
            stack: err.stack,
            code: err.code,
            requestId
        });
        
        addIssue(issues, 'docker-image-score-artifact-processing-error', 'warning',
            'Failed to process docker-image artifacts',
            { 
                templateOwnerRepo,
                error: err.message,
                stack: err.stack,
                code: err.code,
                requestId
            }, 
            context);
            
        return { 
            success: false, 
            error: err.message,
            errorDetails: { 
                stack: err.stack, 
                code: err.code 
            }
        };
    }
}

module.exports = {
    extractTrivyResults,
    calculateTrivyScore,
    processDockerImageArtifacts,
    processRepoScanArtifact,
    processImageScanArtifact,
    processTrivyResultsDetails,
    addIssue
};
