// @ts-nocheck
// TypeScript migration of github-client-new.js (transitional). Will be incrementally typed.
// Preserves global window.GitHubClient expectation.

class GitHubClient {
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
  initializeAfterAuth() {
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
  async loadCurrentUser() {
    if (this.auth && this.auth.isAuthenticated()) {
      try { this.currentUser = await this.getAuthenticatedUser(); } catch(_) {}
    }
  }
  async request(path, options = {}) {
    const token = this.auth?.getAccessToken?.();
    if (!token) throw new Error('Not authenticated');
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const headers = { Accept: 'application/vnd.github.v3+json', Authorization: `token ${token}`, ...(options.headers||{}) };
    const resp = await fetch(url, { ...options, headers });
    if (!resp.ok) {
      let data = {};
      try { data = await resp.json(); } catch(_) {}
      const error = new Error(data.message || `GitHub API error: ${resp.status}`);
      error.status = resp.status; error.data = data;
      throw error;
    }
    return resp.json();
  }
  async requestAllPages(path, options = {}) {
    const token = this.auth?.getAccessToken?.();
    if (!token) return [];
    const base = path.startsWith('http') ? '' : this.baseUrl;
    let nextUrl = `${base}${path}`; const results = []; const headers = { Accept: 'application/vnd.github.v3+json', Authorization: `token ${token}`, ...(options.headers||{}) };
    const getNext = (link) => { if(!link) return null; for(const part of link.split(',')){ const m=part.trim().match(/<([^>]+)>; rel="([^\"]+)"/); if(m && m[2]==='next') return m[1]; } return null; };
    while (nextUrl) { const r = await fetch(nextUrl,{...options,headers}); if(!r.ok) break; const data = await r.json(); if(Array.isArray(data)) results.push(...data); else if(results.length===0) return data; const link=r.headers.get('Link'); nextUrl=getNext(link); }
    return results;
  }
  async graphql(query, variables={}) {
    const token = this.auth?.getAccessToken?.(); if(!token) throw new Error('Not authenticated');
    const resp = await fetch(this.graphQLUrl,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`token ${token}`},body:JSON.stringify({query,variables})});
    const json = await resp.json(); if(json.errors) { const e = new Error(json.errors[0].message||'GraphQL Error'); e.errors=json.errors; throw e; } return json.data;
  }
  getCurrentUsername(){ try { if(this.auth?.getUsername){ const u=this.auth.getUsername(); if(u) return u; } } catch(_){} return this.currentUser?.login||null; }
  async getAuthenticatedUser(){ return this.request('/user'); }
  async checkTokenScopes(){ const token=this.auth?.getAccessToken?.(); if(!token) return []; const r=await fetch(`${this.baseUrl}/user`,{headers:{Authorization:`token ${token}`}}); const hdr=r.headers.get('X-OAuth-Scopes'); return hdr?hdr.split(',').map(s=>s.trim()):[]; }
  async getRepository(owner,repo){ return this.request(`/repos/${owner}/${repo}`); }
  async ensureAccessibleRepo(owner, repo, { forceFork=false } = {}) {
    const currentUsername = this.getCurrentUsername(); if(!currentUsername) throw new Error('Not authenticated');
    const namesEq = owner && currentUsername && owner.toLowerCase()===currentUsername.toLowerCase();
    const getUserRepo = () => this.request(`/repos/${currentUsername}/${repo}`, { suppressNotFoundLog: true }).catch(e=>{ if(e.status===404) return null; throw e; });
    if(namesEq && !forceFork){ const selfRepo = await getUserRepo(); if(!selfRepo) throw new Error('Repository not found under current user'); return { repo: selfRepo, source:'self'}; }
    let forkMeta = await getUserRepo(); const existingFork = !!forkMeta;
    if(!forkMeta){ try { await this.request(`/repos/${owner}/${repo}/forks`,{method:'POST'}); } catch(e){ throw e; }
      for(let i=0;i<14;i++){ await new Promise(r=>setTimeout(r,1100+i*250)); forkMeta = await getUserRepo(); if(forkMeta) break; }
    }
    if(!forkMeta) throw new Error('Fork did not become available in time');
    return { repo: forkMeta, source:'fork'};
  }
  getDefaultBranchFromMeta(meta){ return meta?.default_branch||'main'; }
  async listAllFiles(owner, repo, ref='HEAD'){ const r=await this.request(`/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`); return r.tree.filter(t=>t.type==='blob').map(t=>t.path); }
  async createIssue(owner, repo, title, body, labels=[]){ return this.request(`/repos/${owner}/${repo}/issues`,{method:'POST',body:JSON.stringify({title,body,labels})}); }
}

const githubClient = new GitHubClient();
;(window as any).GitHubClient = githubClient;
export { githubClient };
