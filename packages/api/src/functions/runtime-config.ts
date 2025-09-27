import { Context } from '@azure/functions';
import { wrapHttp } from '../shared/http';

// Explicit whitelist of environment variables we intentionally expose to the client.
// NOTE: functionKey exposure is potentially sensitive; retained for parity with legacy implementation.
// Consider removing or proxying later during hardening phase.

interface PublicConfig {
  GITHUB_CLIENT_ID: string;
  backend: { baseUrl: string; functionKey?: string };
  DISPATCH_TARGET_REPO: string;
  DEFAULT_RULE_SET: string;
  REQUIRE_AUTH_FOR_RESULTS: string;
  AUTO_SAVE_RESULTS: string;
  ARCHIVE_ENABLED: string;
  ARCHIVE_COLLECTION: string;
  ISSUE_AI_ENABLED: string;
}

export default wrapHttp(async (req: any, _ctx: Context, requestId: string) => {
  if (req.method === 'OPTIONS') {
    return { status: 204 };
  }
  if (req.method !== 'GET') {
    return { status: 405, body: { error: 'Method Not Allowed', requestId } };
  }
  const baseUrl = process.env.TD_BACKEND_BASE_URL || process.env.BACKEND_BASE_URL || '';
  const functionKey = process.env.TD_BACKEND_FUNCTION_KEY || process.env.BACKEND_FUNCTION_KEY || '';
  const githubClientId = process.env.GITHUB_CLIENT_ID || '';
  const defaultRuleSet = process.env.DEFAULT_RULE_SET || process.env.TD_DEFAULT_RULE_SET || '';
  const requireAuthForResults = process.env.REQUIRE_AUTH_FOR_RESULTS || process.env.TD_REQUIRE_AUTH_FOR_RESULTS || '';
  const autoSaveResults = process.env.AUTO_SAVE_RESULTS || process.env.TD_AUTO_SAVE_RESULTS || '';
  const archiveEnabled = process.env.TD_ARCHIVE_ENABLED || process.env.ARCHIVE_ENABLED || '';
  const archiveCollection = process.env.TD_ARCHIVE_COLLECTION || process.env.ARCHIVE_COLLECTION || '';
  const dispatchTargetRepo = process.env.DISPATCH_TARGET_REPO || process.env.TD_DISPATCH_TARGET_REPO || '';
  const issueAIEnabled = process.env.ISSUE_AI_ENABLED || process.env.TD_ISSUE_AI_ENABLED || '';

  const payload: PublicConfig = {
    GITHUB_CLIENT_ID: githubClientId,
    backend: { baseUrl, functionKey: functionKey || '' },
    DISPATCH_TARGET_REPO: dispatchTargetRepo,
    DEFAULT_RULE_SET: defaultRuleSet,
    REQUIRE_AUTH_FOR_RESULTS: requireAuthForResults,
    AUTO_SAVE_RESULTS: autoSaveResults,
    ARCHIVE_ENABLED: archiveEnabled,
    ARCHIVE_COLLECTION: archiveCollection,
    ISSUE_AI_ENABLED: issueAIEnabled
  };

  return { status: 200, body: payload };
});
