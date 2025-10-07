# Cleanup Plan - Post v1.0.0 Express Migration

## Root-Level Scripts (Keep at Root)

These convenience scripts should **stay at root** for easy access:
- ✅ `docker-start.sh` - Documented in DOCKER.md, used frequently
- ✅ `docker-stop.sh` - Documented in DOCKER.md, used frequently  
- ✅ `preview.sh` - Documented in OAUTH_SETUP_PORT_3000.md
- ✅ `start-dev-servers.sh` - Development convenience script
- ✅ `test-auth-flow.sh` - OAuth debugging utility

**Rationale**: Moving these would require updating multiple docs (DOCKER.md, OAUTH_SETUP_PORT_3000.md, PORT_ALLOCATION.md, README.md). They're meant to be run from root for convenience.

## Scripts Directory - Review Needed

### Test/Development Scripts (Low Priority)
- [ ] `scripts/test-add-template.json` - Test data, may still be useful
- [ ] `scripts/test-submit-analysis-local.js` - Local testing utility
- [ ] `scripts/bootstrap-node.sh` - Node setup alternative
- [ ] `scripts/reset-results.sh` - Development utility

### Scripts to KEEP (Actively Used)
- ✅ `scripts/setup.sh` - **CRITICAL** - UAMI/GitHub Actions auth (referenced in package.json, UAMI_SETUP_INSTRUCTIONS.md)
- ✅ `scripts/verify-packages.sh` - Used by guard-packages.yml workflow
- ✅ `scripts/fetch-deprecated-models.js` - Used by update-deprecated-models.yml
- ✅ `scripts/list-ai-quotas.sh` - Used by validation-template.yml
- ✅ `scripts/smoke-api.sh` - Express API testing
- ✅ `scripts/action.js` - GitHub Action entry point
- ✅ `scripts/analyze.js` - CLI tool
- ✅ `scripts/analyzer-node.js` - CLI tool
- ✅ `scripts/batch-scan.sh` - Batch operations
- ✅ `scripts/test-github-token.js` - Debugging utility
- ✅ `scripts/ensure-node-version.js` - CI/CD requirement
- ✅ `scripts/extract-repo-urls.js` - Data processing
- ✅ `scripts/generate-scan-meta-backfill.js` - Data generation

## Recommended Actions

### Immediate - Safe Cleanup
1. Review and possibly remove low-priority test scripts (after confirming not in use)
2. Consider consolidating similar scripts if duplication found

### Documentation Updates
- [ ] Update docs/development/SCRIPTS_AUDIT.md with final decisions
- [ ] Ensure all script purposes are documented
- [ ] Add migration notes for any removed scripts

### Future Consideration
- After full Express migration (17 remaining Functions), review test scripts again
- Consider creating a `dev/` folder for development-only utilities if root gets cluttered

## Note on scripts/setup.sh
**DO NOT DELETE** - This is critical for:
- User Assigned Managed Identity (UAMI) setup
- GitHub Actions authentication
- Production CI/CD workflows
- Referenced in package.json as `npm run setup:uami`
