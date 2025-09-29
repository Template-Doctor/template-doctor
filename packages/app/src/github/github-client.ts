// TypeScript migration of github-client-new.js (transitional) now with typings.
// Preserves global window.GitHubClient expectation while adding safer method signatures.

interface GitHubAuthLike {
  isAuthenticated: () => boolean;
  getAccessToken?: () => string | null | undefined;
  getUsername?: () => string | null | undefined;
}

interface GitHubUser { login: string; [k: string]: any }
interface GitHubRepo { default_branch?: string; [k: string]: any }

type RestOptions = (RequestInit & { suppressNotFoundLog?: boolean; headers?: Record<string,string> });

class GitHubApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any){
    super(message);
    this.status = status;
    this.data = data;
  }
}

class GitHubClient {
  baseUrl: string;
  graphQLUrl: string;
  auth: GitHubAuthLike | undefined;
  currentUser: GitHubUser | null;
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.graphQLUrl = 'https://api.github.com/graphql';
    this.auth = (window as any).GitHubAuth;
    this.currentUser = null;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeAfterAuth());
    } else {
      this.initializeAfterAuth();
    }
  }
  initializeAfterAuth(): void {
    if (!this.auth) {
      this.auth = (window as any).GitHubAuth;
      if (!this.auth) {
        setTimeout(() => this.initializeAfterAuth(), 500);
        return;
      }
    }
    this.loadCurrentUser().then(() => {
      this.checkTokenScopes().catch(()=>{});
    });
  }
  async loadCurrentUser(): Promise<void> {
    if (this.auth && this.auth.isAuthenticated()) {
      try { this.currentUser = await this.getAuthenticatedUser(); } catch(_) {}
    }
  }
  async request<T=any>(path: string, options: RestOptions = {}): Promise<T> {
    const token = this.auth?.getAccessToken?.();
    if (!token) throw new Error('Not authenticated');
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const headers = { Accept: 'application/vnd.github.v3+json', Authorization: `token ${token}`, ...(options.headers||{}) };
    const resp = await fetch(url, { ...options, headers });
    if (!resp.ok) {
      let data = {};
      try { data = await resp.json(); } catch(_) {}
  const msg = (data && typeof data === 'object' && 'message' in data) ? (data as any).message : undefined;
  throw new GitHubApiError(msg || `GitHub API error: ${resp.status}`, resp.status, data);
    }
    return resp.json() as Promise<T>;
  }
  async requestAllPages<T=any>(path: string, options: RestOptions = {}): Promise<T[] | T> {
    const token = this.auth?.getAccessToken?.();
    if (!token) return [];
    const base = path.startsWith('http') ? '' : this.baseUrl;
    let nextUrl: string | null = `${base}${path}`; const results: T[] = []; const headers = { Accept: 'application/vnd.github.v3+json', Authorization: `token ${token}`, ...(options.headers||{}) };
    const getNext = (link: string | null) => { if(!link) return null; for(const part of link.split(',')){ const m=part.trim().match(/<([^>]+)>; rel="([^"]+)"/); if(m && m[2]==='next') return m[1]; } return null; };
    while (nextUrl) { const r = await fetch(nextUrl,{...options,headers}); if(!r.ok) break; const data = await r.json(); if(Array.isArray(data)) results.push(...data as T[]); else if(results.length===0) return data as T; const link=r.headers.get('Link'); nextUrl=getNext(link); }
    return results as T[];
  }
  async graphql<T=any>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const token = this.auth?.getAccessToken?.(); if(!token) throw new Error('Not authenticated');
    const resp = await fetch(this.graphQLUrl,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`token ${token}`},body:JSON.stringify({query,variables})});
    const json = await resp.json(); if(json.errors) { const e = new GitHubApiError(json.errors[0].message||'GraphQL Error', 400, json.errors); throw e; } return json.data as T;
  }
  getCurrentUsername(): string | null { try { if(this.auth?.getUsername){ const u=this.auth.getUsername(); if(u) return u; } } catch(_){ } return this.currentUser?.login||null; }
  async getAuthenticatedUser(): Promise<GitHubUser> { return this.request<GitHubUser>('/user'); }
  async checkTokenScopes(): Promise<string[]> { const token=this.auth?.getAccessToken?.(); if(!token) return []; const r=await fetch(`${this.baseUrl}/user`,{headers:{Authorization:`token ${token}`}}); const hdr=r.headers.get('X-OAuth-Scopes'); return hdr?hdr.split(',').map(s=>s.trim()):[]; }
  async getRepository(owner: string, repo: string): Promise<GitHubRepo> { return this.request<GitHubRepo>(`/repos/${owner}/${repo}`); }
  async ensureAccessibleRepo(owner: string, repo: string, { forceFork=false }: { forceFork?: boolean } = {}) {
    const currentUsername = this.getCurrentUsername(); if(!currentUsername) throw new Error('Not authenticated');
    const namesEq = owner && currentUsername && owner.toLowerCase()===currentUsername.toLowerCase();
    const getUserRepo = () => this.request<GitHubRepo>(`/repos/${currentUsername}/${repo}`, { suppressNotFoundLog: true }).catch(e=>{ if(e instanceof GitHubApiError && e.status===404) return null; throw e; });
    if(namesEq && !forceFork){ const selfRepo = await getUserRepo(); if(!selfRepo) throw new Error('Repository not found under current user'); return { repo: selfRepo, source:'self'}; }
    let forkMeta = await getUserRepo(); const existingFork = !!forkMeta;
    if(!forkMeta){ try { await this.request(`/repos/${owner}/${repo}/forks`,{method:'POST'}); } catch(e){ throw e; }
      for(let i=0;i<14;i++){ await new Promise(r=>setTimeout(r,1100+i*250)); forkMeta = await getUserRepo(); if(forkMeta) break; }
    }
    if(!forkMeta) throw new Error('Fork did not become available in time');
    return { repo: forkMeta, source:'fork'};
  }
  getDefaultBranchFromMeta(meta: GitHubRepo){ return meta?.default_branch||'main'; }
  async listAllFiles(owner: string, repo: string, ref='HEAD'): Promise<string[]> { const r:any=await this.request(`/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`); return (r.tree||[]).filter((t:any)=>t.type==='blob').map((t:any)=>t.path); }
  async createIssue(owner: string, repo: string, title: string, body: string, labels: string[] = []) { return this.request(`/repos/${owner}/${repo}/issues`,{method:'POST',body:JSON.stringify({title,body,labels}), headers:{'Content-Type':'application/json'}}); }
}

const githubClient = new GitHubClient();
;(window as any).GitHubClient = githubClient;
export { githubClient };
