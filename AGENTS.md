# Template Doctor - AI Agents Guide

This document provides specific guidance for AI agents working with the Template Doctor codebase. It complements the README.md with focused information for automated assistance.

## Project Overview

Template Doctor analyzes and validates sample templates, with a focus on Azure Developer CLI (azd) templates. It's structured as a monorepo with independently deployable packages:

- **packages/app**: Static web app (frontend UI)
- **packages/api**: Azure Functions (PR creation, OAuth helpers, AZD validation)
- **packages/analyzer-core**: Core analyzer functionality
- **packages/server**: Server-side functions (deprecated)

## Development Environment Setup

### Prerequisites

- Node.js LTS
- npm 
- Azure Functions Core Tools (for API development)
- Python 3 (for serving frontend locally)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/Template-Doctor/template-doctor.git
   cd template-doctor
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. Environment setup:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with appropriate values.

4. Start services (in separate terminals):
   - API: `npm run -w packages/api start`
   - Frontend: `cd ./packages/app && python3 -m http.server 4000`

5. Access the application at http://localhost:4000

## Code Structure Insights

- The frontend is vanilla JavaScript (planned migration to TypeScript)
- The API is Azure Functions
- Results are stored as JS files under `packages/app/results/`
- Configuration is split across:
  - `.env` file (root)
  - `config.json` files (in packages)

## OAuth Configuration

For local development:
- GitHub OAuth callback URL must match frontend port: `http://localhost:4000/callback.html`
- If changing the port, update both:
  1. The local server command in README.md
  2. The callback URL in GitHub OAuth app settings
  3. The examples in docs/development/OAUTH_CONFIGURATION.md

## Testing Guidelines

Run all tests from the project root:
```bash
npm test           # Run all tests
npm run test:ui    # Run tests with UI
npm run test:debug # Run tests in debug mode
```

Run specific tests:
```bash
npm run test -- "-g" "should handle search functionality" packages/app/tests/app.spec.js
```

### API Smoke Script

For a quick end‑to‑end verification of the local Azure Functions endpoints (runtime-config, validation, analysis, archive, PR creation, etc.) use the smoke script:

```bash
./scripts/smoke-api.sh            # assumes host at http://localhost:7071 and reads .env
BASE=http://localhost:7072 ./scripts/smoke-api.sh   # override base
DRY_RUN=1 ./scripts/smoke-api.sh  # print commands only
```

The script will:
1. Load variables from `.env` (simple KEY=VALUE lines)
2. Probe each public endpoint (GET/POST) and basic negative routes
3. Attempt authenticated operations if `GITHUB_TOKEN` is present (add-template-pr, setup overrides, issue-ai)
4. Summarize success/fail at the end

Environment variable precedence: explicitly exported shell vars > `.env`. Override any value by exporting before invoking the script.

The script exits non‑zero on the first critical failure (missing endpoint / unexpected HTTP code) so it can be wired into CI.

### Test Conventions
- Frontend tests use Playwright
- No native browser dialogs (use notifications) to keep tests stable
- Test files are stored in `packages/app/tests/`

## Commit Guidelines

- Add/update tests for features and fixes
- Format code before committing
- Don't commit generated artifacts like `node_modules/` or large reports
- Update docs and workflows when changing paths or behavior

## Important Files to Understand

- `packages/app/results/index-data.js`: Master list of scanned templates
- `packages/app/results/<owner-repo>/<timestamp>-data.js`: Per-scan data
- `packages/app/results/<owner-repo>/<timestamp>-dashboard.html`: Per-scan dashboard
- `docs/development/ENVIRONMENT_VARIABLES.md`: Complete reference of all environment variables
- `docs/development/OAUTH_CONFIGURATION.md`: OAuth setup details
- `docs/usage/GITHUB_ACTION_SETUP.md`: GitHub Action setup guide

## Security Considerations

- Sensitive credentials should be stored in environment variables, not committed to the repo
- GitHub OAuth requires different app registrations for local and production environments
- For AZD deployment, Azure Managed Identity is required
- The Security Analysis feature reviews Bicep files for security best practices

### SAML/SSO and Forking Policy

- Organization SAML/SSO does NOT block creating a fork. Only direct access to organization repository content can be constrained by SAML/SSO policies.
- Therefore, agents must always use a fork-first workflow for any repository that is not owned by the authenticated user.
- Never issue content reads (GET to contents/trees/etc.) against the upstream organization repo. All content operations must target the user’s fork namespace.
- If a fork appears to fail for any reason, do not attribute it to SAML/SSO. Instead, retry briefly and log a neutral message. As a fallback, instruct the operator to create the fork from the GitHub UI; subsequent scans will operate exclusively on the fork.

## Common Troubleshooting

- OAuth redirect issues: Ensure ports match between GitHub OAuth app settings and local server
- Azure Function issues: Check local.settings.json and environment variables
- Deployment failures: Review the CI/CD workflows and environment setup

## Known Quirks

- The frontend is JavaScript for fast prototyping, with plans to migrate to TypeScript
- Results are stored as JS files rather than a database for simplicity
- After "Save Results" creates a PR and the PR is merged, results appear on the site after the nightly deploy or manual admin deploy

## HTTP Wrapper / Azure Functions Notes

The Azure Functions (Node) handlers in `packages/api` use a helper `wrapHttp` (see `src/shared/http.ts`).

- Invocation Signature: Azure Functions runtime calls exported handlers with `(context, req)`.
- Historical Bug: Earlier code reversed parameters `(req, ctx)` which produced empty 200 responses because `ctx.res` was never set. This has been fixed.
- Backward Compatibility: `wrapHttp` now both sets `ctx.res` and returns it. Legacy tests that previously relied on a returned `{ status, body }` object will still work, while the Functions host uses `ctx.res`.
- Writing New Tests: Prefer calling `await handler(ctx, req)` and asserting on the returned value (which equals `ctx.res`).
- HEAD Requests: The wrapper suppresses bodies for `HEAD` automatically.
- OPTIONS Requests: Auto CORS 204 with standard headers.

If you observe a 200 with an empty body for a new endpoint, double‑check:
1. The function export order `(ctx, req)`.
2. That you are not accidentally returning a plain object instead of using `wrapHttp`.
3. The test is not invoking `(req, ctx)` by mistake.

### Smoke Testing
Use `./scripts/smoke-api.sh` after starting the Functions host to exercise the primary endpoints. It reads `.env`, supports `DRY_RUN=1`, and fails fast on critical issues. The script expects the updated route `/api/v4/client-settings` for runtime configuration.
