import { HttpRequest, Context } from "@azure/functions";
import { Octokit } from '@octokit/rest';
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

  const token = process.env.GITHUB_TOKEN_ANALYZER || process.env.GH_WORKFLOW_TOKEN || null;
  const octokit = new Octokit(token ? { auth: token } : {});

  let owner: string; let repo: string; let defaultBranch: string;
  try {
    ({ owner, repo } = extractRepoInfo(repoUrl));
    const repoMeta = await octokit.repos.get({ owner, repo });
    defaultBranch = repoMeta.data.default_branch;
  } catch (e: any) {
    return { status: 400, body: { error: 'Failed to resolve repository', details: e?.message } };
  }

  // List files (bounded) & selectively fetch content
  let files: GitHubFile[] = [];
  try {
    files = await listAllFiles(octokit, owner, repo, defaultBranch);
  } catch (e: any) {
    return { status: 502, body: { error: 'Failed to list repository files', details: e?.message } };
  }

  const enriched: GitHubFile[] = [];
  for (const f of files.slice(0, 400)) {
    if (/\.(md|bicep|ya?ml|json)$/i.test(f.path)) {
      try {
        f.content = await getFileContent(octokit, owner, repo, f.path, defaultBranch);
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
    ctx.log.error('analyze-template error', e?.message || e);
    return { status: 500, body: { error: 'Analyzer execution failed', details: e?.message } };
  }
});

function extractRepoInfo(url: string): { owner: string; repo: string } { 
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)(\.git)?/i); 
  if (!m) throw new Error('Invalid GitHub URL'); 
  return { owner: m[1], repo: m[2] }; 
}

async function listAllFiles(octokit: Octokit, owner: string, repo: string, ref: string, path: string = ''): Promise<GitHubFile[]> { 
  const res = await octokit.repos.getContent({ owner, repo, path: path || '', ref }); 
  const entries = Array.isArray(res.data) ? res.data : [res.data]; 
  let files: GitHubFile[] = []; 
  
  for (const entry of entries) { 
    if ('type' in entry && entry.type === 'file') { 
      files.push({ path: entry.path, sha: entry.sha }); 
    } else if ('type' in entry && entry.type === 'dir') { 
      const sub = await listAllFiles(octokit, owner, repo, ref, entry.path); 
      files = files.concat(sub); 
    } 
  } 
  
  return files; 
}

async function getFileContent(octokit: Octokit, owner: string, repo: string, path: string, ref: string): Promise<string> { 
  const { data } = await octokit.repos.getContent({ owner, repo, path, ref }); 
  if (!Array.isArray(data) && 'type' in data && data.type === 'file' && 'content' in data) { 
    return Buffer.from(data.content, 'base64').toString(); 
  } 
  throw new Error('Unable to get content for ' + path); 
}

// Export default for function.json entryPoint compatibility
export default handler;
