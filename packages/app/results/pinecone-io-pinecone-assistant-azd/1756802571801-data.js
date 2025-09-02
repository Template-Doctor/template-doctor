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
          "fileCount": 12,
          "folderPath": "infra"
        },
        "id": "folder-infra",
        "message": "Required folder found: infra/"
      },
      {
        "category": "requiredFolder",
        "details": {
          "fileCount": 1,
          "folderPath": ".github"
        },
        "id": "folder-.github",
        "message": "Required folder found: .github/"
      },
      {
        "category": "bicepFiles",
        "details": {
          "count": 10,
          "files": [
            "infra/cdn/cdn.bicep",
            "infra/containers/container-app-environment.bicep",
            "infra/containers/container-app.bicep",
            "infra/containers/container-registry.bicep",
            "infra/insights/application-insights.bicep",
            "infra/insights/log-analytics-workspace.bicep",
            "infra/main.bicep",
            "infra/security/keyvault.bicep",
            "infra/security/user-assigned-identity.bicep",
            "infra/web-app.bicep"
          ]
        },
        "id": "bicep-files-exist",
        "message": "Bicep files found in infra/ directory: 10 files"
      },
      {
        "category": "bicepSecurity",
        "details": {
          "authMethod": "ManagedIdentity",
          "file": "infra/containers/container-app.bicep"
        },
        "id": "bicep-uses-managed-identity-infra/containers/container-app.bicep",
        "message": "Good practice: infra/containers/container-app.bicep uses Managed Identity for Azure authentication"
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
        "category": "bicepResource",
        "details": {
          "file": "infra/security/keyvault.bicep",
          "resource": "Microsoft.KeyVault/vaults"
        },
        "id": "bicep-resource-microsoft.keyvault/vaults-infra/security/keyvault.bicep",
        "message": "Found required resource \"Microsoft.KeyVault/vaults\" in infra/security/keyvault.bicep"
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
          "compliantCount": 12,
          "issueCount": 26,
          "percentageCompliant": 32,
          "totalChecks": 38
        },
        "id": "compliance-summary",
        "message": "Compliance: 32%"
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
        "error": "README.md does not contain required h2 heading: Getting Started",
        "id": "readme-missing-heading-getting-started",
        "message": "README.md is missing required h2 heading: Getting Started",
        "severity": "error"
      },
      {
        "error": "README.md does not contain required h2 heading: Architecture",
        "id": "readme-missing-architecture-diagram-heading",
        "message": "README.md is missing required h2 heading: Architecture",
        "severity": "error"
      },
      {
        "error": "File infra/cdn/cdn.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/cdn/cdn.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/cdn/cdn.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/cdn/cdn.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/containers/container-app-environment.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/containers/container-app-environment.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/containers/container-app-environment.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/containers/container-app-environment.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/containers/container-app.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/containers/container-app.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/containers/container-app.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/containers/container-app.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/containers/container-registry.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/containers/container-registry.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/containers/container-registry.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/containers/container-registry.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/containers/container-registry.bicep may have resources (Container Registry) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/containers/container-registry.bicep",
        "message": "Security recommendation: Add Managed Identity for Container Registry in infra/containers/container-registry.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/insights/application-insights.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/insights/application-insights.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/insights/application-insights.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/insights/application-insights.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/insights/application-insights.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/insights/application-insights.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/insights/application-insights.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/insights/log-analytics-workspace.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/insights/log-analytics-workspace.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/insights/log-analytics-workspace.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/insights/log-analytics-workspace.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/insights/log-analytics-workspace.bicep may have resources (Log Analytics) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/insights/log-analytics-workspace.bicep",
        "message": "Security recommendation: Add Managed Identity for Log Analytics in infra/insights/log-analytics-workspace.bicep",
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
        "error": "File infra/security/keyvault.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/security/keyvault.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/security/keyvault.bicep may have resources (Key Vault) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/security/keyvault.bicep",
        "message": "Security recommendation: Add Managed Identity for Key Vault in infra/security/keyvault.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/security/user-assigned-identity.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/security/user-assigned-identity.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/security/user-assigned-identity.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/security/user-assigned-identity.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/web-app.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/web-app.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/web-app.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/web-app.bicep",
        "severity": "error"
      }
    ],
    "summary": "Issues found - Compliance: 32%"
  },
  "repoUrl": "https://github.com/pinecone-io/pinecone-assistant-azd",
  "ruleSet": "dod",
  "timestamp": "2025-09-02T08:42:27.569Z"
};