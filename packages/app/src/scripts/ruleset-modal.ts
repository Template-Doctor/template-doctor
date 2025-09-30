// Ruleset Modal Handler - TypeScript implementation
// Provides configuration selection UI for template analysis

declare global {
  interface Window {
    showRulesetModal?: (repoUrl: string) => void;
  }
}

let currentRepoUrl = '';

export function initRulesetModal(): void {
  // Check if modal already exists
  if (document.getElementById('ruleset-modal')) {
    console.log('[RulesetModal] Modal already initialized');
    return;
  }

  // Create modal HTML
  const modalDiv = document.createElement('div');
  modalDiv.id = 'ruleset-modal';
  modalDiv.className = 'modal';
  modalDiv.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Select Configuration</h2>
        <span class="close">&times;</span>
      </div>
      <div class="modal-body">
        <p>Select the configuration ruleset to use for analyzing this template:</p>
        <form id="ruleset-form">
          <div class="form-group">
            <label>
              <input type="radio" name="ruleset" value="dod" checked>
              <strong>DoD - Default</strong>
            </label>
            <p class="ruleset-description">The full Definition of Done ruleset with all requirements.</p>
          </div>
          <div class="form-group">
            <label>
              <input type="radio" name="ruleset" value="partner">
              <strong>Partner</strong>
            </label>
            <p class="ruleset-description">A simplified ruleset for partner templates.</p>
          </div>
          <div class="form-group">
            <label>
              <input type="radio" name="ruleset" value="docs">
              <strong>Documentation</strong>
            </label>
            <p class="ruleset-description">A ruleset focused on https://aka.ms/samples guidance.</p>
          </div>
          <div class="form-group">
            <label>
              <input type="radio" name="ruleset" value="custom">
              <strong>Custom</strong>
            </label>
            <p class="ruleset-description">Use a custom configuration ruleset.</p>
          </div>
          <div id="custom-config-container" style="display: none;">
            <div class="custom-config-tabs">
              <button type="button" class="tab-btn active" data-tab="paste">Paste JSON</button>
              <button type="button" class="tab-btn" data-tab="gist">GitHub Gist URL</button>
            </div>
            
            <div id="paste-tab" class="tab-content active">
              <textarea id="custom-config-json" rows="10" placeholder="Paste your custom ruleset configuration in JSON format..."></textarea>
            </div>
            
            <div id="gist-tab" class="tab-content">
              <div class="gist-input-container">
                <input type="text" id="gist-url" placeholder="Enter a GitHub Gist URL" class="gist-input" />
                <button type="button" id="fetch-gist-btn" class="btn btn-small">Fetch Gist</button>
              </div>
            </div>
            
            <p class="helper-text">
              JSON format should match the structure of the DoD ruleset. 
              <a href="https://gist.github.com/anfibiacreativa/d8f29b232397069ec3157c8be799c1ac" target="_blank">Learn More</a>
            </p>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button id="analyze-with-ruleset-btn" class="btn">Analyze Template</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalDiv);
  setupModalHandlers();
  console.log('[RulesetModal] Modal initialized');
}

