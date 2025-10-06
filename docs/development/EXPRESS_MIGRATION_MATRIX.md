# Azure Functions → Express Migration Matrix

_Last updated: 2025-01-03_

This document tracks the migration from Azure Functions to Express endpoints. The Azure Functions code is preserved in the `legacy/azure-functions` branch.

## Migration Status Legend

- ✅ **Migrated**: Endpoint fully migrated with parity and tested
- 🔄 **In Progress**: Actively being migrated
- ⏳ **Pending**: Not started, awaiting migration
- 🔍 **Needs Review**: Migration complete but requires additional testing/validation
- ❌ **Blocked**: Migration blocked by dependencies or issues

## Core API Endpoints

| Azure Function | Express Route | Status | Notes | Last Updated |
|----------------|---------------|--------|-------|--------------|
| `github-oauth-token` | `/api/v4/github-oauth-token` | ✅ Migrated | OAuth token exchange with GitHub | 2025-01-02 |
| `runtime-config` | `/api/v4/client-settings` | ✅ Migrated | Runtime configuration for frontend | 2025-01-02 |
| `analyze-template` | `/api/v4/analyze` | ✅ Migrated | Template analysis with fork-first SAML strategy, batch support | 2025-01-02 |

## Validation Workflow (Priority 1)

| Azure Function | Express Route | Status | Dependencies | Notes |
|----------------|---------------|--------|--------------|-------|
| `validate-template` | `/api/v4/validate-template` | ✅ Migrated | GitHub API client | Triggers GitHub workflow dispatch | 2025-01-05 |
| `validation-docker-image` | `/api/v4/validation-docker-image` | ✅ Migrated | - | Docker image validation | 2025-01-05 |
| `validation-ossf` | `/api/v4/validation-ossf` | ✅ Migrated | - | OSSF scorecard validation | 2025-01-05 |
| `validation-status` | `/api/v4/validation-status` | ✅ Migrated | validate-template | Polls GitHub workflow status | 2025-01-05 |
| `validation-callback` | `/api/v4/validation-callback` | ✅ Migrated | validate-template | Webhook from GitHub workflow | 2025-01-05 |
| `validation-cancel` | `/api/v4/validation-cancel` | ✅ Migrated | validate-template | Cancels running validation | 2025-01-05 |

## GitHub Actions Integration (Priority 2)

| Azure Function | Express Route | Status | Dependencies | Notes |
|----------------|---------------|--------|--------------|-------|
| `action-trigger` | `/api/v4/workflow-trigger` | ✅ Migrated | GitHub API client | Triggers GitHub Actions workflows | 2025-01-06 |
| `action-run-status` | `/api/v4/workflow-run-status` | ✅ Migrated | action-trigger | Polls GitHub Actions run status | 2025-01-06 |
| `action-run-artifacts` | `/api/v4/workflow-run-artifacts` | ✅ Migrated | action-trigger | Retrieves workflow artifacts | 2025-01-06 |

## Analysis & Submission (Priority 3)

| Azure Function | Express Route | Status | Dependencies | Notes |
|----------------|---------------|--------|--------------|-------|
| `submit-analysis-dispatch` | `/api/v4/submit-analysis-dispatch` | ✅ Migrated | GitHub API client | Dispatches analysis submission workflow | 2025-01-05 |
| `add-template-pr` | `/api/v4/add-template-pr` | ✅ Migrated | GitHub API client | Creates PR with dashboard results | 2025-01-05 |
| `archive-collection` | `/api/v4/archive-collection` | ✅ Migrated | GitHub API client | Archives metadata to central repo | 2025-01-05 |

## Repository Management (Priority 4)

| Azure Function | Express Route | Status | Dependencies | Notes |
|----------------|---------------|--------|--------------|-------|
| `repo-fork` | `/api/v4/repo-fork` | ⏳ Pending | GitHub API client | Handles repository forking for SAML |
| `batch-scan-start` | `/api/v4/batch-scan-start` | ⏳ Pending | analyze-template | Initiates batch scan operations |

