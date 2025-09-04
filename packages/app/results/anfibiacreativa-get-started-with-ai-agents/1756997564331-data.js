window.templateData = {
  "compliance": {
    "compliant": [
      {
        "category": "branch",
        "details": {
          "defaultBranch": "main"
        },
        "id": "default-branch-is-main",
        "message": "Default branch is 'main'"
      },
      {
        "category": "bicepFiles",
        "details": {
          "count": 17,
          "files": [
            "infra/api.bicep",
            "infra/core/ai/cognitiveservices.bicep",
            "infra/core/host/ai-environment.bicep",
            "infra/core/host/container-app-upsert.bicep",
            "infra/core/host/container-app.bicep",
            "infra/core/host/container-apps-environment.bicep",
            "infra/core/host/container-apps.bicep",
            "infra/core/host/container-registry.bicep",
            "infra/core/monitor/applicationinsights-dashboard.bicep",
            "infra/core/monitor/applicationinsights.bicep",
            "infra/core/monitor/loganalytics.bicep",
            "infra/core/search/search-services.bicep",
            "infra/core/security/appinsights-access.bicep",
            "infra/core/security/registry-access.bicep",
            "infra/core/security/role.bicep",
            "infra/core/storage/storage-account.bicep",
            "infra/main.bicep"
          ]
        },
        "id": "bicep-files-exist",
        "message": "Bicep files found in infra/ directory: 17 files"
      },
      {
        "category": "bicepSecurity",
        "details": {
          "authMethod": "ManagedIdentity",
          "file": "infra/core/ai/cognitiveservices.bicep"
        },
        "id": "bicep-uses-managed-identity-infra/core/ai/cognitiveservices.bicep",
        "message": "Good practice: infra/core/ai/cognitiveservices.bicep uses Managed Identity for Azure authentication"
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
        "category": "meta",
        "details": {
          "compliantCount": 4,
          "issueCount": 9,
          "percentageCompliant": 31,
          "totalChecks": 13
        },
        "id": "compliance-summary",
        "message": "Compliance: 31%"
      }
    ],
    "issues": [
      {
        "error": "File infra/core/ai/cognitiveservices.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/core/ai/cognitiveservices.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/core/ai/cognitiveservices.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/host/ai-environment.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/core/host/ai-environment.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/core/host/ai-environment.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/host/container-apps-environment.bicep may have resources (Log Analytics) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/host/container-apps-environment.bicep",
        "message": "Security recommendation: Add Managed Identity for Log Analytics in infra/core/host/container-apps-environment.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/host/container-registry.bicep may have resources (Container Registry) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/host/container-registry.bicep",
        "message": "Security recommendation: Add Managed Identity for Container Registry in infra/core/host/container-registry.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/monitor/applicationinsights.bicep uses Connection String for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/core/monitor/applicationinsights.bicep",
        "message": "Security recommendation: Replace Connection String with Managed Identity in infra/core/monitor/applicationinsights.bicep",
        "recommendation": "Consider replacing Connection String with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/monitor/loganalytics.bicep may have resources (Log Analytics) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/monitor/loganalytics.bicep",
        "message": "Security recommendation: Add Managed Identity for Log Analytics in infra/core/monitor/loganalytics.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/search/search-services.bicep uses Access Key for authentication instead of Managed Identity",
        "id": "bicep-alternative-auth-infra/core/search/search-services.bicep",
        "message": "Security recommendation: Replace Access Key with Managed Identity in infra/core/search/search-services.bicep",
        "recommendation": "Consider replacing Access Key with Managed Identity for better security.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/security/registry-access.bicep may have resources (Container Registry) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/security/registry-access.bicep",
        "message": "Security recommendation: Add Managed Identity for Container Registry in infra/core/security/registry-access.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      },
      {
        "error": "File infra/core/storage/storage-account.bicep may have resources (Storage Account) with anonymous access or missing authentication",
        "id": "bicep-missing-auth-infra/core/storage/storage-account.bicep",
        "message": "Security recommendation: Add Managed Identity for Storage Account in infra/core/storage/storage-account.bicep",
        "recommendation": "Configure Managed Identity for secure access to these resources.",
        "severity": "warning"
      }
    ],
    "summary": "Issues found - Compliance: 31%"
  },
  "repoUrl": "https://github.com/anfibiacreativa/get-started-with-ai-agents",
  "ruleSet": "docs",
  "timestamp": "2025-09-04T14:52:22.244Z"
};