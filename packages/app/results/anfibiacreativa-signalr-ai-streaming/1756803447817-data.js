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
        "category": "requiredFolder",
        "details": {
          "fileCount": 14,
          "folderPath": "infra"
        },
        "id": "folder-infra",
        "message": "Required folder found: infra/"
      },
      {
        "category": "requiredFolder",
        "details": {
          "fileCount": 5,
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
          "count": 12,
          "files": [
            "infra/app/AIStreaming.bicep",
            "infra/core/ai/cognitiveservices.bicep",
            "infra/core/security/registry-access.bicep",
            "infra/core/security/role.bicep",
            "infra/core/signalr/siganlr.bicep",
            "infra/main.bicep",
            "infra/modules/fetch-container-image.bicep",
            "infra/shared/apps-env.bicep",
            "infra/shared/dashboard-web.bicep",
            "infra/shared/keyvault.bicep",
            "infra/shared/monitoring.bicep",
            "infra/shared/registry.bicep"
          ]
        },
        "id": "bicep-files-exist",
        "message": "Bicep files found in infra/ directory: 12 files"
      },
      {
        "category": "bicepSecurity",
        "details": {
          "authMethod": "ManagedIdentity",
          "file": "infra/app/AIStreaming.bicep"
        },
        "id": "bicep-uses-managed-identity-infra/app/AIStreaming.bicep",
        "message": "Good practice: infra/app/AIStreaming.bicep uses Managed Identity for Azure authentication"
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
          "file": "infra/shared/keyvault.bicep",
          "resource": "Microsoft.KeyVault/vaults"
        },
        "id": "bicep-resource-microsoft.keyvault/vaults-infra/shared/keyvault.bicep",
        "message": "Found required resource \"Microsoft.KeyVault/vaults\" in infra/shared/keyvault.bicep"
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
          "compliantCount": 11,
          "issueCount": 33,
          "percentageCompliant": 25,
          "totalChecks": 44
        },
        "id": "compliance-summary",
        "message": "Compliance: 25%"
      }
    ],
    "issues": [
      {
        "error": "File LICENSE not found in repository",
        "id": "missing-LICENSE",
        "message": "Missing required file: LICENSE",
        "severity": "error"
      },
      {
        "error": "Missing required GitHub workflow: azure-dev.yml",
        "id": "missing-workflow-.github\\/workflows\\/azure-dev.yml",
        "message": "Missing required GitHub workflow: azure-dev.yml",
        "severity": "error"
      },
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
        "error": "File infra/app/AIStreaming.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/app/AIStreaming.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/app/AIStreaming.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/app/AIStreaming.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/app/AIStreaming.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/app/AIStreaming.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/app/AIStreaming.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
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
        "error": "File infra/core/signalr/siganlr.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/core/signalr/siganlr.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/signalr/siganlr.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/core/signalr/siganlr.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/main.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/main.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/modules/fetch-container-image.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/modules/fetch-container-image.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/modules/fetch-container-image.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/modules/fetch-container-image.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/shared/apps-env.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/shared/apps-env.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/shared/apps-env.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/shared/apps-env.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/shared/apps-env.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/shared/apps-env.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/shared/apps-env.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/shared/dashboard-web.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/shared/dashboard-web.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/shared/dashboard-web.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/shared/dashboard-web.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/shared/keyvault.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/shared/keyvault.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/shared/keyvault.bicep may have resources (Key Vault) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/shared/keyvault.bicep",
        "message": "Security recommendation: Add Managed Identity for Key Vault in infra/shared/keyvault.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/shared/monitoring.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/shared/monitoring.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/shared/monitoring.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/shared/monitoring.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/shared/monitoring.bicep may have resources (Log Analytics) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/shared/monitoring.bicep",
        "message": "Security recommendation: Add Managed Identity for Log Analytics in infra/shared/monitoring.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/shared/registry.bicep does not contain required resource Microsoft.Resources/resourceGroups",
        "id": "bicep-missing-microsoft.resources/resourcegroups",
        "message": "Missing resource \"Microsoft.Resources/resourceGroups\" in infra/shared/registry.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/shared/registry.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/shared/registry.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/shared/registry.bicep may have resources (Container Registry) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/shared/registry.bicep",
        "message": "Security recommendation: Add Managed Identity for Container Registry in infra/shared/registry.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      }
    ],
    "summary": "Issues found - Compliance: 25%"
  },
  "repoUrl": "https://github.com/anfibiacreativa/signalr-ai-streaming",
  "ruleSet": "dod",
  "timestamp": "2025-09-02T08:53:27.297Z"
};