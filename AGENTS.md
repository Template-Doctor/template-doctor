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
   Edit the `.env` file with appropriate values. **CRITICAL**: You must set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`.

4. Configure local Azure Functions:
   ```bash
   cd packages/api
   cp local.settings.example.json local.settings.json
   ```
   Edit `local.settings.json` and add the same `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` from `.env`.

5. Configure frontend:
   ```bash
   cd packages/app
   cp config.json.example config.json
   ```
   Edit `config.json` and ensure:
   - `githubOAuth.clientId` matches your `GITHUB_CLIENT_ID`
   - `backend.baseUrl` is set to `"http://localhost:7071"` for local dev

6. Build both packages:
   ```bash
   cd /path/to/template-doctor
   npm run build -w packages/api
   npm run build -w packages/app
   ```

7. **IMPORTANT**: Start services in SEPARATE terminals (do not use background processes):
   
   **Terminal 1 - Azure Functions (backend on port 7071):**
   ```bash
   cd packages/api
   npm start
   ```
   
   **Terminal 2 - Vite dev server (frontend on port 4000):**
   ```bash
   cd packages/app
   npm run dev
   ```

8. Access the application at http://localhost:4000

### Critical Local Development Requirements

- **Two separate terminals required**: One for Azure Functions (port 7071), one for Vite (port 4000)
- **Azure Functions MUST be running** before using OAuth login or analysis features
- **Hard refresh required** (Cmd+Shift+R / Ctrl+Shift+R) after any config changes
- **Port conflicts**: If you see EADDRINUSE errors, kill processes: `lsof -ti :4000 | xargs kill -9` and `lsof -ti :7071 | xargs kill -9`

## Configuration Architecture (Post-Migration)

The configuration system has three layers that must be properly aligned:

1. **Server-side** (`packages/api/local.settings.json`): Azure Functions configuration
   - Required: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GH_WORKFLOW_TOKEN`
   - Used by OAuth token exchange and API endpoints

