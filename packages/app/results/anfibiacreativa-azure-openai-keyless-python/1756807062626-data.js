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
        "category": "requiredFolder",
        "details": {
          "fileCount": 2,
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
          "count": 1,
          "files": [
            "infra/main.bicep"
          ]
        },
        "id": "bicep-files-exist",
        "message": "Bicep files found in infra/ directory: 1 files"
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
        "category": "meta",
        "details": {
          "compliantCount": 9,
          "issueCount": 5,
          "percentageCompliant": 64,
          "totalChecks": 14
        },
        "id": "compliance-summary",
        "message": "Compliance: 64%"
      }
    ],
    "issues": [
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
        "error": "File infra/main.bicep does not contain required resource Microsoft.KeyVault/vaults",
        "id": "bicep-missing-microsoft.keyvault/vaults",
        "message": "Missing resource \"Microsoft.KeyVault/vaults\" in infra/main.bicep",
        "severity": "error"
      },
      {
        "error": "File azure.yaml does not define required \"services:\" section",
        "id": "azure-yaml-missing-services",
        "message": "No \"services:\" defined in azure.yaml",
        "severity": "error"
      }
    ],
    "summary": "Issues found - Compliance: 64%"
  },
  "repoUrl": "https://github.com/anfibiacreativa/azure-openai-keyless-python",
  "ruleSet": "dod",
  "timestamp": "2025-09-02T09:57:27.550Z"
};