/**
 * Test script for the processTrivyResultsDetails function
 * 
 * Usage: 
 *   node test-trivy-processor.js path/to/your/trivy-results.json
 */

const fs = require('fs');
const path = require('path');
const { processTrivyResultsDetails } = require('../trivy-utils');

async function main() {
    // Get the file path from command line arguments
    const filePath = process.argv[2];
    
    if (!filePath) {
        console.error('Please provide a path to your Trivy results JSON file');
        console.error('Usage: node test-trivy-processor.js path/to/your/trivy-results.json');
        process.exit(1);
    }
    
    try {
        // Read and parse the JSON file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const trivyResults = JSON.parse(fileContent);
        
        // Prepare the trivyResults in the format expected by the function
        // If your file is already the full trivyResults object, use it directly
        // If it's a single result, wrap it in an object with the filename as key
        const formattedResults = {};
        
        if (trivyResults.SchemaVersion) {
            // This appears to be a single Trivy result file
            const filename = path.basename(filePath);
            formattedResults[filename] = trivyResults;
        } else {
            // Assume it's already in the expected format
            Object.assign(formattedResults, trivyResults);
        }
        
        // Process the results
        console.log('Processing Trivy results...');
        const processedResults = processTrivyResultsDetails(formattedResults);
        
        // Output the results in a nice format
        console.log('\n===== TRIVY SCAN RESULTS SUMMARY =====');
        console.log(` Artifact name: ${processedResults.artifactName}`);
        console.log(`  Image ID: ${processedResults.imageId}`);
        console.log(`  Repository: ${processedResults.repository}`);
        console.log(`  Tag: ${processedResults.tag}`);

        console.log('\nVulnerabilities:');
        console.log(`  Total: ${processedResults.totalVulnerabilities}`);
        console.log(`  Critical: ${processedResults.criticalVulns}`);
        console.log(`  High: ${processedResults.highVulns}`);
        console.log(`  Medium: ${processedResults.mediumVulns}`);
        console.log(`  Low: ${processedResults.lowVulns}`);
        
        console.log('\nMisconfigurations:');
        console.log(`  Total: ${processedResults.totalMisconfigurations}`);
        console.log(`  Critical: ${processedResults.criticalMisconfigurations}`);
        console.log(`  High: ${processedResults.highMisconfigurations}`);
        console.log(`  Medium: ${processedResults.mediumMisconfigurations}`);
        console.log(`  Low: ${processedResults.lowMisconfigurations}`);
        
        console.log('\nSecrets found:', processedResults.secretsFound);
        console.log('\nLicense issues:', processedResults.licenseIssues);
        
        // Output details for high and critical vulnerabilities
        // if (processedResults.vulnerabilityDetails.length > 0) {
        //     console.log('\n===== HIGH/CRITICAL VULNERABILITIES =====');
        //     processedResults.vulnerabilityDetails.forEach((vuln, index) => {
        //         console.log(`\n[${index + 1}] ${vuln.id} (${vuln.severity})`);
        //         console.log(`  Package: ${vuln.package} (${vuln.installedVersion})`);
        //         console.log(`  Fixed in: ${vuln.fixedVersion}`);
        //         console.log(`  Title: ${vuln.title}`);
        //         if (vuln.description && vuln.description.length < 200) {
        //             console.log(`  Description: ${vuln.description}`);
        //         }
        //     });
        // }
        
        // Output details for misconfiguration issues
        // if (processedResults.misconfigurationDetails.length > 0) {
        //     console.log('\n===== MISCONFIGURATIONS =====');
        //     processedResults.misconfigurationDetails.slice(0, 10).forEach((misconfig, index) => {
        //         console.log(`\n[${index + 1}] ${misconfig.id} (${misconfig.severity})`);
        //         console.log(`  Title: ${misconfig.title}`);
        //         console.log(`  Target: ${misconfig.target}`);
        //         console.log(`  Message: ${misconfig.message}`);
        //         if (misconfig.resolution) {
        //             console.log(`  Resolution: ${misconfig.resolution}`);
        //         }
        //     });
            
        //     if (processedResults.misconfigurationDetails.length > 10) {
        //         console.log(`\n... and ${processedResults.misconfigurationDetails.length - 10} more misconfigurations`);
        //     }
        // }
        
        // Output details for secrets found
        // if (processedResults.secretDetails.length > 0) {
        //     console.log('\n===== SECRETS FOUND =====');
        //     processedResults.secretDetails.forEach((secret, index) => {
        //         console.log(`\n[${index + 1}] ${secret.category}`);
        //         console.log(`  Title: ${secret.title}`);
        //         console.log(`  Target: ${secret.target}`);
        //         console.log(`  Match: ${secret.match}`);
        //     });
        // }
        
        // Output details for license issues
        // if (processedResults.licenseDetails.length > 0) {
        //     console.log('\n===== LICENSE ISSUES =====');
        //     processedResults.licenseDetails.forEach((license, index) => {
        //         console.log(`\n[${index + 1}] ${license.license} (${license.severity})`);
        //         console.log(`  Package: ${license.pkgName}`);
        //         console.log(`  Target: ${license.target}`);
        //     });
        // }
        
        // Output the full processed results as JSON if needed
        console.log('\nFor programmatic access, full results are available in processedResults variable');
        // Uncomment the next line to see the full JSON output
        // console.log(JSON.stringify(processedResults, null, 2));
        
    } catch (error) {
        console.error('Error processing Trivy results:', error);
        process.exit(1);
    }
}

main();
