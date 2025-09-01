window.templateData = {
  "compliance": {
    "compliant": [
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
          "fileName": "README.md"
        },
        "id": "file-README.md",
        "message": "Required file found: README.md"
      },
      {
        "category": "requiredWorkflow",
        "details": {
          "fileName": ".github/workflows/azure-dev.yml",
          "patternMatched": "\\.github\\/workflows\\/azure-dev\\.(yaml|yml)$"
        },
        "id": "workflow-.github/workflows/azure-dev.yml",
        "message": "Required workflow file found: .github/workflows/azure-dev.yml"
      },
      {
        "category": "requiredFolder",
        "details": {
          "fileCount": 135,
          "folderPath": "src"
        },
        "id": "folder-src",
        "message": "Required folder found: src/"
      },
      {
        "category": "requiredFolder",
        "details": {
          "fileCount": 27,
          "folderPath": "infra"
        },
        "id": "folder-infra",
        "message": "Required folder found: infra/"
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
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/api.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/api.bicep",
        "message": "No deprecated OpenAI models found in infra/api.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/ai/cognitiveservices.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/ai/cognitiveservices.bicep",
        "message": "No deprecated OpenAI models found in infra/core/ai/cognitiveservices.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/host/ai-environment.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/host/ai-environment.bicep",
        "message": "No deprecated OpenAI models found in infra/core/host/ai-environment.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/host/container-app-upsert.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/host/container-app-upsert.bicep",
        "message": "No deprecated OpenAI models found in infra/core/host/container-app-upsert.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/host/container-app.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/host/container-app.bicep",
        "message": "No deprecated OpenAI models found in infra/core/host/container-app.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/host/container-apps-environment.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/host/container-apps-environment.bicep",
        "message": "No deprecated OpenAI models found in infra/core/host/container-apps-environment.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/host/container-apps.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/host/container-apps.bicep",
        "message": "No deprecated OpenAI models found in infra/core/host/container-apps.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/host/container-registry.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/host/container-registry.bicep",
        "message": "No deprecated OpenAI models found in infra/core/host/container-registry.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/monitor/applicationinsights-dashboard.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/monitor/applicationinsights-dashboard.bicep",
        "message": "No deprecated OpenAI models found in infra/core/monitor/applicationinsights-dashboard.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/monitor/applicationinsights.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/monitor/applicationinsights.bicep",
        "message": "No deprecated OpenAI models found in infra/core/monitor/applicationinsights.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/monitor/loganalytics.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/monitor/loganalytics.bicep",
        "message": "No deprecated OpenAI models found in infra/core/monitor/loganalytics.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/search/search-services.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/search/search-services.bicep",
        "message": "No deprecated OpenAI models found in infra/core/search/search-services.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/security/appinsights-access.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/security/appinsights-access.bicep",
        "message": "No deprecated OpenAI models found in infra/core/security/appinsights-access.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/security/registry-access.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/security/registry-access.bicep",
        "message": "No deprecated OpenAI models found in infra/core/security/registry-access.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/security/role.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/security/role.bicep",
        "message": "No deprecated OpenAI models found in infra/core/security/role.bicep"
      },
      {
        "category": "bicepOpenAIModels",
        "details": {
          "file": "infra/core/storage/storage-account.bicep"
        },
        "id": "bicep-no-deprecated-models-infra/core/storage/storage-account.bicep",
        "message": "No deprecated OpenAI models found in infra/core/storage/storage-account.bicep"
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
          "compliantCount": 24,
          "issueCount": 19,
          "percentageCompliant": 56,
          "totalChecks": 43
        },
        "id": "compliance-summary",
        "message": "Compliance: 56%"
      }
    ],
    "issues": [
      {
        "error": "README.md does not contain required h2 heading: Architecture Diagram",
        "id": "readme-missing-architecture-diagram-heading",
        "message": "README.md is missing required h2 heading: Architecture Diagram",
        "severity": "error"
      },
      {
        "error": "File infra/api.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/api.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/ai/cognitiveservices.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/ai/cognitiveservices.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/ai-environment.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/host/ai-environment.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-app-upsert.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/host/container-app-upsert.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-app.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/host/container-app.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-apps-environment.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/host/container-apps-environment.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-apps.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/host/container-apps.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/host/container-registry.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/host/container-registry.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/applicationinsights-dashboard.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/monitor/applicationinsights-dashboard.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/applicationinsights.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/monitor/applicationinsights.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/monitor/loganalytics.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/monitor/loganalytics.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/search/search-services.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/search/search-services.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/appinsights-access.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/security/appinsights-access.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/registry-access.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/security/registry-access.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/security/role.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/security/role.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/core/storage/storage-account.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/core/storage/storage-account.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/main.bicep does not contain required resource Microsoft.Identity",
        "id": "bicep-missing-microsoft.identity",
        "message": "Missing resource \"Microsoft.Identity\" in infra/main.bicep",
        "severity": "error"
      },
      {
        "error": "File infra/main.bicep contains deprecated model gpt-4",
        "id": "bicep-deprecated-model-gpt-4",
        "message": "Deprecated OpenAI model \"gpt-4\" used in infra/main.bicep",
        "severity": "error"
      }
    ],
    "summary": "Issues found - Compliance: 56%"
  },
  "history": [
    {
      "dashboardPath": "1753433551287-dashboard.html",
      "issues": 19,
      "passed": 24,
      "percentage": 56,
      "ruleSet": "partner",
      "timestamp": "2025-07-25T08:52:31.277Z"
    },
    {
      "dashboardPath": "1753436315476-dashboard.html",
      "issues": 19,
      "passed": 24,
      "percentage": 56,
      "ruleSet": "partner",
      "timestamp": "2025-07-25T09:38:35.472Z"
    },
    {
      "dashboardPath": "1753437902949-dashboard.html",
      "issues": 19,
      "passed": 24,
      "percentage": 56,
      "ruleSet": "partner",
      "timestamp": "2025-07-25T10:05:02.940Z"
    },
    {
      "dashboardPath": "1753438216993-dashboard.html",
      "issues": 19,
      "passed": 24,
      "percentage": 56,
      "ruleSet": "partner",
      "timestamp": "2025-07-25T10:10:16.984Z"
    },
    {
      "dashboardPath": "1753438442443-dashboard.html",
      "issues": 19,
      "passed": 24,
      "percentage": 56,
      "ruleSet": "partner",
      "timestamp": "2025-07-25T10:14:02.435Z"
    }
  ],
  "repoUrl": "https://github.com/anfibiacreativa/get-started-with-ai-agents",
  "ruleSet": "partner",
  "timestamp": "2025-07-25T10:14:02.435Z",
  "upstreamTemplate": "Azure-Samples/get-started-with-ai-agents"
};