targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

// Optional parameters to override the default azd resource naming conventions. Update the main.parameters.json file to provide values. e.g.,:
// "resourceGroupName": {
//      "value": "myGroupName"
// }
param appContainerAppName string = ''
param applicationInsightsDashboardName string = ''
param applicationInsightsName string = ''
param containerAppsEnvironmentName string = ''
param containerRegistryName string = ''
param cosmosAccountName string = ''
param logAnalyticsName string = ''
param resourceGroupName string = ''
param templateDoctorAppExists bool = false

// GitHub configuration (stored as Container Apps secrets)
@secure()
@description('GitHub OAuth Client ID - set in .env as GITHUB_CLIENT_ID')
param githubClientId string

@secure()
@description('GitHub OAuth Client Secret - set in .env as GITHUB_CLIENT_SECRET')
param githubClientSecret string

@secure()
@description('GitHub Personal Access Token - set in .env as GITHUB_TOKEN')
param githubToken string

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = { 'azd-env-name': environmentName }

// Organize resources in a resource group
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: !empty(resourceGroupName) ? resourceGroupName : '${abbrs.resourcesResourceGroups}${environmentName}'
  location: location
  tags: tags
}

// Monitor application with Azure Monitor
module monitoring 'br/public:avm/ptn/azd/monitoring:0.1.0' = {
  name: 'monitoring'
  scope: rg
  params: {
    applicationInsightsName: !empty(applicationInsightsName) ? applicationInsightsName : '${abbrs.insightsComponents}${resourceToken}'
    logAnalyticsName: !empty(logAnalyticsName) ? logAnalyticsName : '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsDashboardName: !empty(applicationInsightsDashboardName) ? applicationInsightsDashboardName : '${abbrs.portalDashboards}${resourceToken}'
    location: location
    tags: tags
  }
}

// Container apps host (including container registry)
module containerApps 'br/public:avm/ptn/azd/container-apps-stack:0.1.0' = {
  name: 'container-apps'
  scope: rg
  params: {
    containerAppsEnvironmentName: !empty(containerAppsEnvironmentName) ? containerAppsEnvironmentName : '${abbrs.appManagedEnvironments}${resourceToken}'
    containerRegistryName: !empty(containerRegistryName) ? containerRegistryName : '${abbrs.containerRegistryRegistries}${resourceToken}'
    logAnalyticsWorkspaceResourceId: monitoring.outputs.logAnalyticsWorkspaceResourceId
    appInsightsConnectionString: monitoring.outputs.applicationInsightsConnectionString
    acrSku: 'Basic'
    location: location
    acrAdminUserEnabled: false
    zoneRedundant: false
    tags: tags
  }
}

//the managed identity for Template Doctor app
module appIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'appidentity'
  scope: rg
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}app-${resourceToken}'
    location: location
  }
}

// Template Doctor app
module app 'br/public:avm/ptn/azd/container-app-upsert:0.2.0' = {
  name: 'template-doctor-container-app'
  scope: rg
  params: {
    name: !empty(appContainerAppName) ? appContainerAppName : '${abbrs.appContainerApps}template-doctor-${resourceToken}'
    tags: union(tags, { 'azd-service-name': 'template-doctor' })
    location: location
    env: [
      {
        name: 'AZURE_CLIENT_ID'
        value: appIdentity.outputs.clientId
      }
      {
        name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
        value: monitoring.outputs.applicationInsightsConnectionString
      }
      {
        name: 'MONGODB_DATABASE'
        value: cosmos.outputs.databaseName
      }
      {
        name: 'COSMOS_ENDPOINT'
        value: cosmos.outputs.endpoint
      }
      {
        name: 'NODE_ENV'
        value: 'production'
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
    secrets: [
      {
        name: 'github-client-id'
        value: githubClientId
      }
      {
        name: 'github-client-secret'  
        value: githubClientSecret
      }
      {
        name: 'github-token'
        value: githubToken
      }
    ]
    containerAppsEnvironmentName: containerApps.outputs.environmentName
    containerRegistryName: containerApps.outputs.registryName
    exists: templateDoctorAppExists
    identityType: 'UserAssigned'
    identityName: appIdentity.name
    containerCpuCoreCount: '1.0'
    containerMemory: '2.0Gi'
    targetPort: 3000
    containerMinReplicas: 1
    ingressEnabled: true
    containerName: 'main'
    userAssignedIdentityResourceId: appIdentity.outputs.resourceId
    identityPrincipalId: appIdentity.outputs.principalId
  }
}

// The application database
module cosmos './app/db-avm.bicep' = {
  name: 'cosmos'
  scope: rg
  params: {
    accountName: !empty(cosmosAccountName) ? cosmosAccountName : '${abbrs.documentDBDatabaseAccounts}${resourceToken}'
    location: location
    tags: tags
  }
}

// Grant Container App Managed Identity access to Cosmos DB
module cosmosRoleAssignment 'cosmos-role-assignment.bicep' = {
  name: 'cosmos-role-assignment'
  scope: rg
  params: {
    cosmosAccountName: !empty(cosmosAccountName) ? cosmosAccountName : '${abbrs.documentDBDatabaseAccounts}${resourceToken}'
    principalId: appIdentity.outputs.principalId
  }
  dependsOn: [
    cosmos
  ]
}

// Data outputs
output AZURE_COSMOS_DATABASE_NAME string = cosmos.outputs.databaseName
output AZURE_COSMOS_ENDPOINT string = cosmos.outputs.endpoint

// App outputs
output APPLICATIONINSIGHTS_CONNECTION_STRING string = monitoring.outputs.applicationInsightsConnectionString
output APPLICATIONINSIGHTS_NAME string = monitoring.outputs.applicationInsightsName
output AZURE_CONTAINER_ENVIRONMENT_NAME string = containerApps.outputs.environmentName
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerApps.outputs.registryLoginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerApps.outputs.registryName
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output TEMPLATE_DOCTOR_BASE_URL string = app.outputs.uri
output SERVICE_APP_NAME string = app.outputs.name
