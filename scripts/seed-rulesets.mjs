#!/usr/bin/env node
/**
 * Seed rulesets from JSON config files into MongoDB
 * Converts legacy config format to database ruleset schema
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/template-doctor';
const DB_NAME = 'template-doctor';

/**
 * Convert legacy config JSON to ruleset document
 */
function convertConfigToRuleset(name, displayName, description, config) {
  const rules = [];
  let ruleId = 1;

  // Convert required files
  if (config.requiredFiles && Array.isArray(config.requiredFiles)) {
    for (const file of config.requiredFiles) {
      rules.push({
        id: `file-${ruleId++}`,
        type: 'file',
        pattern: file,
        action: 'required',
        severity: 'error',
        message: `Missing required file: ${file}`,
        enabled: true,
      });
    }
  }

  // Convert required folders
  if (config.requiredFolders && Array.isArray(config.requiredFolders)) {
    for (const folder of config.requiredFolders) {
      rules.push({
        id: `folder-${ruleId++}`,
        type: 'folder',
        pattern: folder,
        action: 'required',
        severity: 'error',
        message: `Missing required folder: ${folder}`,
        enabled: true,
      });
    }
  }

  // Convert workflow files
  if (config.requiredWorkflowFiles && Array.isArray(config.requiredWorkflowFiles)) {
    for (const workflow of config.requiredWorkflowFiles) {
      rules.push({
        id: `workflow-${ruleId++}`,
        type: 'workflow',
        pattern: workflow.pattern,
        action: 'required',
        severity: 'error',
        message: workflow.message || `Missing required workflow: ${workflow.pattern}`,
        enabled: true,
      });
    }
  }

  return {
    name,
    displayName,
    description,
    rules,
    enabled: true,
    isDefault: name === 'dod',
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    // Store original config for reference
    _legacyConfig: config,
  };
}

async function seedRulesets() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    const rulesetsCollection = db.collection('rulesets');

    // Load config files
    const configsPath = join(__dirname, '../packages/app/configs');
    
    const configs = [
      {
        name: 'dod',
        displayName: 'Definition of Done (DoD)',
        description: 'Standard DoD requirements for Azure Developer CLI templates',
        file: join(configsPath, 'dod-config.json'),
      },
      {
        name: 'partner',
        displayName: 'Partner Templates',
        description: 'Requirements for partner-contributed templates',
        file: join(configsPath, 'partner-config.json'),
      },
      {
        name: 'docs',
        displayName: 'Documentation Standards',
        description: 'Documentation and OSSF requirements',
        file: join(configsPath, 'docs-config.json'),
      },
      {
        name: 'custom',
        displayName: 'Custom Minimal',
        description: 'Minimal custom ruleset for basic validation',
        file: join(configsPath, 'custom-config.json'),
      },
    ];

    console.log('Loading and converting config files...');
    const rulesets = [];

    for (const { name, displayName, description, file } of configs) {
      try {
        const configData = JSON.parse(readFileSync(file, 'utf-8'));
        const ruleset = convertConfigToRuleset(name, displayName, description, configData);
        rulesets.push(ruleset);
        console.log(`✓ Loaded ${name}: ${ruleset.rules.length} rules`);
      } catch (error) {
        console.error(`✗ Failed to load ${name}:`, error.message);
      }
    }

    if (rulesets.length === 0) {
      console.error('No rulesets to seed');
      return;
    }

    // Delete existing rulesets
    console.log('\nClearing existing rulesets...');
    const deleteResult = await rulesetsCollection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing rulesets`);

    // Insert new rulesets
    console.log('\nInserting new rulesets...');
    const insertResult = await rulesetsCollection.insertMany(rulesets);
    console.log(`✓ Inserted ${insertResult.insertedCount} rulesets`);

    // Summary
    console.log('\n=== Seed Summary ===');
    for (const ruleset of rulesets) {
      console.log(`${ruleset.displayName} (${ruleset.name}):`);
      console.log(`  - ${ruleset.rules.length} rules`);
      console.log(`  - Default: ${ruleset.isDefault ? 'Yes' : 'No'}`);
      console.log(`  - Enabled: ${ruleset.enabled ? 'Yes' : 'No'}`);
    }

    console.log('\n✓ Rulesets seeded successfully!');
  } catch (error) {
    console.error('Error seeding rulesets:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

seedRulesets();
