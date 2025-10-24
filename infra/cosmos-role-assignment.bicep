// Grant Managed Identity access to Cosmos DB using Azure RBAC
// Separated from main.bicep to avoid circular dependency

param cosmosAccountName string
param principalId string

// Reference existing Cosmos DB account
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' existing = {
  name: cosmosAccountName
}

// Built-in Cosmos DB Data Contributor Role ID (Azure RBAC)
// This is the Azure RBAC role for Cosmos DB data plane access
var cosmosBuiltinDataContributorRoleId = 'b24988ac-6180-42a0-ab88-20f7382dd24c'

// Azure RBAC Role Assignment for Container App Managed Identity
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(cosmosAccount.id, principalId, cosmosBuiltinDataContributorRoleId)
  scope: cosmosAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', cosmosBuiltinDataContributorRoleId)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}

output roleAssignmentId string = roleAssignment.id
