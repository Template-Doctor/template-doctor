#!/usr/bin/env bash
set -euo pipefail

# Template Doctor API Smoke Test Script
# Loads variables from .env (if present) and runs a suite of curl checks against the local Functions host.
# Usage:
#   ./scripts/smoke-api.sh              # assumes host at http://localhost:7071
#   BASE=http://alt:7072 ./scripts/smoke-api.sh
#   DRY_RUN=1 ./scripts/smoke-api.sh    # only print commands
#
# Required (or resolved from .env):
#   GITHUB_TOKEN (for authenticated endpoints)
#   GITHUB_OWNER / GITHUB_REPO (for workflow + PR operations)
# Optional:
#   TEMPLATE_REPO_URL (target template), defaults to https://github.com/microsoft/template-sample
#   RULE_SET (defaults to default)
#   OVERRIDE_KEY / OVERRIDE_VALUE (defaults to DEFAULT_RULE_SET / light)
#
# Exit codes:
#   0 success, non-zero on first failing required check.

COLOR_OK="\033[32m"; COLOR_ERR="\033[31m"; COLOR_DIM="\033[2m"; COLOR_RST="\033[0m"

log() { echo -e "${COLOR_DIM}[$(date +%H:%M:%S)]${COLOR_RST} $*"; }
ok()  { echo -e "${COLOR_OK}✔${COLOR_RST} $*"; }
err() { echo -e "${COLOR_ERR}✖ $*${COLOR_RST}" >&2; }

# 1. Load .env if present (simple KEY=VALUE lines; ignores comments)
if [[ -f .env ]]; then
  log "Loading .env"
  # shellcheck disable=SC2046
  export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | sed 's/#.*//' | xargs -0 echo || true)
fi

BASE=${BASE:-http://localhost:7071}
GITHUB_TOKEN=${GITHUB_TOKEN:-${GH_WORKFLOW_TOKEN:-}}
GITHUB_OWNER=${GITHUB_OWNER:-${GITHUB_REPO_OWNER:-${OWNER:-}}}
GITHUB_REPO=${GITHUB_REPO:-template-doctor}
TEMPLATE_REPO_URL=${TEMPLATE_REPO_URL:-https://github.com/microsoft/template-sample}
RULE_SET=${RULE_SET:-default}
OVERRIDE_KEY=${OVERRIDE_KEY:-DEFAULT_RULE_SET}
OVERRIDE_VALUE=${OVERRIDE_VALUE:-light}
TIMESTAMP=$(date +%s)

if [[ -z ${GITHUB_OWNER} ]]; then
  GITHUB_OWNER="microsoft" # fallback
fi

if ! command -v curl >/dev/null; then err "curl not found"; exit 2; fi
if ! command -v jq >/dev/null; then log "jq not found: output will be raw"; fi

DRY_RUN=${DRY_RUN:-0}
run() {
  if [[ $DRY_RUN == 1 ]]; then
    echo "[DRY] $*"
  else
    eval "$@"
  fi
}

section() { echo -e "\n${COLOR_DIM}=== $* ===${COLOR_RST}"; }

fail() { err "$1"; exit 1; }

# Helper to require 2xx status
curl_json() {
  local name=$1; shift
  local cmd=(curl -s -w "\n%{http_code}" "$@")
  local out http
  out=$("${cmd[@]}") || fail "Curl failed: $name"
  http=$(echo "$out" | tail -n1)
  body=$(echo "$out" | sed '$d')
  if [[ ! $http =~ ^2 ]]; then
    err "$name HTTP $http"; echo "$body" >&2; exit 1
  fi
  echo "$body"
}

section "1. Client Settings (GET)"
if [[ ${DEBUG:-0} == 1 ]]; then
  log "(debug) Raw headers for client-settings"
  run "curl -i -H 'Accept: application/json' '$BASE/api/v4/client-settings' | sed -e 's/^/HDR: /'"
fi
BODY=$(curl_json client-settings "-H" "Accept: application/json" "$BASE/api/v4/client-settings")
if [[ -z $BODY || $BODY == "null" ]]; then
  err "Primary route returned empty body. Trying fallback legacy route /api/v4/runtime-config"
  FALLBACK=$(curl -s -w "\n%{http_code}" "$BASE/api/v4/runtime-config")
  FB_CODE=$(echo "$FALLBACK" | tail -n1)
  FB_BODY=$(echo "$FALLBACK" | sed '$d')
  if [[ $FB_CODE =~ ^2 && -n $FB_BODY ]]; then
    ok "Fallback /api/v4/runtime-config returned payload (consider updating smoke script routes?)"
    BODY=$FB_BODY
  else
    err "Fallback also failed (HTTP $FB_CODE). Dumping minimal diagnostics.";
    log "len(primary)=${#BODY} len(fallback)=${#FB_BODY}"
    if [[ ${DEBUG:-0} == 1 ]]; then
      echo "$BODY" | sed 's/^/BODY: /'
      echo "$FB_BODY" | sed 's/^/FALLBACK_BODY: /'
    fi
    fail "Empty client-settings response"
  fi
fi
ok "client-settings returned payload (size ${#BODY})"

section "2. Setup override (if token + allowlist)"
if [[ -n $GITHUB_TOKEN ]]; then
  RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v4/setup" \
    -H "Authorization: Bearer $GITHUB_TOKEN" -H "Content-Type: application/json" \
    -d "{\"overrides\":{\"$OVERRIDE_KEY\":\"$OVERRIDE_VALUE\"}}") || true
  if [[ $RESP == 200 || $RESP == 401 || $RESP == 403 ]]; then
    ok "setup endpoint responded ($RESP)"
  else
    err "setup unexpected HTTP $RESP"
  fi
else
  log "Skipping setup override (no GITHUB_TOKEN)"
fi

section "3. Analyze template"
ANALYZE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v4/analyze-template" \
  -H "Content-Type: application/json" \
  -d "{\"repoUrl\":\"$TEMPLATE_REPO_URL\",\"ruleSet\":\"$RULE_SET\"}") || true
[[ $ANALYZE_STATUS =~ ^2|^4 ]] || fail "Analyze returned $ANALYZE_STATUS"
ok "analyze-template HTTP $ANALYZE_STATUS"

section "4. Validation start"
VAL_START=$(curl_json validation-start -X POST "$BASE/api/v4/validation-template" \
  -H "Content-Type: application/json" \
  -d "{\"repoUrl\":\"$TEMPLATE_REPO_URL\"}")
VALIDATION_ID=$(echo "$VAL_START" | jq -r '.id // .validationId // empty' 2>/dev/null || echo '')
[[ -n $VALIDATION_ID ]] || log "Validation ID not found (may still be processing)"

section "5. Validation status"
if [[ -n $VALIDATION_ID ]]; then
  STATUS_BODY=$(curl_json validation-status "$BASE/api/v4/validation-status?id=$VALIDATION_ID")
  ok "validation-status query ok"
else
  log "Skipping status (no ID)"
fi

section "6. Validation cancel"
if [[ -n $VALIDATION_ID ]]; then
  CANCEL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v4/validation-cancel" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"$VALIDATION_ID\"}")
  ok "validation-cancel HTTP $CANCEL_CODE"
fi

section "7. OSSF validation"
OSSF_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v4/validation-ossf" \
  -H "Content-Type: application/json" \
  -d "{\"repoUrl\":\"$TEMPLATE_REPO_URL\"}")
ok "validation-ossf HTTP $OSSF_CODE"

section "8. Docker image validation"
IMG_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v4/validation-docker-image" \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"ghcr.io/owner/sample:latest\"}")
ok "validation-docker-image HTTP $IMG_CODE"