function setupModalHandlers(): void {
  const modal = document.getElementById('ruleset-modal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.close');
  const analyzeBtn = modal.querySelector('#analyze-with-ruleset-btn') as HTMLButtonElement;
  const rulesetInputs = modal.querySelectorAll<HTMLInputElement>('input[name="ruleset"]');
  const customConfigContainer = modal.querySelector('#custom-config-container') as HTMLElement;
  const customConfigInput = modal.querySelector('#custom-config-json') as HTMLTextAreaElement;
  const gistUrlInput = modal.querySelector('#gist-url') as HTMLInputElement;
  const fetchGistBtn = modal.querySelector('#fetch-gist-btn') as HTMLButtonElement;
  const tabBtns = modal.querySelectorAll<HTMLButtonElement>('.tab-btn');
  const tabContents = modal.querySelectorAll<HTMLElement>('.tab-content');

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  // Click outside modal to close
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Show/hide custom config based on selection
  rulesetInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (customConfigContainer) {
        customConfigContainer.style.display = input.value === 'custom' ? 'block' : 'none';
      }
    });
  });

  // Tab switching
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      const tabContent = document.getElementById(`${tabId}-tab`);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });

  // Fetch gist button
  if (fetchGistBtn) {
    fetchGistBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const gistUrl = gistUrlInput.value.trim();
      if (!gistUrl) {
        alert('Please enter a GitHub Gist URL.');
        return;
      }

      // Extract Gist ID
      let gistId = '';
      try {
        const urlParts = gistUrl.split('/');
        gistId = urlParts[urlParts.length - 1];
        if (!gistId) throw new Error('Could not extract Gist ID');
      } catch (e) {
        alert('Invalid Gist URL format.');
        return;
      }

      fetchGistBtn.textContent = 'Loading...';
      fetchGistBtn.disabled = true;

      try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch Gist: ${response.status}`);
        }

        const gistData = await response.json();
        const files = gistData.files;
        if (!files || Object.keys(files).length === 0) {
          throw new Error('No files found in this Gist');
        }

        const firstFile = Object.values(files)[0] as any;
        const content = firstFile.content;
        const parsedConfig = JSON.parse(content);

        customConfigInput.value = JSON.stringify(parsedConfig, null, 2);

        // Switch to paste tab
        tabBtns.forEach((b) => b.classList.remove('active'));
        tabContents.forEach((c) => c.classList.remove('active'));
        modal.querySelector('.tab-btn[data-tab="paste"]')?.classList.add('active');
        modal.querySelector('#paste-tab')?.classList.add('active');

        alert('Gist loaded successfully!');
      } catch (error: any) {
        alert(`Error loading Gist: ${error.message}`);
      } finally {
        fetchGistBtn.textContent = 'Fetch Gist';
        fetchGistBtn.disabled = false;
      }
    });
  }

  // Analyze button
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      const selectedRuleset = modal.querySelector<HTMLInputElement>('input[name="ruleset"]:checked')?.value || 'dod';

      let ruleSetToUse = selectedRuleset;
      let customConfig = null;

      // Handle custom config
      if (selectedRuleset === 'custom') {
        const customJson = customConfigInput.value.trim();
        if (!customJson) {
          alert('Please provide a custom configuration or select a different ruleset.');
          return;
        }

        try {
          customConfig = JSON.parse(customJson);
        } catch (e) {
          alert('Invalid JSON in custom configuration. Please check and try again.');
          return;
        }
      }

      // Close modal
      modal.style.display = 'none';

      // Call analyzer
      console.log('[RulesetModal] Analyzing with ruleset:', ruleSetToUse, 'customConfig:', customConfig);
      
      if (window.TemplateAnalyzer && typeof window.TemplateAnalyzer.analyzeTemplate === 'function') {
        try {
          await window.TemplateAnalyzer.analyzeTemplate(currentRepoUrl, ruleSetToUse);
        } catch (error: any) {
          console.error('[RulesetModal] Analysis error:', error);
          alert(`Analysis error: ${error.message}`);
        }
      } else if (window.analyzeRepo && typeof window.analyzeRepo === 'function') {
        try {
          await window.analyzeRepo(currentRepoUrl, ruleSetToUse);
        } catch (error: any) {
          console.error('[RulesetModal] Analysis error:', error);
          alert(`Analysis error: ${error.message}`);
        }
      } else {
        alert('Analyzer not available. Please refresh the page and try again.');
      }
    });
  }
}

export function showRulesetModal(repoUrl: string): void {
  currentRepoUrl = repoUrl;
  const modal = document.getElementById('ruleset-modal');
  
  if (!modal) {
    console.warn('[RulesetModal] Modal not initialized, initializing now');
    initRulesetModal();
    setTimeout(() => showRulesetModal(repoUrl), 100);
    return;
  }

  console.log('[RulesetModal] Showing modal for:', repoUrl);
  modal.style.display = 'block';
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRulesetModal);
} else {
  initRulesetModal();
}

// Expose globally
window.showRulesetModal = showRulesetModal;

// Also expose a simple analyzeRepo stub if not already available
if (!window.analyzeRepo) {
  window.analyzeRepo = async function(repoUrl: string, ruleSet: string = 'dod', selectedCategories: string[] | null = null) {
    console.log('[RulesetModal] analyzeRepo stub called:', { repoUrl, ruleSet, selectedCategories });
    
    if (ruleSet === 'show-modal') {
      showRulesetModal(repoUrl);
      return;
    }
    
    // Try to use TemplateAnalyzer if available
    if (window.TemplateAnalyzer && typeof window.TemplateAnalyzer.analyzeTemplate === 'function') {
      return window.TemplateAnalyzer.analyzeTemplate(repoUrl, ruleSet);
    }
    
    console.warn('[RulesetModal] No analyzer available');
    alert('Template analyzer not available. Please refresh the page.');
  };
}

export {};
