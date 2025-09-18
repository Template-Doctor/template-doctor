#!/usr/bin/env node

/**
 * fetch-deprecated-models.js
 * 
 * This script fetches the list of deprecated or retiring OpenAI models from 
 * Microsoft's official documentation and outputs them in a format suitable
 * for updating Template Doctor's configuration.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// URL of Microsoft's model retirement documentation
const RETIREMENT_DOC_URL = 'https://learn.microsoft.com/azure/ai-foundry/concepts/model-lifecycle-retirement';

/**
 * Fetches HTML content from a URL, following redirects
 * @param {string} url - The URL to fetch
 * @returns {Promise<string>} - The HTML content
 */
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location;
        console.log(`Following redirect to ${redirectUrl}`);
        
        // Handle relative URLs in redirects
        const fullRedirectUrl = redirectUrl.startsWith('/')
          ? `https://learn.microsoft.com${redirectUrl}`
          : redirectUrl;
          
        fetchHtml(fullRedirectUrl)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Failed to load page, status code: ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Extracts OpenAI model names from the HTML content that are already deprecated
 * @param {string} html - The HTML content
 * @param {boolean} includeFuture - Whether to include models with future deprecation dates
 * @param {boolean} includeAllModels - Whether to include all model names regardless of naming pattern
 * @returns {string[]} - Array of deprecated model names
 */
function extractDeprecatedModels(html, includeFuture = false, includeAllModels = false) {
  const deprecatedModels = [];
  const today = new Date();
  console.log(`Today's date: ${today.toISOString().split('T')[0]}`);
  
  // Look for tables with model information
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  const tables = html.match(tableRegex) || [];
  
  console.log(`Found ${tables.length} tables in the document`);
  
  // Track models found in each table for debugging
  const modelsPerTable = [];
  
  tables.forEach((table, tableIndex) => {
    const tableModels = [];
    console.log(`\nProcessing table ${tableIndex + 1}`);
    
    // Look for rows containing model names and retirement dates
    const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    const rows = table.match(rowRegex) || [];
    
    console.log(`Table has ${rows.length} rows`);
    
    // First, identify which columns contain model names and dates
    let modelColumnIndex = 0;
    let legacyDateColumnIndex = -1;
    let deprecationDateColumnIndex = -1;
    let retirementDateColumnIndex = -1;
    
    // Check the header row for column names
    const headerRow = rows[0] || '';
    if (headerRow.includes('<th') || headerRow.includes('</th>')) {
      const headerCellRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
      const headerCells = [...headerRow.matchAll(headerCellRegex)];
      
      console.log('Header columns:');
      headerCells.forEach((match, index) => {
        const headerText = match[1].replace(/<[^>]*>/g, '').trim().toLowerCase();
        console.log(`  ${index}: ${headerText}`);
        
        if (headerText.includes('model') || headerText.includes('name')) {
          modelColumnIndex = index;
        }
        if (headerText.includes('legacy')) {
          legacyDateColumnIndex = index;
        }
        if (headerText.includes('deprecation')) {
          deprecationDateColumnIndex = index;
        }
        if (headerText.includes('retirement')) {
          retirementDateColumnIndex = index;
        }
      });
      
      console.log(`Identified column indices - Model: ${modelColumnIndex}, Legacy: ${legacyDateColumnIndex}, Deprecation: ${deprecationDateColumnIndex}, Retirement: ${retirementDateColumnIndex}`);
    }
    
    // Process data rows to extract models and dates
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Skip if it's another header row
      if (row.includes('<th') || row.includes('</th>')) {
        continue;
      }
      
      // Extract text from cells
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [...row.matchAll(cellRegex)];
      
      if (cells.length > modelColumnIndex) {
        // Extract model name
        const modelNameHtml = cells[modelColumnIndex][1];
        // Extract the model name, handling both plain text and links
        let modelName = modelNameHtml.replace(/<[^>]*>/g, '').trim();
        
        // If there's a link, try to extract the model name from the link text
        if (modelNameHtml.includes('<a')) {
          const linkMatch = modelNameHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/);
          if (linkMatch && linkMatch[1]) {
            modelName = linkMatch[1].replace(/<[^>]*>/g, '').trim();
          }
        }
        
        console.log(`\nRow ${i}: Model name: ${modelName}`);
        
        // Check all date columns to determine if the model is deprecated
        let isDeprecated = false;
        let closestRelevantDate = null;
        
        // Helper function to process a date cell
        const processDateCell = (columnIndex, dateName) => {
          if (columnIndex >= 0 && cells.length > columnIndex) {
            const dateHtml = cells[columnIndex][1];
            const dateText = dateHtml.replace(/<[^>]*>/g, '').trim();
            console.log(`  ${dateName} date text: "${dateText}"`);
            
            // Check if it contains "deprecated" or similar text
            if (dateText.toLowerCase().includes('deprecated') || 
                dateText.toLowerCase().includes('retired') || 
                dateText.toLowerCase().includes('no longer available')) {
              return new Date(0); // Return a very old date to mark as deprecated
            }
            
            // Try to parse the date
            try {
              // Handle common date formats
              const potentialDate = new Date(dateText);
              if (!isNaN(potentialDate.getTime())) {
                console.log(`  Parsed ${dateName} date: ${potentialDate.toISOString().split('T')[0]}`);
                return potentialDate;
              }
            } catch (e) {
              console.log(`  Could not parse ${dateName} date: "${dateText}"`);
            }
          }
          return null;
        };
        
        // Process all date columns
        const retirementDate = processDateCell(retirementDateColumnIndex, "Retirement");
        const deprecationDate = processDateCell(deprecationDateColumnIndex, "Deprecation");
        const legacyDate = processDateCell(legacyDateColumnIndex, "Legacy");
        
        // Determine if deprecated based on dates
        if (retirementDate) {
          isDeprecated = retirementDate <= today || includeFuture;
          closestRelevantDate = retirementDate;
        } 
        if (deprecationDate) {
          // If we already have a retirement date but it's in the future, check if deprecation is now
          if (!isDeprecated || (closestRelevantDate && closestRelevantDate > today)) {
            isDeprecated = deprecationDate <= today || includeFuture;
            closestRelevantDate = deprecationDate;
          }
        } 
        if (legacyDate) {
          // If we still haven't found a relevant date or existing dates are in the future
          if (!isDeprecated || (closestRelevantDate && closestRelevantDate > today)) {
            isDeprecated = legacyDate <= today || includeFuture;
            closestRelevantDate = legacyDate;
          }
        }
        
        console.log(`  Is deprecated: ${isDeprecated}, Include future: ${includeFuture}`);
        
        // Only add if it looks like a model name and is deprecated or includeFuture is true
        // Only add if it is deprecated and has a non-empty model name
        // If includeAllModels=true, we include all models regardless of name pattern
        // Otherwise, only include models that match our known patterns
        const matchesPattern = (
            modelName.startsWith('gpt-') || 
            modelName.startsWith('text-') || 
            modelName.startsWith('code-') ||
            modelName.startsWith('dall-e-') ||
            modelName.startsWith('Mistral-') ||
            modelName.startsWith('mistral-') ||
            modelName.startsWith('Phi-') ||
            modelName.startsWith('phi-') ||
            modelName.includes('embedding') ||
            modelName.includes('ada') ||
            modelName.includes('babbage') ||
            modelName.includes('curie') ||
            modelName.includes('davinci')
        );
        
        if (isDeprecated && modelName && (includeAllModels || matchesPattern)) {
          console.log(`  Adding model to deprecated list: ${modelName}`);
          tableModels.push(modelName);
          deprecatedModels.push(modelName);
        } else if (isDeprecated && modelName && !matchesPattern) {
          // Log models that are deprecated but don't match our patterns
          console.log(`  ⚠️ Model "${modelName}" is deprecated but doesn't match our naming patterns - SKIPPING`);
          if (includeAllModels) {
            console.log(`  Including model anyway due to --include-all-models flag`);
            tableModels.push(modelName);
            deprecatedModels.push(modelName);
          }
        }
      }
    }
    
    // Add this table's models to our tracking array
    modelsPerTable.push({ 
      tableIndex, 
      count: tableModels.length,
      models: tableModels 
    });
    console.log(`Table ${tableIndex + 1}: Found ${tableModels.length} deprecated models`);
  });
  
  // Print summary of models found in each table
  console.log('\n========== MODEL SUMMARY ==========');
  modelsPerTable.forEach(tableData => {
    console.log(`Table ${tableData.tableIndex + 1}: ${tableData.count} models found`);
    if (tableData.count > 0) {
      console.log(`  Models: ${tableData.models.join(', ')}`);
    }
  });
  
  // Remove duplicates (in case the same model appears in multiple tables)
  const uniqueModels = [...new Set(deprecatedModels)];
  
  console.log(`\nTotal deprecated models found: ${uniqueModels.length}`);
  if (deprecatedModels.length !== uniqueModels.length) {
    console.log(`Removed ${deprecatedModels.length - uniqueModels.length} duplicate models`);
  }
  
  return uniqueModels;
}

