// Transitional TypeScript entry extracted from legacy js/app.js
// Now typed: simply re-imports legacy script to preserve behavior during migration.

import '../js/app.js'; // side-effect import (legacy global initialization)

// Expose any globals expected by tests (pass-through to window variables set by legacy script)
export const analyzeRepo: ((repoUrl: string, ruleSet?: string) => Promise<any>) | undefined = (window as any).analyzeRepo;

declare global {
	interface Window { analyzeRepo?: (repoUrl: string, ruleSet?: string) => Promise<any>; }
}
