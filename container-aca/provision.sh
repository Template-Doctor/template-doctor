#!/usr/bin/env bash
# This script is invoked by the API. It clones the repo, installs deps, and runs `azd up`.
# It assumes the container app has a managed identity with sufficient RBAC (Owner/Contributor) on the target scope.

set -euo pipefail

REPO_URL="${1:-}"
ENV_NAME="${2:-poc}"
LOCATION_DEFAULT="${3:-westeurope}"
WORKDIR="/workspace/app"

if [[ -z "$REPO_URL" ]]; then
  echo "Missing repo URL" >&2
  exit 2
fi

# Optional: GitHub token support for private repos (pass via env GH_TOKEN or header from the Function)
GH_TOKEN="${GH_TOKEN:-}"

rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"
cd /workspace

# Clone with or without token
if [[ -n "$GH_TOKEN" ]]; then
  # support https://github.com/org/repo(.git)
  if [[ "$REPO_URL" =~ ^https://github\.com/([^/]+)/([^/.]+)(\.git)?$ ]]; then
    ORG="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]}"
    git clone "https://${GH_TOKEN}:x-oauth-basic@github.com/${ORG}/${REPO}.git" "$WORKDIR"
  else
    echo "Unsupported repo URL for token auth. Expect https://github.com/<org>/<repo>" >&2
    exit 3
  fi
else
  git clone "$REPO_URL" "$WORKDIR"
fi

cd "$WORKDIR"

# Non-interactive AZ auth: prefer managed identity inside ACA
# Requires the container app to have a system- or user-assigned identity
az login --identity >/dev/null

# Ensure az sees correct subscription if ACA already set defaults via env
if [[ -n "${AZURE_SUBSCRIPTION_ID:-}" ]]; then
  az account set --subscription "$AZURE_SUBSCRIPTION_ID"
fi

# Set azd defaults for non-interactive run
# (You can also set these once globally in the container with `azd config set defaults.subscription` etc.)
if [[ -n "${AZURE_SUBSCRIPTION_ID:-}" ]]; then
  azd config set defaults.subscription "$AZURE_SUBSCRIPTION_ID"
fi
if [[ -n "${AZURE_LOCATION:-}" ]]; then
  azd config set defaults.location "$AZURE_LOCATION"
else
  azd config set defaults.location "$LOCATION_DEFAULT"
fi

# Install Node deps if present (many azd templates rely on npm workspaces)
if [[ -f "package-lock.json" || -f "package.json" ]]; then
  npm ci || npm install
fi

# Run azd up non-interactively. `--no-prompt` fails if a needed value has no default,
# so set required env vars beforehand if this template needs them.
# Use the repo's root (where azure.yaml normally sits).
if [[ -f "azure.yaml" ]]; then
  # Optionally pass extra env vars here with `azd env set` if your template requires (e.g., OPENAI config).
  azd up --no-prompt --environment "$ENV_NAME"
else
  # Try searching for azure.yaml if repo keeps infra in a subfolder (rare in azd samples)
  AZURE_YAML=$(grep -rl --include="azure.yaml" -m 1 . || true)
  if [[ -n "$AZURE_YAML" ]]; then
    cd "$(dirname "$AZURE_YAML")"
    azd up --no-prompt --environment "$ENV_NAME"
  else
    echo "No azure.yaml found. This repo may not be an azd template." >&2
    exit 4
  fi
fi
