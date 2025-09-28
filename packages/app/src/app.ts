// @ts-nocheck
// Transitional TypeScript entry extracted from legacy js/app.js
// This file will be incrementally typed. For now we simply re-import the existing logic
// by referencing the legacy JS file to preserve behavior while moving to TS module graph.

import '../js/app.js';

// Expose any globals expected by tests (pass-through to window variables set by legacy script)
export const analyzeRepo = (window as any).analyzeRepo;
