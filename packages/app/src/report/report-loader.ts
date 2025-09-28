// @ts-nocheck
// TypeScript migration of legacy report-loader.js (parity-focused)
// Provides both callback style (loadReportData) and Promise style (loadReport)

(function(window){
  'use strict';

  const RESULTS_DIR = typeof window.RESULTS_DIR === 'string' && window.RESULTS_DIR ? window.RESULTS_DIR : 'results';

  function debug(source, message, data){
    if (typeof window.debug === 'function') {
      window.debug(source, message, data);
    } else if (console && console.log) {
      console.log(`[${source}] ${message}`, data || '');
    }
  }
  function isValidObject(obj){ return obj && typeof obj === 'object' && Object.keys(obj).length > 0; }

  const ReportLoader = {
    loadReportData: function(template, successCallback, errorCallback){
      this.loadReport(template).then(d => successCallback && successCallback(d)).catch(err => errorCallback && errorCallback(err.message || String(err)));
    },
    loadReport: function(template){
      return new Promise((resolve, reject)=>{
        if(!template){ debug('report-loader','No template provided'); return reject(new Error('No template specified')); }

        let templateName, templatePath, directData, dataJsPath, folderName;
        if(typeof template === 'object'){
          debug('report-loader','Template is an object', template);
          if (template.relativePath){
            const parts = template.relativePath.split('/');
            if(parts.length>0){ folderName = parts[0]; debug('report-loader',`Extracted folder name from relativePath: ${folderName}`); }
            let pathPrefix = folderName;
            if (template.folderPath){ pathPrefix = template.folderPath; debug('report-loader',`Using provided folderPath: ${pathPrefix}`); }
            else if (template.scannedBy && template.scannedBy.length>0){
              const lastScanner = template.scannedBy[template.scannedBy.length - 1];
              pathPrefix = `${lastScanner}-${folderName}`; debug('report-loader',`Created folderPath with scanner prefix: ${pathPrefix}`);
            }
            if (template.dataPath){
              dataJsPath = `${pathPrefix}/${template.dataPath}`; debug('report-loader',`Found data.js path: ${dataJsPath}`);
            }
            templatePath = template.relativePath; debug('report-loader',`Using relative path: ${templatePath}`);
          }
          if (template.repoUrl){
            const repoUrlParts = template.repoUrl.split('/');
            templateName = repoUrlParts[repoUrlParts.length - 1].replace(/\.git$/,'');
            debug('report-loader',`Extracted template name from URL: ${templateName}`);
            if(!folderName){
              const repoOwner = repoUrlParts[repoUrlParts.length - 2] || '';
              folderName = `${repoOwner}-${templateName}`.toLowerCase();
              debug('report-loader',`Constructed folder name from URL: ${folderName}`);
            }
          }
          if (template.result){ directData = template.result; debug('report-loader','Using direct result data'); }
        } else {
          templateName = template;
        }
        debug('report-loader',`Loading report data for template: ${templateName || 'unknown'}`);
        if(directData){ debug('report-loader','Using direct data from template object'); return resolve(directData); }

        const afterFallback = (promise) => {
          promise.then(d => { if(d) resolve(d); else reject(new Error('Failed to load report data')); })
                 .catch(error => { debug('report-loader','All report loading strategies failed', error); reject(new Error(error.message || 'Failed to load report data')); });
        };

        if (dataJsPath){
          debug('report-loader',`Attempting to load data.js file: ${dataJsPath}`);
          this._loadDataJsFile(dataJsPath)
            .then(data => { debug('report-loader','Successfully loaded data from data.js file', data); resolve(data); })
            .catch(err => { debug('report-loader',`Failed data.js, falling back: ${err.message}`); afterFallback(this._tryLoadReport(templateName, templatePath, folderName)); });
        } else {
          afterFallback(this._tryLoadReport(templateName, templatePath, folderName));
        }
      });
    },
    _loadDataJsFile: function(dataJsPath){
      return new Promise((resolve, reject)=>{
        debug('report-loader',`Loading data.js file: ${dataJsPath}`);
        const script = document.createElement('script');
        script.src = `/${RESULTS_DIR}/${dataJsPath}`;
        script.id = `data-js-${Date.now()}`;
        script.async = true;
        script.onload = function(){
          debug('report-loader','Data.js script loaded, checking for reportData');
          if(window.reportData){
            const data = window.reportData; debug('report-loader','Found window.reportData', data);
            const copy = { ...data };
            window.reportData = null;
            try { script.remove(); } catch(_) {}
            resolve(copy);
          } else {
            reject(new Error('Data.js loaded but did not set window.reportData'));
          }
        };
        script.onerror = function(e){ reject(new Error(`Failed to load data.js file: ${dataJsPath}`)); };
        document.head.appendChild(script);
        setTimeout(()=>{
          if(window.reportData){
            const data = window.reportData; const copy = { ...data }; window.reportData = null; try { script.remove(); } catch(_){}; resolve(copy);
          } else {
            fetch(`/${RESULTS_DIR}/${dataJsPath}`).then(r=>{ if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
              .then(()=> reject(new Error('Timed out waiting for reportData, but file exists')))
              .catch(err => reject(new Error(`Timed out waiting for reportData and couldn't fetch file: ${err.message}`)));
          }
        }, 3000);
      });
    },
    _tryLoadReport: function(templateName, templatePath, folderName){
      return new Promise((resolve, reject)=>{
        debug('report-loader','Starting report loading sequence');
        const tryStandardStrategies = () => {
          const template = folderName || (typeof templateName === 'string' ? templateName : 'unknown');
          debug('report-loader',`Trying standard strategies for template: ${template}`);
          this._fetchReportFile(`/${RESULTS_DIR}/${template}/latest.json`)
            .then(data => {
              if(isValidObject(data)){
                if(data.dataPath){
                  debug('report-loader',`Found dataPath in latest.json: ${data.dataPath}, loading that file`);
                  return this._loadDataJsFile(`${template}/${data.dataPath}`).catch(err=>{ debug('report-loader',`Failed to load data.js file: ${err.message}, using latest.json metadata`); return data; });
                }
                return data;
              }
              throw new Error('Invalid data format in latest.json');
            })
            .then(data => { if(isValidObject(data)) resolve(data); else throw new Error('Invalid data after latest.json'); })
            .catch(()=> this._findMostRecentAnalysisFile(template))
            .then(data => { if(data && isValidObject(data)) resolve(data); else throw new Error('Could not find a valid analysis file'); })
            .catch(err => { reject(new Error(`Failed to load report data for template: ${template}`)); });
        };
        if (templatePath){
          debug('report-loader',`Trying specific path: ${templatePath}`);
          this._fetchReportFile(`/${RESULTS_DIR}/${templatePath}`)
            .then(data => { if(isValidObject(data)){ resolve(data); } else throw new Error('Invalid data format from specific path'); })
            .catch(()=> { tryStandardStrategies(); });
        } else {
          tryStandardStrategies();
        }
      });
    },
    _fetchReportFile: function(path){
      debug('report-loader',`Fetching report file: ${path}`);
      return fetch(path).then(response => { if(!response.ok) throw new Error(`HTTP error ${response.status}: ${response.statusText}`); return response.json(); });
    },
    _findMostRecentAnalysisFile: function(template){
      debug('report-loader','Finding most recent analysis file for template', template);
      let folderPath;
      if (typeof template === 'object'){
        if (template.folderPath) folderPath = template.folderPath; else if (template.relativePath){
          const folderName = template.relativePath.split('/')[0];
          if (template.scannedBy && template.scannedBy.length>0){
            const lastScanner = template.scannedBy[template.scannedBy.length - 1];
            folderPath = `${lastScanner}-${folderName}`;
          } else { folderPath = folderName; }
        } else { folderPath = String(template); }
      } else { folderPath = String(template); }
      debug('report-loader',`Using folder path: ${folderPath}`);
      return this._fetchReportFile(`/${RESULTS_DIR}/${folderPath}/index.json`)
        .then(indexData => {
          if(indexData && Array.isArray(indexData.timestamps) && indexData.timestamps.length>0){
            debug('report-loader',`Found index.json with ${indexData.timestamps.length} timestamps`);
            return this._tryTimestamps(template, indexData.timestamps);
          } else {
            debug('report-loader','No index.json or invalid format, using generated timestamps');
            const timestamps = [Date.now(), Date.now()-60000, Date.now()-120000];
            return this._tryTimestamps(template, timestamps);
          }
        })
        .catch(()=>{
          debug('report-loader','Error fetching index.json, using generated timestamps');
            const timestamps = [Date.now(), Date.now()-60000, Date.now()-120000];
            return this._tryTimestamps(template, timestamps);
        });
    },
    _tryTimestamps: function(template, timestamps){
      if(!timestamps || timestamps.length===0){ return Promise.reject(new Error('No more timestamps to try')); }
      let folderPath;
      if (typeof template === 'object'){
        if (template.folderPath) folderPath = template.folderPath; else if (template.relativePath){
          const folderName = template.relativePath.split('/')[0];
            if (template.scannedBy && template.scannedBy.length>0){
              const lastScanner = template.scannedBy[template.scannedBy.length - 1];
              folderPath = `${lastScanner}-${folderName}`;
            } else { folderPath = folderName; }
        } else { folderPath = String(template); }
      } else { folderPath = String(template); }
      debug('report-loader',`Using folder path for timestamps: ${folderPath}`);
      const timestamp = timestamps[0];
      const path = `/${RESULTS_DIR}/${folderPath}/${timestamp}-analysis.json`;
      debug('report-loader',`Trying timestamp ${timestamp} for template at path ${path}`);
      return this._fetchReportFile(path).catch(()=> this._tryTimestamps(template, timestamps.slice(1)));
    }
  };

  window.ReportLoader = ReportLoader;
  debug('report-loader','Report Loader module initialized (TS migration)', ReportLoader);
})(window);
