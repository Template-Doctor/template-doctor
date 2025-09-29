// issue-template-engine.js removed (TypeScript migration)
// Authoritative code: src/issue/template-engine.ts
(function(){
  const msg='[issue-template-engine.js removed] Use TS issue template engine';
  try { console.warn(msg); } catch {}
  if (!window.IssueTemplateEngine){
    window.IssueTemplateEngine = { build: ()=>{ throw new Error('IssueTemplateEngine removed; use TS implementation'); } };
  }
})();
