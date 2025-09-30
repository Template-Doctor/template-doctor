// analyzer-server-only-patch.js
// Forces server-side analysis path; removes client-side fallback during migration.
(function(){
  function enforce(){
    var ta = window.TemplateAnalyzer;
    if(!ta) return false;
    // Replace analyzeTemplate to delegate strictly to server-side method.
    if(typeof ta.analyzeTemplateServerSide === 'function'){
      ta.analyzeTemplate = function(repoUrl, ruleSet){
        return this.analyzeTemplateServerSide(repoUrl, ruleSet || 'dod');
      };
      ta.analyzeTemplateClientSide = function(){
        throw new Error('Client-side analysis disabled');
      };
      // Force config flags
      window.TemplateDoctorConfig = window.TemplateDoctorConfig || {};
      window.TemplateDoctorConfig.analysis = window.TemplateDoctorConfig.analysis || {};
      window.TemplateDoctorConfig.analysis.useServerSide = true;
      window.TemplateDoctorConfig.analysis.fallbackToClientSide = false;
      return true;
    }
    return false;
  }
  var attempts = 0; var max = 40; // ~4s
  var timer = setInterval(function(){
    if(enforce() || ++attempts >= max){ clearInterval(timer); }
  },100);
})();
