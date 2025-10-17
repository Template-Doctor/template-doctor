// Main infrastructure template for Template Doctor
// Deploys Cosmos DB (MongoDB API) + Container App

targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment (e.g., dev, test, prod)')
param environmentName string

@description('Primary location for all resources')
param location string

@description('Id of the principal (user or service principal) to grant database access')
param principalId string = ''

// GitHub configuration (read from .env file by azd)
@secure()
@description('GitHub OAuth Client ID - set in .env as GITHUB_CLIENT_ID')
param githubClientId string = ''

@secure()
@description('GitHub OAuth Client Secret - set in .env as GITHUB_CLIENT_SECRET')
param githubClientSecret string = ''

@secure()
@description('GitHub Personal Access Token - set in .env as GITHUB_TOKEN (scopes: repo, workflow, read:org)')
param githubToken string = ''

// Tags to apply to all resources
var tags = {
  'azd-env-name': environmentName
  app: 'template-doctor'
}

// Generate abbreviated location name for resource naming
var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

// Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: '${abbrs.resourcesResourceGroups}${environmentName}'
  location: location
  tags: tags
}

// Cosmos DB Module
module cosmos './database.bicep' = {
  name: 'cosmos-db-deployment'
  scope: rg
  params: {
    location: location
    environmentName: environmentName
    principalId: principalId
  }
}

// Container Apps Environment
module containerAppsEnvironment 'core/host/container-apps-environment.bicep' = {
  name: 'container-apps-environment'
  scope: rg
  params: {
    name: '${abbrs.appManagedEnvironments}${resourceToken}'
    location: location
    tags: tags
  }
}

// Container Registry
module containerRegistry 'core/host/container-registry.bicep' = {
  name: 'container-registry'
  scope: rg
  params: {
    name: '${abbrs.containerRegistryRegistries}${resourceToken}'
    location: location
    tags: tags
  }
}

// Container App
module containerApp 'core/host/container-app.bicep' = {
  name: 'container-app'
  scope: rg
  params: {
    name: '${abbrs.appContainerApps}web-${resourceToken}'
    location: location
    tags: tags
    containerAppsEnvironmentName: containerAppsEnvironment.outputs.name
    containerRegistryName: containerRegistry.outputs.name
    githubClientId: githubClientId
    githubClientSecret: githubClientSecret
    githubToken: githubToken
    env: [
      {
        name: 'MONGODB_URI'
        value: cosmos.outputs.cosmosConnectionString
      }
      {
        name: 'MONGODB_DATABASE'
        value: 'template-doctor'
      }
      {
        name: 'NODE_ENV'
        value: 'production'
      }
      {
        name: 'PORT'
        value: '3000'
      }
      {
        name: 'GITHUB_CLIENT_ID'
        secretRef: 'github-client-id'
      }
      {
        name: 'GITHUB_CLIENT_SECRET'
        secretRef: 'github-client-secret'
      }
      {
        name: 'GITHUB_TOKEN'
        secretRef: 'github-token'
      }
    ]
    secrets: []
    targetPort: 3000
    enableIngress: true
    external: true
  }
}

// Outputs
output AZURE_LOCATION string = location
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerRegistry.outputs.name
output SERVICE_WEB_NAME string = containerApp.outputs.name
output SERVICE_WEB_URI string = containerApp.outputs.uri
output MONGODB_URI string = cosmos.outputs.cosmosConnectionString
output COSMOS_ENDPOINT string = cosmos.outputs.cosmosEndpoint
output COSMOS_ACCOUNT_NAME string = cosmos.outputs.cosmosAccountName
