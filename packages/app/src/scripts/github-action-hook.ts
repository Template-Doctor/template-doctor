// TypeScript migration shim for submitAnalysisToGitHub.
// Wraps legacy logic but ensures versioned endpoint usage and better typings.

interface ComplianceSummaryDetails { percentageCompliant?: number }
interface ComplianceItem { id: string; details?: ComplianceSummaryDetails; }
interface AnalysisResult {
  repoUrl: string; ruleSet?: string; timestamp?: string | number; compliance: { compliant: ComplianceItem[]; issues: ComplianceItem[] };
  [k: string]: any;
}
interface SubmitResult { success: boolean; message?: string; error?: string }

declare global { interface Window { submitAnalysisToGitHub?: (r: AnalysisResult, u: string)=> Promise<SubmitResult>; TemplateDoctorConfig?: any } }

async function submitAnalysisToGitHub(result: AnalysisResult, username: string): Promise<SubmitResult> {
  if(!result || !username) return { success:false, error:'Missing parameters' };
  const cfg = window.TemplateDoctorConfig || {};
  const summary = result.compliance?.compliant?.find(c=> c.id==='compliance-summary');
  const percentage = (summary?.details && typeof summary.details.percentageCompliant==='number') ? summary.details.percentageCompliant : 0;
  const archiveCollection = cfg.archiveCollection || 'aigallery';
  let archiveEnabled = !!cfg.archiveEnabled;
  if(!archiveEnabled && Object.prototype.hasOwnProperty.call(cfg,'nextAnalysisArchiveEnabledOverride')){
    archiveEnabled = !!cfg.nextAnalysisArchiveEnabledOverride; delete cfg.nextAnalysisArchiveEnabledOverride; window.TemplateDoctorConfig = cfg;
  }
  const payload = { repoUrl: result.repoUrl, ruleSet: result.ruleSet, username, timestamp: result.timestamp, analysisData: result, archiveEnabled, archiveCollection, compliance: { percentage, passed: result.compliance?.compliant?.length || 0, issues: result.compliance?.issues?.length || 0 }, ...(cfg.dispatchTargetRepo ? { targetRepo: cfg.dispatchTargetRepo } : {}) };
  const apiBase = cfg.apiBase || window.location.origin;
  const buildUrl = (v4:boolean) => `${apiBase.replace(/\/$/,'')}/api/${v4? 'v4/':''}submit-analysis-dispatch`;
  const headers: Record<string,string> = { 'Content-Type':'application/json' };
  if (cfg.functionKey) headers['x-functions-key'] = cfg.functionKey;
  async function post(url: string){
    const resp = await fetch(url,{ method:'POST', headers, body: JSON.stringify({ event_type:'template-analysis-completed', client_payload: payload })});
    if(resp.ok) return { ok:true };
    const text = await resp.text().catch(()=> '');
    return { ok:false, status: resp.status, text };
  }
  // Try v4 first then legacy
  const primary = await post(buildUrl(true));
  if (primary.ok) return { success:true, message:'Analysis submitted successfully' };
  if (primary.status === 404 && !cfg.forceLegacyDispatchPath){
    const legacy = await post(buildUrl(false));
    if (legacy.ok) return { success:true, message:'Analysis submitted successfully (legacy path fallback)' };
  if (legacy.status === 404) return { success:false, error:'Endpoint not found (404): ensure Function deployed (route v4/submit-analysis-dispatch) or set forceLegacyDispatchPath=true.' };
  return { success:false, error:`Server error (${legacy.status}): ${(legacy.text||'').slice(0,200)}` };
  }
  if (!primary.ok){
    if (primary.status === 404) return { success:false, error:'Endpoint not found (404): ensure Function deployed (route v4/submit-analysis-dispatch).' };
    if (primary.status === 401) return { success:false, error: cfg.functionKey ? 'Unauthorized (401): invalid function key or backend auth.' : 'Unauthorized (401): supply TemplateDoctorConfig.functionKey for protected Functions.' };
    if (primary.status === 403) return { success:false, error:'Permission denied (403): backend token lacks scope or SSO authorization.' };
    if (primary.status === 429) return { success:false, error:'Rate limited (429): retry later.' };
  return { success:false, error:`Server error (${primary.status}): ${(primary.text||'').slice(0,200)}` };
  }
  return { success:true, message:'Analysis submitted successfully' };
}

if (!window.submitAnalysisToGitHub){ window.submitAnalysisToGitHub = submitAnalysisToGitHub; }
export {};