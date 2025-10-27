param accountName string
param location string = resourceGroup().location
param tags object = {}
param cosmosDatabaseName string = ''
param collections array = [
  {
    name: 'templates'
    id: 'templates'
    shardKey: {
      keys: [
        'Hash'
      ]
    }
    indexes: [
      {
        key: {
          keys: [
            '_id'
          ]
        }
      }
    ]
  }
  {
    name: 'analyses'
    id: 'analyses'
    shardKey: {
      keys: [
        'Hash'
      ]
    }
    indexes: [
      {
        key: {
          keys: [
            '_id'
          ]
        }
      }
    ]
  }
  {
    name: 'scans'
    id: 'scans'
    shardKey: {
      keys: [
        'Hash'
      ]
    }
    indexes: [
      {
        key: {
          keys: [
            '_id'
          ]
        }
      }
    ]
  }
  {
    name: 'validation_runs'
    id: 'validation_runs'
    shardKey: {
      keys: [
        'Hash'
      ]
    }
    indexes: [
      {
        key: {
          keys: [
            '_id'
          ]
        }
      }
    ]
  }
]

var defaultDatabaseName = 'template-doctor'
var actualDatabaseName = !empty(cosmosDatabaseName) ? cosmosDatabaseName : defaultDatabaseName

// Direct Cosmos DB MongoDB Account resource definition (bypassing AVM limitations)
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: accountName
  location: location
  tags: tags
  kind: 'MongoDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    // Security Configuration: Disable local auth, require Azure RBAC only  
    disableLocalAuth: true
    disableKeyBasedMetadataWriteAccess: true
    // Network Security: Disable public network access completely
    publicNetworkAccess: 'Disabled'
    networkAclBypass: 'AzureServices'
    ipRules: []
    virtualNetworkRules: []
    isVirtualNetworkFilterEnabled: false
    // Locations and failover
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    // MongoDB specific settings
    apiProperties: {
      serverVersion: '4.2'
    }
    capabilities: [
      {
        name: 'EnableMongo'
      }
    ]
    // Backup and consistency
    backupPolicy: {
      type: 'Continuous'
      continuousModeProperties: {
        tier: 'Continuous30Days'
      }
    }
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    // Security and compliance
    minimalTlsVersion: 'Tls12'
  }
}

// MongoDB database
resource mongoDatabase 'Microsoft.DocumentDB/databaseAccounts/mongodbDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: actualDatabaseName
  tags: tags
  properties: {
    resource: {
      id: actualDatabaseName
    }
  }
}

// MongoDB collections
resource mongoCollections 'Microsoft.DocumentDB/databaseAccounts/mongodbDatabases/collections@2024-05-15' = [for collection in collections: {
  parent: mongoDatabase
  name: collection.name
  properties: {
    resource: {
      id: collection.id
      shardKey: collection.shardKey
      indexes: collection.indexes
    }
  }
}]

output databaseName string = actualDatabaseName
output endpoint string = cosmosAccount.properties.documentEndpoint
output accountName string = cosmosAccount.name
