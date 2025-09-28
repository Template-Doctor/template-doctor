// @ts-nocheck
// Transitional facade wrapping legacy batch scanning logic until full migration.
import { BatchScanItem, BatchScanOptions, BatchScanResultSummary } from './types';

// Helper to safely access globalsunction get<T=any>(k:string):T|undefined{ return (window as any)[k]; }

export async function processBatch(urls:string[], options:BatchScanOptions = {}):Promise<BatchScanResultSummary>{
  const start = Date.now();
  const items:BatchScanItem[] = urls.filter(u=>u && u.trim()).map(u=>({ url:u, originalUrl:u, status:'pending'}));
  const checkAndUpdateRepoUrl = get('checkAndUpdateRepoUrl');
  const legacyProcess = get('processBatchUrls');
  if(!legacyProcess){ throw new Error('Legacy processBatchUrls not found'); }

  // Pre-resolve URLs with fork check (mirrors enhanced SAML batch behavior)
  let resolvedUrls = urls;
  if(typeof checkAndUpdateRepoUrl === 'function'){
    resolvedUrls = await Promise.all(urls.map(async (u, idx) => {
      try {
        const updated = await checkAndUpdateRepoUrl(u, true);
        if(updated !== u){ items[idx].forkUrl = updated; items[idx].status='forking'; }
        return updated;
      } catch(e){ items[idx].status='error'; items[idx].error = e.message; return u; }
    }));
  }

  // Delegate to legacy for actual analysis flow
  await legacyProcess(resolvedUrls, { requireFork: !!options.requireFork });

  // Minimal summary (refine once legacy replaced)
  const summary:BatchScanResultSummary = {
    total: items.length,
    succeeded: items.filter(i=>i.status !== 'error').length,
    failed: items.filter(i=>i.status === 'error').length,
    forked: items.filter(i=>i.forkUrl).length,
    startedAt: new Date(start).toISOString(),
    endedAt: new Date().toISOString()
  };
  return summary;
}

// Attach exploratory global (non-breaking)
if(!(window as any).TemplateDoctorBatch){
  (window as any).TemplateDoctorBatch = { processBatch };
}
