# Database Schema V2 - Repository-Centric Design

## Overview

This schema treats **repositories as the primary entity**, with analysis results stored separately for historical tracking. AZD test results are embedded in the repo document since we only need the latest.

## Collections

### 1. `repos` Collection (Repository Metadata + Latest Test)

**Collection Name:** `repos`

```javascript
{
  _id: ObjectId,
  repoUrl: "https://github.com/Azure-Samples/todo-nodejs-mongo", // Unique index
  owner: "Azure-Samples",
  repo: "todo-nodejs-mongo",
  
  // Latest analysis summary (for quick dashboard queries)
  latestAnalysis: {
    scanDate: ISODate("2024-10-09T12:00:00Z"),
    ruleSet: "dod",
    compliancePercentage: 85.5,
    passed: 17,
    issues: 3,
    analysisId: ObjectId("...") // Reference to full analysis document
  },
  
  // Embedded latest AZD test result (only keep most recent)
  latestAzdTest: {
    testId: "test-20241009-001",
    timestamp: ISODate("2024-10-01T10:00:00Z"),
    status: "success", // "pending" | "running" | "success" | "failed"
    duration: 450000, // milliseconds
    result: {
      deploymentTime: 420000,
      resourcesCreated: 8,
      azdUpSuccess: true,
      azdDownSuccess: true,
      errors: [],
      warnings: ["Bicep file could use managed identity"],
      endpoints: [
        { name: "web", url: "https://app-xxx.azurewebsites.net" }
      ]
    }
  },
  
  // Repository metadata
  upstreamTemplate: "https://github.com/azure-samples/todo-nodejs-mongo",
  archiveRequested: false,
  tags: ["nodejs", "mongodb", "azd-template"],
  
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Indexes:**
```javascript
db.repos.createIndex({ repoUrl: 1 }, { unique: true })
db.repos.createIndex({ owner: 1, repo: 1 })
db.repos.createIndex({ "latestAnalysis.compliancePercentage": -1 })
db.repos.createIndex({ "latestAnalysis.scanDate": -1 })
```

### 2. `analysis` Collection (Historical Analysis Results)

**Collection Name:** `analysis`

**Retention Policy:** Keep last 10 analysis results per repository (TTL or manual cleanup)

```javascript
{
  _id: ObjectId,
  repoUrl: "https://github.com/Azure-Samples/todo-nodejs-mongo", // Foreign key to repos
  owner: "Azure-Samples",
  repo: "todo-nodejs-mongo",
  
  // Analysis metadata
  scanDate: ISODate("2024-10-09T12:00:00Z"),
  ruleSet: "dod",
  timestamp: 1728489600000,
  
  // Compliance summary
  compliance: {
    percentage: 85.5,
    passed: 17,
    issues: 3
  },
  
  // Category breakdown
  categories: {
    "documentation": {
      enabled: true,
      percentage: 100,
      issues: [],
      compliant: [...]
    },
    "security": {
      enabled: true,
      percentage: 66.7,
      issues: [...],
      compliant: [...]
    },
    "azure-developer-cli": {
      enabled: true,
      percentage: 80,
      issues: [...],
      compliant: [...]
    }
  },
  
  // Detailed results
  issues: [
    {
      id: "managed-identity-recommended",
      severity: "warning",
      message: "Consider using Managed Identity",
      error: "Connection string detected",
      category: "security"
    }
  ],
  
  compliant: [
    {
      id: "readme-exists",
      category: "documentation",
      message: "README.md exists",
      details: { path: "README.md" }
    }
  ],
  
  // Full analyzer output (for detailed drill-down)
  analysisResult: {
    repoUrl: "...",
    branch: "main",
    totalChecks: 20,
    passedChecks: 17,
    failedChecks: 3,
    analyzedAt: "2024-10-09T12:00:00Z"
  },
  
  // Audit fields
  createdBy: "anfibiacreativa", // GitHub username who triggered
  scannedBy: ["scanner-instance-1"],
  
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Indexes:**
```javascript
db.analysis.createIndex({ repoUrl: 1, scanDate: -1 })
db.analysis.createIndex({ scanDate: -1 })
db.analysis.createIndex({ "compliance.percentage": -1 })
db.analysis.createIndex({ createdBy: 1 })
```

**Retention Strategy:**
```javascript
// Keep only last 10 analyses per repo
db.analysis.aggregate([
  { $sort: { repoUrl: 1, scanDate: -1 } },
  { $group: { 
      _id: "$repoUrl", 
      analyses: { $push: "$$ROOT" } 
  }},
  { $project: { 
      toDelete: { $slice: ["$analyses", 10, 999] }
  }},
  { $unwind: "$toDelete" },
  { $replaceRoot: { newRoot: "$toDelete" } }
]).forEach(doc => db.analysis.deleteOne({ _id: doc._id }));
```

### 3. `rulesets` Collection (Unchanged)

```javascript
{
  _id: ObjectId,
  name: "dod",
  displayName: "Department of Defense",
  description: "DOD security and compliance requirements",
  version: "1.0.0",
  enabled: true,
  rules: [
    {
      id: "readme-exists",
      category: "documentation",
      severity: "error",
      enabled: true,
      description: "README.md must exist"
    }
  ],
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 4. `configuration` Collection (Unchanged)

```javascript
{
  _id: ObjectId,
  key: "max_analysis_history",
  value: 10,
  category: "retention",
  description: "Maximum number of analysis results to keep per repo",
  updatedBy: "admin",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

## Query Patterns

### Dashboard (Latest Results)
```javascript
// Fast - only queries repos collection
db.repos.find({})
  .sort({ "latestAnalysis.scanDate": -1 })
  .limit(50)
```

### Leaderboard (Top Compliance)
```javascript
// Fast - indexed on compliance percentage
db.repos.find({})
  .sort({ "latestAnalysis.compliancePercentage": -1 })
  .limit(20)
```

### Repository Detail Page
```javascript
// 1. Get repo with latest test
const repo = db.repos.findOne({ repoUrl: "..." })

// 2. Get last 10 analysis results for trend chart
const history = db.analysis.find({ repoUrl: "..." })
  .sort({ scanDate: -1 })
  .limit(10)
```

### Analysis Trend Chart
```javascript
// Get historical compliance percentages
db.analysis.find(
  { repoUrl: "..." },
  { scanDate: 1, "compliance.percentage": 1 }
)
.sort({ scanDate: -1 })
.limit(10)
```

## Benefits of This Design

### ✅ Advantages

1. **Repository-Centric Access**
   - Repos are the main entity users interact with
   - One document per repo = simple, fast dashboard queries
   - Latest analysis embedded for speed

2. **Historical Tracking**
   - Keep 10 analysis results per repo for trend analysis
   - Separate collection = doesn't bloat repo documents
   - Easy to query specific time ranges

3. **Efficient AZD Tests**
   - Only latest test matters (embedded in repo)
   - No separate collection needed
   - Updated in-place when new test runs

4. **Optimized Query Patterns**
   - Dashboard: Single query to `repos` collection
   - Leaderboard: Single sorted query on indexed field
   - Details: One repo lookup + one analysis query
   - Trends: Efficient indexed query on repoUrl + scanDate

5. **Clean Data Lifecycle**
   - Old analysis results automatically pruned (>10 per repo)
   - Repo documents stay small and fast
   - AZD test is always current (overwrites)

### 📊 Access Pattern Analysis

- **Frequent (1000x/day):** Dashboard latest results → `repos` collection only
- **Common (100x/day):** Leaderboard → `repos` with index
- **Occasional (10x/day):** Repository detail → `repos` + `analysis` history
- **Rare (1x/day):** Trend analysis → `analysis` with date range

### 🔄 Write Patterns

1. **New Analysis Scan:**
   ```javascript
   // 1. Insert full analysis result
   const result = db.analysis.insertOne({...})
   
   // 2. Update repo with latest summary
   db.repos.updateOne(
     { repoUrl: "..." },
     { 
       $set: { 
         latestAnalysis: {
           scanDate: ...,
           compliancePercentage: ...,
           analysisId: result.insertedId
         },
         updatedAt: new Date()
       }
     },
     { upsert: true } // Create repo if doesn't exist
   )
   
   // 3. Prune old analyses (keep last 10)
   const count = db.analysis.countDocuments({ repoUrl: "..." })
   if (count > 10) {
     const toDelete = db.analysis.find({ repoUrl: "..." })
       .sort({ scanDate: -1 })
       .skip(10)
       .toArray()
     db.analysis.deleteMany({ _id: { $in: toDelete.map(d => d._id) } })
   }
   ```

2. **New AZD Test:**
   ```javascript
   // Simply overwrite latest test in repo document
   db.repos.updateOne(
     { repoUrl: "..." },
     { 
       $set: { 
         latestAzdTest: {...},
         updatedAt: new Date()
       }
     }
   )
   ```

## Migration from V1 to V2

### Step 1: Create `repos` collection from existing `analysis`
```javascript
db.analysis.aggregate([
  { $sort: { repoUrl: 1, scanDate: -1 } },
  { $group: {
      _id: "$repoUrl",
      latest: { $first: "$$ROOT" },
      owner: { $first: "$owner" },
      repo: { $first: "$repo" }
  }},
  { $project: {
      _id: 0,
      repoUrl: "$_id",
      owner: "$owner",
      repo: "$repo",
      latestAnalysis: {
        scanDate: "$latest.scanDate",
        ruleSet: "$latest.ruleSet",
        compliancePercentage: "$latest.compliance.percentage",
        passed: "$latest.compliance.passed",
        issues: "$latest.compliance.issues",
        analysisId: "$latest._id"
      },
      latestAzdTest: null,
      upstreamTemplate: "$latest.upstreamTemplate",
      archiveRequested: "$latest.archiveRequested",
      tags: [],
      createdAt: "$latest.createdAt",
      updatedAt: "$latest.updatedAt"
  }},
  { $out: "repos" }
])
```

### Step 2: Prune old analyses (keep last 10 per repo)
```javascript
// (Use retention script from above)
```

### Step 3: Update application code
- Change dashboard to query `repos` collection
- Update detail page to fetch from `repos` + `analysis` history
- Modify write logic to update both collections

## Comparison: V1 vs V2

| Aspect | V1 (Flat Analysis) | V2 (Repo-Centric) |
|--------|-------------------|-------------------|
| **Dashboard Query** | 26 analysis docs | 26 repo docs (faster) |
| **Leaderboard** | Sort all analyses | Sort repos (indexed) |
| **Historical Data** | One doc per scan | Last 10 per repo (limited) |
| **AZD Tests** | Separate collection | Embedded (latest only) |
| **Write Pattern** | Insert analysis | Insert analysis + update repo |
| **Data Growth** | Unlimited | Capped at 10 per repo |
| **Primary Entity** | Analysis scan | Repository |

## Recommended Approach: V2

**Reasoning:**
- Users think in terms of **repositories**, not individual scans
- Latest results are queried 100x more than historical data
- Historical trends only need last 10 scans (sufficient for charts)
- AZD tests are infrequent, latest is all we need
- Bounded growth prevents runaway collection size
