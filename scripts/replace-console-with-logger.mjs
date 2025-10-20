#!/usr/bin/env node
/**
 * Script to replace console.log/debug/warn/error with logger calls
 * 
 * Usage: node scripts/replace-console-with-logger.mjs [--dry-run]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dryRun = process.argv.includes('--dry-run');
const srcDir = path.join(__dirname, '../packages/app/src');

// Files to exclude from replacement
const EXCLUDE_PATTERNS = [
  /utils\/logger\.ts$/,  // Don't modify the logger itself
  /\.spec\.ts$/,         // Don't modify test files
  /\.test\.ts$/,         // Don't modify test files
];

// Module name extraction from file paths
function getModuleName(filePath) {
  const relativePath = path.relative(srcDir, filePath);
  const parts = relativePath.split(path.sep);
  
  // Use the file name without extension as module name
  const fileName = path.basename(filePath, '.ts');
  
  // For nested paths, include parent directory
  if (parts.length > 1) {
    return `${parts[0]}/${fileName}`;
  }
  
  return fileName;
}

// Check if file should be excluded
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

// Find all TypeScript files
async function findTSFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...await findTSFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !shouldExclude(fullPath)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Replace console statements in file content
function replaceConsoleStatements(content, moduleName) {
  let modified = content;
  let hasChanges = false;
  
  // Check if logger is already imported
  const hasLoggerImport = /import\s+.*\s+from\s+['"].*utils\/logger/.test(content);
  
  // Patterns to replace
  const replacements = [
    // console.log(...) -> logger.info(module, ...)
    {
      pattern: /console\.log\((.*?)\);/g,
      replacement: (match, args) => {
        hasChanges = true;
        return `logger.info('${moduleName}', ${args});`;
      }
    },
    // console.debug(...) -> logger.debug(module, ...)
    {
      pattern: /console\.debug\((.*?)\);/g,
      replacement: (match, args) => {
        hasChanges = true;
        return `logger.debug('${moduleName}', ${args});`;
      }
    },
    // console.warn(...) -> logger.warn(module, ...)
    {
      pattern: /console\.warn\((.*?)\);/g,
      replacement: (match, args) => {
        hasChanges = true;
        return `logger.warn('${moduleName}', ${args});`;
      }
    },
    // console.error(...) -> logger.error(module, ...)
    {
      pattern: /console\.error\((.*?)\);/g,
      replacement: (match, args) => {
        hasChanges = true;
        return `logger.error('${moduleName}', ${args});`;
      }
    }
  ];
  
  // Apply replacements
  for (const { pattern, replacement } of replacements) {
    modified = modified.replace(pattern, replacement);
  }
  
  // Add logger import if changes were made and import doesn't exist
  if (hasChanges && !hasLoggerImport) {
    // Find the right place to add the import (after other imports)
    const importMatch = modified.match(/^(import\s+.*?from\s+['"].*?['"];?\s*)+/m);
    
    if (importMatch) {
      // Add after existing imports
      const insertPoint = importMatch[0].length;
      modified = 
        modified.slice(0, insertPoint) +
        "\nimport { logger } from '../utils/logger.js';" +
        modified.slice(insertPoint);
    } else {
      // No imports found, add at the top
      modified = "import { logger } from '../utils/logger.js';\n\n" + modified;
    }
  }
  
  return { modified, hasChanges };
}

// Process a single file
async function processFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const moduleName = getModuleName(filePath);
    const { modified, hasChanges } = replaceConsoleStatements(content, moduleName);
    
    if (hasChanges) {
      if (dryRun) {
        console.log(`[DRY RUN] Would modify: ${path.relative(process.cwd(), filePath)}`);
      } else {
        await fs.writeFile(filePath, modified, 'utf-8');
        console.log(`✓ Modified: ${path.relative(process.cwd(), filePath)}`);
      }
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Main function
async function main() {
  console.log('🔍 Finding TypeScript files...');
  const files = await findTSFiles(srcDir);
  console.log(`📁 Found ${files.length} TypeScript files to process`);
  
  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No files will be modified\n');
  }
  
  let modifiedCount = 0;
  
  for (const file of files) {
    modifiedCount += await processFile(file);
  }
  
  console.log(`\n✅ Complete! ${modifiedCount} file(s) ${dryRun ? 'would be' : 'were'} modified.`);
  
  if (!dryRun && modifiedCount > 0) {
    console.log('\n📝 Next steps:');
    console.log('   1. Review changes: git diff');
    console.log('   2. Test build: npm run build -w packages/app');
    console.log('   3. Run tests: npm test');
    console.log('   4. Commit: git add -A && git commit');
  }
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
