// report-loader.js removed (TypeScript migration)
// See src/report/report-loader.ts for the authoritative implementation.
(function(){
  const msg='[report-loader.js removed] Use TS report-loader module';
  try { console.warn(msg); } catch {}
  // Provide minimal no-op global for any extremely stale references.
  if (!window.ReportLoader){
    window.ReportLoader = { loadReportData: function(){ throw new Error('ReportLoader removed; use TS module'); } };
  }
})();
