#!/usr/bin/env node

/**
 * Backfill createdBy field in repos collection
 * Populates createdBy in repos.latestAnalysis from corresponding analysis documents
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'template-doctor';

async function main() {
  console.log('🔄 Backfilling createdBy field in repos collection...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const analysesCollection = db.collection('analyses');
    const reposCollection = db.collection('repos');
    
    // Get all repos
    const repos = await reposCollection.find({}).toArray();
    console.log(`Found ${repos.length} repos to process\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const repo of repos) {
      // Find the latest analysis for this repo
      const analysis = await analysesCollection
        .findOne(
          { owner: repo.owner, repo: repo.repo },
          { sort: { scanDate: -1 } }
        );
      
      if (!analysis) {
        console.log(`⚠️  No analysis found for ${repo.owner}/${repo.repo}`);
        skipped++;
        continue;
      }
      
      // Extract createdBy from scannedBy array or use existing createdBy
      const createdBy = analysis.createdBy || 
                       (analysis.scannedBy && analysis.scannedBy.length > 0 
                         ? analysis.scannedBy[0] 
                         : null);
      
      // Update the repo document
      await reposCollection.updateOne(
        { _id: repo._id },
        {
          $set: {
            'latestAnalysis.createdBy': createdBy,
            'latestAnalysis.scannedBy': analysis.scannedBy || null
          }
        }
      );
      
      console.log(`✅ ${repo.owner}/${repo.repo} -> createdBy: ${createdBy || 'null'}`);
      updated++;
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`\n✨ Backfill completed!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
