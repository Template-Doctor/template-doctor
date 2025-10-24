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

module cosmos 'br/public:avm/res/document-db/database-account:0.6.0' = {
  name: 'cosmos-mongo'
  params: {
    locations: [
      {
        failoverPriority: 0
        isZoneRedundant: false
        locationName: location
      }
    ]
    name: accountName
    location: location
    mongodbDatabases: [
      {
        name: actualDatabaseName
        tags: tags
        collections: collections
      }
    ]
  }
}

output databaseName string = actualDatabaseName
output endpoint string = cosmos.outputs.endpoint
output accountName string = cosmos.outputs.name