## Issue Management (Priority 5)

| Azure Function | Express Route | Status | Dependencies | Notes |
|----------------|---------------|--------|--------------|-------|
| `issue-create` | `/api/v4/issue-create` | ✅ Migrated | GitHub API client | Creates GitHub issues with labels | 2025-01-05 |
| `issue-ai-proxy` | `/api/v4/issue-ai-proxy` | ⏳ Pending | AI provider config | Proxies AI enrichment requests |

## Setup & Configuration (Priority 6)

| Azure Function | Express Route | Status | Dependencies | Notes |
|----------------|---------------|--------|--------------|-------|
| `setup` | `/api/v4/setup` | ⏳ Pending | - | Initial setup and configuration |

## Migration Progress

### Completed: 13 / 20 (65%)

- ✅ OAuth flow
- ✅ Runtime configuration
- ✅ Template analysis
- ✅ All validation endpoints (6 endpoints)
- ✅ Issue creation
- ✅ All analysis & submission endpoints (3 endpoints)

### Remaining: 7 Functions

**Estimated Timeline:**
- Priority 1 (Validation): 2-3 days
- Priority 2 (Actions): 1-2 days
- Priority 3 (Analysis): 2 days
- Priority 4 (Repo Mgmt): 1 day
- Priority 5 (Issues): 1-2 days
- Priority 6 (Setup): 1 day

**Total Estimated: 8-11 days**

## Testing Checklist

For each migrated endpoint:

- [ ] Unit tests written for Express route handler
- [ ] Integration tests verify parity with Azure Function
- [ ] Error handling matches or improves on original
- [ ] CORS configuration verified
- [ ] Environment variables documented
- [ ] Smoke test with `scripts/smoke-api.sh`
- [ ] Frontend integration tested
- [ ] Docker deployment tested

## Breaking Changes Log

Document any intentional breaking changes during migration:

### `/api/v4/analyze`
- **Change**: None - Full backward compatibility maintained
- **Reason**: N/A
- **Migration Guide**: N/A

### `/api/v4/client-settings`
- **Change**: Route name changed from `/api/runtime-config` to `/api/v4/client-settings`
- **Reason**: Better semantic naming and versioning
- **Migration Guide**: Update frontend API calls to use new route

### `/api/v4/github-oauth-token`
- **Change**: None - Full backward compatibility maintained
- **Reason**: N/A
- **Migration Guide**: N/A

## Deployment Strategy

### Phase 1: Parallel Deployment
- Express server runs alongside Azure Functions
- Frontend configured to use Express endpoints via feature flag
- Gradual rollout with canary testing

### Phase 2: Full Migration
- All traffic directed to Express server
- Azure Functions kept running for emergency rollback
- Monitoring and alerting in place

### Phase 3: Decommission
- Azure Functions stopped after 2-week stability period
- Code archived to `legacy/azure-functions` branch
- Documentation updated

### Current Phase: **Phase 1** (Parallel Deployment)

## Rollback Plan

If critical issues are discovered:

1. Revert frontend config to use Azure Functions endpoints
2. Redeploy previous frontend build
3. Investigate and fix Express endpoint issues
4. Re-test thoroughly before retry

## Known Issues

_None currently_

## Migration Notes

### Shared Components

The following components are used by both Azure Functions (legacy) and Express:

- `packages/api/analyzer-core/` - Core analysis engine (used by both)
- `packages/api/shared/` - Shared utilities and types
- GitHub API client implementations

### Code Reuse Strategy

- Core analyzer logic remains in `analyzer-core` package
- Shared utilities extracted to `packages/server/src/shared/`
- Type definitions maintained in common location
- Tests remain close to implementation

### Authentication & Authorization

- Express middleware handles CORS and auth
- GitHub token validation consistent with Functions
- OAuth flow maintained with same security model
- SAML/SSO fork-first strategy preserved

## References

- [Architecture Documentation](./architecture.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [Express Server Implementation](../../packages/server/)
- [Legacy Azure Functions](../../packages/api/) (to be moved to legacy branch)