/**
 * Updates the Template Doctor config.json file with the new deprecated models
 * @param {string[]} models - Array of deprecated model names
 * @param {boolean} dryRun - If true, doesn't write to file, just outputs
 */
function updateConfig(models, dryRun = false) {
  if (models.length === 0) {
    console.log('No deprecated models found. Exiting without updating.');
    return;
  }

  console.log('Found deprecated models:');
  console.log(JSON.stringify(models, null, 2));

  if (dryRun) {
    console.log('\nDry run mode. Add the following to your config.json:');
    console.log(`"deprecatedModels": ${JSON.stringify(models, null, 2)}`);
    return;
  }

  // Path to Template Doctor's config.json
  const configPath = path.join(__dirname, '..', 'packages', 'app', 'config.json');
  
  try {
    // Check if config.json exists
    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found at ${configPath}`);
      console.log(`Add the following to your config.json manually:`);
      console.log(`"deprecatedModels": ${JSON.stringify(models, null, 2)}`);
      return;
    }

    // Read and parse config.json
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Update the deprecatedModels field
    config.deprecatedModels = models;
    
    // Write the updated config back to file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Updated config.json with ${models.length} deprecated models.`);
  } catch (error) {
    console.error('Error updating config.json:', error.message);
    console.log(`Add the following to your config.json manually:`);
    console.log(`"deprecatedModels": ${JSON.stringify(models, null, 2)}`);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command-line arguments
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const outputJson = args.includes('--json');
    const includeFuture = args.includes('--include-future');
    const includeAllModels = args.includes('--include-all-models');
    
    console.log(`Fetching deprecated models from ${RETIREMENT_DOC_URL}...`);
    const html = await fetchHtml(RETIREMENT_DOC_URL);
    const deprecatedModels = extractDeprecatedModels(html, includeFuture, includeAllModels);
    
    if (outputJson) {
      // Output JSON only
      console.log(JSON.stringify(deprecatedModels));
    } else {
      // Update config or output for dry run
      updateConfig(deprecatedModels, dryRun);
    }
    
    // Add explicit exit after completing the task
    console.log('Script execution completed. Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();