section "9. Submit analysis dispatch"
DISPATCH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v4/submit-analysis-dispatch" \
  -H "Content-Type: application/json" \
  -d "{\"repoUrl\":\"$TEMPLATE_REPO_URL\",\"ruleSet\":\"$RULE_SET\"}")
ok "submit-analysis-dispatch HTTP $DISPATCH_CODE"

section "10. Add template PR (auth required)"
if [[ -n $GITHUB_TOKEN ]]; then
  ADD_PR_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v4/add-template-pr" \
    -H "Authorization: Bearer $GITHUB_TOKEN" -H "Content-Type: application/json" \
    -d "{\"timestamp\":$TIMESTAMP,\"repoUrl\":\"$TEMPLATE_REPO_URL\",\"ruleSet\":\"$RULE_SET\",\"compliance\":{\"percentage\":70,\"issues\":3,\"passed\":9}}")
  ok "add-template-pr HTTP $ADD_PR_CODE"
else
  log "Skipping add-template-pr (no token)"
fi

section "11. Archive collection"
ARCHIVE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v4/archive-collection" \
  -H "Content-Type: application/json" \
  -d "{\"collection\":\"default\",\"repoUrls\":[\"$TEMPLATE_REPO_URL\"]}")
ok "archive-collection HTTP $ARCHIVE_CODE"

section "12. Issue AI proxy"
if [[ -n $GITHUB_TOKEN ]]; then
  ISSUE_AI_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v4/issue-ai" \
    -H "Authorization: Bearer $GITHUB_TOKEN" -H "Content-Type: application/json" \
    -d '{"prompt":"Summarize issues","context":["A","B"]}')
  ok "issue-ai HTTP $ISSUE_AI_CODE"
else
  log "Skipping issue-ai (no token)"
fi

section "13. GitHub OAuth token endpoint (GET)"
GHO_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v4/github-oauth-token")
ok "github-oauth-token HTTP $GHO_CODE"

section "14. Negative tests"
PUT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v4/client-settings" || true)
if [[ $PUT_CODE == 405 || $PUT_CODE == 400 || $PUT_CODE == 404 ]]; then
  ok "negative PUT produced expected non-2xx ($PUT_CODE)"
else
  err "Unexpected code for negative test: $PUT_CODE"; fi

UNKNOWN_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v4/does-not-exist" || true)
[[ $UNKNOWN_CODE == 404 ]] && ok "unknown route 404" || err "Unexpected code for unknown route: $UNKNOWN_CODE"

section "Summary"
ok "Smoke script completed"
