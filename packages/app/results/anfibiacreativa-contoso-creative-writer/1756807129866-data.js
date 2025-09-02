window.templateData = {
  "compliance": {
    "compliant": [
      {
        "category": "requiredFile",
        "details": {
          "fileName": "README.md"
        },
        "id": "file-README.md",
        "message": "Required file found: README.md"
      },
      {
        "category": "requiredFile",
        "details": {
          "fileName": "azure.yaml"
        },
        "id": "file-azure.yaml",
        "message": "Required file found: azure.yaml"
      },
      {
        "category": "requiredFile",
        "details": {
          "fileName": "LICENSE"
        },
        "id": "file-LICENSE",
        "message": "Required file found: LICENSE"
      },
      {
        "category": "requiredWorkflow",
        "details": {
          "fileName": ".github/workflows/azure-dev.yml",
          "patternMatched": ".github\\/workflows\\/azure-dev.yml"
        },
        "id": "workflow-.github/workflows/azure-dev.yml",
        "message": "Required workflow file found: .github/workflows/azure-dev.yml"
      },
      {
        "category": "requiredFolder",
        "details": {
          "fileCount": 42,
          "folderPath": "infra"
        },
        "id": "folder-infra",
        "message": "Required folder found: infra/"
      },
      {
        "category": "requiredFolder",
        "details": {
          "fileCount": 7,
          "folderPath": ".github"
        },
        "id": "folder-.github",
        "message": "Required folder found: .github/"
      },
      {
        "category": "readmeHeading",
        "details": {
          "heading": "Getting Started",
          "level": 2
        },
        "id": "readme-heading-getting-started",
        "message": "README.md contains required h2 heading: Getting Started"
      },
      {
        "category": "bicepFiles",
        "details": {
          "count": 34,
          "files": [
            "infra/app/api.bicep",
            "infra/app/web.bicep",
            "infra/core/ai/cognitiveservices.bicep",
            "infra/core/ai/hub-dependencies.bicep",
            "infra/core/ai/hub.bicep",
            "infra/core/ai/project.bicep",
            "infra/core/bing/bing-search.bicep",
            "infra/core/database/cosmos/cosmos-account.bicep",
            "infra/core/database/cosmos/sql/cosmos-sql-account.bicep",
            "infra/core/database/cosmos/sql/cosmos-sql-db.bicep",
            "infra/core/database/cosmos/sql/cosmos-sql-role-assign.bicep",
            "infra/core/database/cosmos/sql/cosmos-sql-role-def.bicep",
            "infra/core/host/ai-environment.bicep",
            "infra/core/host/container-app-upsert.bicep",
            "infra/core/host/container-app.bicep",
            "infra/core/host/container-apps-environment.bicep",
            "infra/core/host/container-apps.bicep",
            "infra/core/host/container-registry.bicep",
            "infra/core/host/ml-online-endpoint.bicep",
            "infra/core/monitor/applicationinsights-dashboard.bicep",
            "infra/core/monitor/applicationinsights.bicep",
            "infra/core/monitor/loganalytics.bicep",
            "infra/core/monitor/monitoring.bicep",
            "infra/core/search/search-services.bicep",
            "infra/core/security/keyvault-access.bicep",
            "infra/core/security/keyvault-secret.bicep",
            "infra/core/security/keyvault.bicep",
            "infra/core/security/managed-identity.bicep",
            "infra/core/security/registry-access.bicep",
            "infra/core/security/role-cosmos.bicep",
            "infra/core/security/role.bicep",
            "infra/core/storage/storage-account.bicep",
            "infra/main.bicep",
            "infra/main.test.bicep"
          ]
        },
        "id": "bicep-files-exist",
        "message": "Bicep files found in infra/ directory: 34 files"
      },
      {
        "category": "bicepSecurity",
        "details": {
          "authMethod": "ManagedIdentity",
          "file": "infra/core/ai/hub.bicep"
        },
        "id": "bicep-uses-managed-identity-infra/core/ai/hub.bicep",
        "message": "Good practice: infra/core/ai/hub.bicep uses Managed Identity for Azure authentication"
      },
      {
        "category": "bicepSecurity",
        "details": {
          "authMethod": "ManagedIdentity",
          "file": "infra/core/ai/project.bicep"
        },
        "id": "bicep-uses-managed-identity-infra/core/ai/project.bicep",
        "message": "Good practice: infra/core/ai/project.bicep uses Managed Identity for Azure authentication"
      },
      {
        "category": "bicepSecurity",
        "details": {
          "authMethod": "ManagedIdentity",
          "file": "infra/core/host/ml-online-endpoint.bicep"
        },
        "id": "bicep-uses-managed-identity-infra/core/host/ml-online-endpoint.bicep",
        "message": "Good practice: infra/core/host/ml-online-endpoint.bicep uses Managed Identity for Azure authentication"
      },
      {
        "category": "bicepResource",
        "details": {
          "file": "infra/core/security/keyvault-access.bicep",
          "resource": "Microsoft.KeyVault/vaults"
        },
        "id": "bicep-resource-microsoft.keyvault/vaults-infra/core/security/keyvault-access.bicep",
        "message": "Found required resource \"Microsoft.KeyVault/vaults\" in infra/core/security/keyvault-access.bicep"
      },
      {
        "category": "bicepResource",
        "details": {
          "file": "infra/core/security/keyvault-secret.bicep",
          "resource": "Microsoft.KeyVault/vaults"
        },
        "id": "bicep-resource-microsoft.keyvault/vaults-infra/core/security/keyvault-secret.bicep",
        "message": "Found required resource \"Microsoft.KeyVault/vaults\" in infra/core/security/keyvault-secret.bicep"
      },
      {
        "category": "bicepResource",
        "details": {
          "file": "infra/core/security/keyvault.bicep",
          "resource": "Microsoft.KeyVault/vaults"
        },
        "id": "bicep-resource-microsoft.keyvault/vaults-infra/core/security/keyvault.bicep",
        "message": "Found required resource \"Microsoft.KeyVault/vaults\" in infra/core/security/keyvault.bicep"
      },
      {
        "category": "bicepResource",
        "details": {
          "file": "infra/main.bicep",
          "resource": "Microsoft.Resources/resourceGroups"
        },
        "id": "bicep-resource-microsoft.resources/resourcegroups-infra/main.bicep",
        "message": "Found required resource \"Microsoft.Resources/resourceGroups\" in infra/main.bicep"
      },
      {
        "category": "azureYaml",
        "details": {
          "fileName": "azure.yaml"
        },
        "id": "azure-yaml-exists",
        "message": "Found azure.yaml file: azure.yaml"
      },
      {
        "category": "azureYaml",
        "details": {
          "fileName": "azure.yaml"
        },
        "id": "azure-yaml-services-defined",
        "message": "\"services:\" section found in azure.yaml"
      },
      {
        "category": "meta",
        "details": {
          "compliantCount": 17,
          "issueCount": 88,
          "percentageCompliant": 16,
          "totalChecks": 105
        },
        "id": "compliance-summary",
        "message": "Compliance: 16%"
      }
    ],
    "issues": [
      {
        "error": "README.md does not contain required h2 heading: Prerequisites",
        "id": "readme-missing-heading-prerequisites",
        "message": "README.md is missing required h2 heading: Prerequisites",
        "severity": "error"
      },
      {
        "error": "README.md does not contain required h2 heading: Architecture",
        "id": "readme-missing-architecture-diagram-heading",
        "message": "README.md is missing required h2 heading: Architecture",
        "severity": "error"
      },
      {
        "error": "File infra/app/api.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/app/api.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/app/api.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/app/api.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/app/api.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/app/api.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/app/api.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/app/web.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/app/web.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/app/web.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/app/web.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/ai/cognitiveservices.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/ai/cognitiveservices.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/ai/cognitiveservices.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/ai/cognitiveservices.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/ai/cognitiveservices.bicep may have resources (Cognitive Services) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/ai/cognitiveservices.bicep",
        "message": "Security recommendation: Add Managed Identity for Cognitive Services in infra/core/ai/cognitiveservices.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/ai/hub-dependencies.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/ai/hub-dependencies.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/ai/hub-dependencies.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/ai/hub-dependencies.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/ai/hub-dependencies.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/core/ai/hub-dependencies.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/core/ai/hub-dependencies.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/ai/hub.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/ai/hub.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/ai/hub.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/ai/hub.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/ai/hub.bicep uses Access Key for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/core/ai/hub.bicep",
        "message": "Security recommendation: Replace Access Key with Managed Identity in infra/core/ai/hub.bicep",
        "recommendation": "Consider replacing Access Key with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/ai/project.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/ai/project.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/ai/project.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/ai/project.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/bing/bing-search.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/bing/bing-search.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/bing/bing-search.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/bing/bing-search.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/database/cosmos/cosmos-account.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/database/cosmos/cosmos-account.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/database/cosmos/cosmos-account.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/database/cosmos/cosmos-account.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/database/cosmos/cosmos-account.bicep may have resources (Cosmos DB) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/database/cosmos/cosmos-account.bicep",
        "message": "Security recommendation: Add Managed Identity for Cosmos DB in infra/core/database/cosmos/cosmos-account.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/database/cosmos/sql/cosmos-sql-account.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/database/cosmos/sql/cosmos-sql-account.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/database/cosmos/sql/cosmos-sql-account.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/database/cosmos/sql/cosmos-sql-account.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/database/cosmos/sql/cosmos-sql-db.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/database/cosmos/sql/cosmos-sql-db.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/database/cosmos/sql/cosmos-sql-db.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/database/cosmos/sql/cosmos-sql-db.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/database/cosmos/sql/cosmos-sql-db.bicep may have resources (Cosmos DB) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/database/cosmos/sql/cosmos-sql-db.bicep",
        "message": "Security recommendation: Add Managed Identity for Cosmos DB in infra/core/database/cosmos/sql/cosmos-sql-db.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/database/cosmos/sql/cosmos-sql-role-assign.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/database/cosmos/sql/cosmos-sql-role-assign.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/database/cosmos/sql/cosmos-sql-role-assign.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/database/cosmos/sql/cosmos-sql-role-assign.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/database/cosmos/sql/cosmos-sql-role-assign.bicep may have resources (Cosmos DB) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/database/cosmos/sql/cosmos-sql-role-assign.bicep",
        "message": "Security recommendation: Add Managed Identity for Cosmos DB in infra/core/database/cosmos/sql/cosmos-sql-role-assign.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/database/cosmos/sql/cosmos-sql-role-def.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/database/cosmos/sql/cosmos-sql-role-def.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/database/cosmos/sql/cosmos-sql-role-def.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/database/cosmos/sql/cosmos-sql-role-def.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/database/cosmos/sql/cosmos-sql-role-def.bicep may have resources (Cosmos DB) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/database/cosmos/sql/cosmos-sql-role-def.bicep",
        "message": "Security recommendation: Add Managed Identity for Cosmos DB in infra/core/database/cosmos/sql/cosmos-sql-role-def.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/host/ai-environment.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/host/ai-environment.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/ai-environment.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/host/ai-environment.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/ai-environment.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/core/host/ai-environment.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/core/host/ai-environment.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/host/container-app-upsert.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/host/container-app-upsert.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-app-upsert.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/host/container-app-upsert.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-app.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/host/container-app.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-app.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/host/container-app.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-apps-environment.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/host/container-apps-environment.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-apps-environment.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/host/container-apps-environment.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-apps-environment.bicep may have resources (Log Analytics) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/host/container-apps-environment.bicep",
        "message": "Security recommendation: Add Managed Identity for Log Analytics in infra/core/host/container-apps-environment.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/host/container-apps.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/host/container-apps.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-apps.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/host/container-apps.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-registry.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/host/container-registry.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-registry.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/host/container-registry.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-registry.bicep may have resources (Container Registry) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/host/container-registry.bicep",
        "message": "Security recommendation: Add Managed Identity for Container Registry in infra/core/host/container-registry.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/host/ml-online-endpoint.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/host/ml-online-endpoint.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/ml-online-endpoint.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/host/ml-online-endpoint.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/applicationinsights-dashboard.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/monitor/applicationinsights-dashboard.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/applicationinsights-dashboard.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/monitor/applicationinsights-dashboard.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/applicationinsights.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/monitor/applicationinsights.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/applicationinsights.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/monitor/applicationinsights.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/applicationinsights.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/core/monitor/applicationinsights.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/core/monitor/applicationinsights.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/monitor/loganalytics.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/monitor/loganalytics.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/loganalytics.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/monitor/loganalytics.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/loganalytics.bicep may have resources (Log Analytics) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/monitor/loganalytics.bicep",
        "message": "Security recommendation: Add Managed Identity for Log Analytics in infra/core/monitor/loganalytics.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/monitor/monitoring.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/monitor/monitoring.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/monitoring.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/monitor/monitoring.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/monitoring.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/core/monitor/monitoring.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/core/monitor/monitoring.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/search/search-services.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/search/search-services.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/search/search-services.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/search/search-services.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/search/search-services.bicep may have resources (Search Service) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/search/search-services.bicep",
        "message": "Security recommendation: Add Managed Identity for Search Service in infra/core/search/search-services.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/security/keyvault-access.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/security/keyvault-access.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/keyvault-access.bicep may have resources (Key Vault) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/security/keyvault-access.bicep",
        "message": "Security recommendation: Add Managed Identity for Key Vault in infra/core/security/keyvault-access.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/security/keyvault-secret.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/security/keyvault-secret.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/keyvault-secret.bicep may have resources (Key Vault) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/security/keyvault-secret.bicep",
        "message": "Security recommendation: Add Managed Identity for Key Vault in infra/core/security/keyvault-secret.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/security/keyvault.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/security/keyvault.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/keyvault.bicep may have resources (Key Vault) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/security/keyvault.bicep",
        "message": "Security recommendation: Add Managed Identity for Key Vault in infra/core/security/keyvault.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/security/managed-identity.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/security/managed-identity.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/managed-identity.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/security/managed-identity.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/registry-access.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/security/registry-access.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/registry-access.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/security/registry-access.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/registry-access.bicep may have resources (Container Registry) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/security/registry-access.bicep",
        "message": "Security recommendation: Add Managed Identity for Container Registry in infra/core/security/registry-access.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/security/role-cosmos.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/security/role-cosmos.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/role-cosmos.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/security/role-cosmos.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/role-cosmos.bicep may have resources (Cosmos DB) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/security/role-cosmos.bicep",
        "message": "Security recommendation: Add Managed Identity for Cosmos DB in infra/core/security/role-cosmos.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/security/role.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/security/role.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/role.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/security/role.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/storage/storage-account.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/storage/storage-account.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/storage/storage-account.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/storage/storage-account.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/storage/storage-account.bicep may have resources (Storage Account) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/storage/storage-account.bicep",
        "message": "Security recommendation: Add Managed Identity for Storage Account in infra/core/storage/storage-account.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/main.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/main.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/main.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/main.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/main.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/main.test.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/main.test.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/main.test.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/main.test.bicep",
        "severity": "error"
      }
    ],
    "summary": "Issues found - Compliance: 16%"
  },
  "repoUrl": "https://github.com/anfibiacreativa/contoso-creative-writer",
  "ruleSet": "dod",
  "timestamp": "2025-09-02T09:58:32.601Z"
};