2. **Client-side** (`packages/app/config.json`): Frontend configuration
   - Required: `githubOAuth.clientId` (must match server's `GITHUB_CLIENT_ID`)
   - Required: `backend.baseUrl` set to `"http://localhost:7071"` for local dev
   - Used by frontend for OAuth flow and API calls

3. **Environment** (`.env` at repo root): Shared configuration
   - Used by build tools and CLI scripts
   - Values must be duplicated into `local.settings.json` for Functions to access them

**Local Development Flow:**
- On localhost, frontend skips the server's `/api/v4/client-settings` endpoint
- Config is loaded directly from `config.json` (simpler, no server dependency during startup)
- OAuth calls hardcoded to `http://localhost:7071/api/v4/github-oauth-token`
- Analysis calls use `apiBase` from `config.json` → `http://localhost:7071`

5. Access the application at http://localhost:5173

## Code Structure Insights

- The frontend is migrating from legacy vanilla JS to TypeScript (TS modules under `packages/app/src/` are authoritative; legacy JS is being deleted in phases)
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

## Frontend TypeScript Migration & Legacy File Deletion (Production Policy)

This repository is executing a phased migration from legacy browser JavaScript under `packages/app/js/` to TypeScript modules under `packages/app/src/` that are built/bundled. Agents MUST follow these production‑grade rules (no stubs/mocks/throwaway placeholders) when participating in migration or cleanup tasks:

### Authoritative Artifacts
1. Analyzer logic: The authoritative implementation is the TypeScript build output `packages/app/js/analyzer.bundle.js` produced by `packages/app/build-analyzer.js` (esbuild). Do NOT reintroduce logic into `js/analyzer.js`.
2. Runtime configuration: The authoritative source is `src/scripts/runtime-config.ts`, loaded via module import (`src/main.ts` and `callback.html`). The legacy `js/runtime-config.js` must be removed once all pages import the TS module.
3. Report / templates / issue template helpers: Their TypeScript counterparts live under `src/report/`, `src/scripts/`, `src/issue/`, or `src/data/` directories. The similarly named legacy JS files are slated for hard deletion.

### Hard Deletion Requirements
When a legacy JS file has a complete TS replacement with parity:
- Physically delete the legacy file (preferred) OR fully replace its contents with a minimal, deterministic production stub that immediately errors on access—ONLY if technical tooling limitations block physical removal in the current PR. Do **not** leave partial old logic or large commented blobs.
- Ensure no remaining imports or dynamic script tags reference the legacy filename (grep for `js/<name>.js`).
- Update any docs (including this section and `docs/development/migration-matrix.md`) marking the file as removed.
- Run Playwright + unit tests + `smoke-api.sh` to validate no behavioral regression.

### Analyzer File Specifics
`js/analyzer.js` must NOT accumulate stub logic plus legacy method bodies (that creates parsing risk). The only acceptable end states are:
1. File deleted entirely.
2. File replaced by a <= ~20 line strict stub that throws on use and references `analyzer.bundle.js`.

If a bulk patch tool cannot delete the large historical file in the same change set, perform a **full overwrite** (truncate + stub) and open a follow‑up issue to physically remove it in a small PR. Do not postpone the overwrite while leaving unreachable method bodies.

### Environment Variables Clarification
`BASE` (in `.env`) is consumed by `scripts/smoke-api.sh` to know the Azure Functions base URL for local probing (defaults `http://localhost:7071`).
`TD_BACKEND_BASE_URL` is exposed through the runtime-config endpoint to the browser for API calls when the frontend is pointed at a remote Functions instance. During local dev they usually match, but they have distinct purposes—do not assume one automatically sets the other.

### Acceptance Checklist Before Marking a Legacy File “Removed”
- [ ] TS replacement merged and imported everywhere needed.
- [ ] No runtime references (import / dynamic script tag / global eval) to the legacy filename.
- [ ] File deleted OR fully overwritten with strict stub (temporary only if deletion blocked).
- [ ] Playwright focus tests covering affected feature pass.
- [ ] `npm test` overall suite passes (or unrelated flaky tests annotated in PR).
- [ ] `./scripts/smoke-api.sh` succeeds (verifies client settings & analyzer endpoints unaffected).
- [ ] Docs updated (`migration-matrix.md`, this section).

### Prohibited During Migration
- Adding “temporary shim” code that silently forwards calls to both legacy and new implementations.
- Leaving large commented legacy bodies that cause lint, size, or parse overhead.
- Introducing new public globals under legacy names (except the minimal throwing stubs when absolutely necessary as described above).

Following these rules ensures the migration remains auditable, keeps bundle size controlled, and prevents accidental re‑coupling to deprecated globals.

### Phase 2 Deletions (2025-09-29)

The following legacy scripts have been physically removed after confirming 1:1 TypeScript parity, absence of runtime references (grep for script tags/imports), and passing Playwright + smoke tests:

- `packages/app/js/runtime-config.js`
- `packages/app/js/api-client.js`
- `packages/app/js/report-loader.js`
- `packages/app/js/templates-data-loader.js`
- `packages/app/js/issue-template-engine.js`

Analyzer Status: `packages/app/js/analyzer.js` no longer contains legacy logic; it is a minimal dynamic loader stub that injects `analyzer.bundle.js`. This stub will be deleted in a subsequent cleanup once a full grep confirms no stale external references (e.g., downstream docs or integrations) still point to `js/analyzer.js`.

Action Items Before Deleting `analyzer.js` Stub:
1. Grep repo (and any dependent deployment templates if applicable) for `analyzer.js` script tags.
2. Run `npm test` (all suites) and `./scripts/smoke-api.sh`.
3. Remove file and update both this section and `docs/development/migration-matrix.md` (set status to Removed).
4. Re-run Playwright focused analyzer-related specs (add one if gap identified) to ensure bundle loads deterministically.

Do not reintroduce logic into `analyzer.js`; only proceed directly to deletion once conditions met.
