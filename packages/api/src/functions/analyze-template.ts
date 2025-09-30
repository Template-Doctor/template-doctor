import { HttpRequest, Context } from "@azure/functions";
import { wrapHttp } from '../shared/http';

// Load analyzer from built dist output of local package (source import avoided to prevent cross-rootDir issues)
async function getRunAnalyzer() {
  const mod = await import('analyzer-core');
  if ((mod as any).runAnalyzer) return (mod as any).runAnalyzer;
  throw new Error('runAnalyzer export missing from analyzer-core');
}

interface AnalyzeRequest {
  repoUrl: string;
  ruleSet?: string;
  azureDeveloperCliEnabled?: boolean;
  aiDeprecationCheckEnabled?: boolean;
  archiveOverride?: boolean;
}

interface GitHubFile {
  path: string;
  sha: string;
  content?: string;
  type?: string;
}

export const handler = wrapHttp(async (req: HttpRequest, ctx: Context) => {
  if (req.method !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }
  // Parse body safely
  let body: any = undefined;
  try {
    body = req.body || (await (req as any).json?.());
  } catch {}
  const requestBody: AnalyzeRequest = body || { repoUrl: '' };
  const { repoUrl, ruleSet = 'dod', azureDeveloperCliEnabled, aiDeprecationCheckEnabled, archiveOverride } = requestBody;
  const categoriesRaw = (req.query?.categories as string) || '';
  const categoriesParam = categoriesRaw.split(',').filter(x => x);

  if (!repoUrl) {
    return { status: 400, body: { error: 'repoUrl is required' } };
  }

  // Lightweight GitHub client via fetch to avoid ESM @octokit/rest incompatibility in CJS Functions build
  const token = process.env.GITHUB_TOKEN_ANALYZER || process.env.GH_WORKFLOW_TOKEN || undefined;
  const gh = createGitHubClient(token);

  let owner: string; let repo: string; let defaultBranch: string;
  try {
    ({ owner, repo } = extractRepoInfo(repoUrl));
    const repoMeta = await gh("/repos/" + owner + "/" + repo);
    defaultBranch = repoMeta.default_branch;
  } catch (e: any) {
    return { status: 400, body: { error: 'Failed to resolve repository', details: e?.message } };
  }

  // List files (bounded) & selectively fetch content
  let files: GitHubFile[] = [];
  try {
    files = await listAllFilesFetch(gh, owner, repo, defaultBranch);
  } catch (e: any) {
    return { status: 502, body: { error: 'Failed to list repository files', details: e?.message } };
  }

  const enriched: GitHubFile[] = [];
  for (const f of files.slice(0, 400)) {
    if (/\.(md|bicep|ya?ml|json)$/i.test(f.path)) {
      try {
        f.content = await getFileContentFetch(gh, owner, repo, f.path, defaultBranch);
      } catch {}
    }
    enriched.push(f);
  }

  try {
    const runAnalyzer = await getRunAnalyzer();
    const result = await runAnalyzer(repoUrl, enriched, {
      ruleSet,
      deprecatedModels: (process.env.DEPRECATED_MODELS || '').split(',').filter(Boolean),
      categories: categoriesParam,
      azureDeveloperCliEnabled: azureDeveloperCliEnabled !== false,
      aiDeprecationCheckEnabled: aiDeprecationCheckEnabled !== false
    });
    if (archiveOverride === true) result.archiveRequested = true;
    return { status: 200, body: result };
  } catch (e: any) {
    const msg = e?.message || String(e);
    const stack = e?.stack;
    ctx.log.error('analyze-template error', msg, stack);
    // Provide additional diagnostics in local/dev only (heuristic: presence of localhost hostname or explicit flag)
    const isLocal = /localhost|127\.0\.0\.1/.test(process.env.WEBSITE_HOSTNAME || '') || process.env.NODE_ENV !== 'production';
    const diagnostic = isLocal ? { stack, fileCount: enriched.length, repoUrl, ruleSet } : {};
    return { status: 500, body: { error: 'Analyzer execution failed', details: msg, ...diagnostic } };
  }
});

function extractRepoInfo(url: string): { owner: string; repo: string } {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)(\.git)?/i);
  if (!m) throw new Error('Invalid GitHub URL');
  return { owner: m[1], repo: m[2] };
}

function createGitHubClient(token?: string) {
  return async function gh(path: string): Promise<any> {
    const base = 'https://api.github.com';
    const url = base + path;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'template-doctor-analyzer',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error('GitHub request failed ' + res.status + ' ' + path + ' ' + text.slice(0, 200));
    }
    return res.json();
  };
}

async function listAllFilesFetch(gh: (p: string)=>Promise<any>, owner: string, repo: string, ref: string, path: string = ''): Promise<GitHubFile[]> {
  const apiPath = `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`.replace(/%2F/g,'/');
  const data = await gh(apiPath + (ref ? `?ref=${encodeURIComponent(ref)}` : ''));
  const entries = Array.isArray(data) ? data : [data];
  let files: GitHubFile[] = [];
  for (const entry of entries) {
    if (entry.type === 'file') {
      files.push({ path: entry.path, sha: entry.sha });
    } else if (entry.type === 'dir') {
      const sub = await listAllFilesFetch(gh, owner, repo, ref, entry.path);
      files = files.concat(sub);
    }
  }
  return files;
}

async function getFileContentFetch(gh: (p: string)=>Promise<any>, owner: string, repo: string, path: string, ref: string): Promise<string> {
  const apiPath = `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`.replace(/%2F/g,'/');
  const data = await gh(apiPath + (ref ? `?ref=${encodeURIComponent(ref)}` : ''));
  if (data && data.type === 'file' && data.content) {
    try { return Buffer.from(data.content, 'base64').toString(); } catch {}
  }
  throw new Error('Unable to get content for ' + path);
}

// Export default for function.json entryPoint compatibility
export default handler;
