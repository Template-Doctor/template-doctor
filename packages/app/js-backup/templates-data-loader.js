// templates-data-loader.js removed (TypeScript migration)
// Replacement logic implemented in src/scripts/templates-data-loader.ts
(function(){
  const msg='[templates-data-loader.js removed] Using TS templates-data-loader module';
  try { console.warn(msg); } catch {}
  // Provide minimal event so extremely old code listening for legacy load doesn't hang forever.
  try { document.dispatchEvent(new CustomEvent('td-legacy-templates-loader-removed')); } catch {}
})();
