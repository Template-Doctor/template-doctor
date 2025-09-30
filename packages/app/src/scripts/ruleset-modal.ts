// Ruleset Modal Handler - TypeScript implementation
// Provides configuration selection UI for template analysis

declare global {
  interface Window {
    showRulesetModal?: (repoUrl: string) => void;
  }
}

interface SelectedCategories {
  repositoryManagement: boolean;
  functionalRequirements: boolean;
  deployment: boolean;
  security: boolean;
  testing: boolean;
}

let currentRepoUrl = '';

export function initRulesetModal(): void {
  // Check if modal already exists
  if (document.getElementById('ruleset-modal')) {
    console.log('[RulesetModal] Modal already initialized');
    return;
  }

  // Create modal HTML with all features
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

          <div id="advanced-config">
            <strong>Advanced: Select categories to check</strong>
            <div id="advanced-checkboxes">
              <label><input type="checkbox" name="adv-category" value="repositoryManagement" /> Repository management</label>
              <label><input type="checkbox" name="adv-category" value="functionalRequirements" /> Functional requirements</label>
              <label><input type="checkbox" name="adv-category" value="deployment" /> Deployment</label>
              <label><input type="checkbox" name="adv-category" value="security" /> Security</label>
              <label><input type="checkbox" name="adv-category" value="testing" /> Testing</label>
            </div>
          </div>

          <div id="global-checks">
            <div class="section-title">Global checks</div>
            <label class="always-on">
              <input type="checkbox" id="ai-deprecation-toggle" checked />
              AI model deprecation (Az Dev CLI only)
              <div id="ai-deprecation-hint" class="hint-text">Check will run by default if AI detected.</div>
            </label>
          </div>

          <div id="archive-override-container" style="display: none;">
            <label>
              <input type="checkbox" id="archive-override" />
              Also save metadata to the centralized archive for this analysis
              <div id="archive-override-hint" class="hint-text">Global archive is OFF. Check this to archive this single run.</div>
            </label>
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

// Helper function to apply preset category selections
function applyPresetToAdvanced(preset: string): void {
  const modal = document.getElementById('ruleset-modal');
  if (!modal) return;

  const setCategory = (name: string, checked: boolean) => {
    const input = modal.querySelector<HTMLInputElement>(`input[name="adv-category"][value="${name}"]`);
    if (input) input.checked = checked;
  };

  if (preset === 'dod') {
    setCategory('repositoryManagement', true);
    setCategory('functionalRequirements', true);
    setCategory('deployment', true);
    setCategory('security', true);
    setCategory('testing', false);
  } else if (preset === 'partner') {
    setCategory('repositoryManagement', false);
    setCategory('functionalRequirements', true);
    setCategory('deployment', true);
    setCategory('security', true);
    setCategory('testing', false);
  } else if (preset === 'docs') {
    setCategory('repositoryManagement', true);
    setCategory('functionalRequirements', true);
    setCategory('deployment', false);
    setCategory('security', true);
    setCategory('testing', false);
  } else if (preset === 'custom') {
    setCategory('repositoryManagement', false);
    setCategory('functionalRequirements', false);
    setCategory('deployment', false);
    setCategory('security', false);
    setCategory('testing', false);
  }
}

// Helper function to get selected categories
function getSelectedCategories(): SelectedCategories {
  const modal = document.getElementById('ruleset-modal');
  if (!modal) {
    return {
      repositoryManagement: false,
      functionalRequirements: false,
      deployment: false,
      security: false,
      testing: false
    };
  }

  const selected = Array.from(
    modal.querySelectorAll<HTMLInputElement>('input[name="adv-category"]:checked')
  ).map(input => input.value);

  return {
    repositoryManagement: selected.includes('repositoryManagement'),
    functionalRequirements: selected.includes('functionalRequirements'),
    deployment: selected.includes('deployment'),
    security: selected.includes('security'),
    testing: selected.includes('testing')
  };
}

// Helper function to show notifications
function showNotification(type: 'success' | 'error' | 'warning', message: string): void {
  if ((window as any).NotificationSystem) {
    if (type === 'success') {
      (window as any).NotificationSystem.showSuccess(message);
    } else if (type === 'error') {
      (window as any).NotificationSystem.showError(message);
    } else {
      (window as any).NotificationSystem.showWarning(message);
    }
  } else {
    alert(message);
  }
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

  // Show/hide custom config and apply presets
  rulesetInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (customConfigContainer) {
        customConfigContainer.style.display = input.value === 'custom' ? 'block' : 'none';
      }
      // Apply preset to advanced checkboxes
      applyPresetToAdvanced(input.value);
    });
  });

  // Initialize with DoD preset
  applyPresetToAdvanced('dod');

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
        showNotification('warning', 'Please enter a GitHub Gist URL.');
        return;
      }

      // Extract Gist ID
      let gistId = '';
      try {
        const urlParts = gistUrl.split('/');
        gistId = urlParts[urlParts.length - 1];
        if (!gistId) throw new Error('Could not extract Gist ID');
      } catch (e) {
        showNotification('error', 'Invalid Gist URL format.');
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

        showNotification('success', 'Gist loaded successfully!');
      } catch (error: any) {
        showNotification('error', `Error loading Gist: ${error.message}`);
      } finally {
        fetchGistBtn.textContent = 'Fetch Gist';
        fetchGistBtn.disabled = false;
      }
    });
  }

  // Analyze button - full implementation with all features
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      const selectedRuleset = modal.querySelector<HTMLInputElement>('input[name="ruleset"]:checked')?.value || 'dod';

      let ruleSetToUse = selectedRuleset;
      let gistUrl = '';

      // Handle custom config
      if (selectedRuleset === 'custom') {
        const customJson = customConfigInput.value.trim();
        if (!customJson) {
          showNotification('error', 'Please provide a custom configuration or select a different ruleset.');
          return;
        }

        try {
          const customConfig = JSON.parse(customJson);
          gistUrl = gistUrlInput.value.trim();
          
          // Save custom config to localStorage with gistUrl if provided
          if (gistUrl) {
            customConfig.gistUrl = gistUrl;
          }
          localStorage.setItem('td_custom_ruleset', JSON.stringify(customConfig));
        } catch (e) {
          showNotification('error', 'Invalid JSON in custom configuration. Please check and try again.');
          return;
        }
      }

      // Get selected categories
      const selectedCategories = getSelectedCategories();

      // Save global config preferences
      const cfg = (window as any).TemplateDoctorConfig || {};
      const aiToggle = modal.querySelector<HTMLInputElement>('#ai-deprecation-toggle');
      const archiveOverride = modal.querySelector<HTMLInputElement>('#archive-override');
      
      if (aiToggle) {
        cfg.aiDeprecationCheckEnabled = aiToggle.checked;
      }
      
      if (archiveOverride && archiveOverride.parentElement && 
          (archiveOverride.parentElement as HTMLElement).style.display !== 'none') {
        cfg.nextAnalysisArchiveEnabledOverride = archiveOverride.checked;
      }

      // Update global config
      (window as any).TemplateDoctorConfig = cfg;

      // Close modal
      modal.style.display = 'none';

      // Trigger analysis with all three parameters
      if (typeof window.analyzeRepo === 'function') {
        // Cast to extended signature that accepts selectedCategories
        (window.analyzeRepo as any)(currentRepoUrl, ruleSetToUse, selectedCategories);
      } else if ((window as any).TemplateAnalyzer?.analyzeTemplate) {
        // Fallback for legacy compatibility
        await (window as any).TemplateAnalyzer.analyzeTemplate(currentRepoUrl, ruleSetToUse, selectedCategories);
      } else {
        console.error('[RulesetModal] No analysis function available');
        showNotification('error', 'Analysis function not available');
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

  // Refresh archive override visibility based on runtime config
  try {
    const cfg = (window as any).TemplateDoctorConfig || {};
    const container = modal.querySelector('#archive-override-container') as HTMLElement;
    const checkbox = modal.querySelector<HTMLInputElement>('#archive-override');
    
    if (cfg.archiveEnabled === true) {
      if (container) container.style.display = 'none';
    } else {
      if (container) container.style.display = 'block';
      if (checkbox) checkbox.checked = false;
    }
  } catch (e) {
    console.warn('[RulesetModal] Error updating archive override UI:', e);
  }

  // Apply preset for currently selected ruleset
  const selectedRuleset = modal.querySelector<HTMLInputElement>('input[name="ruleset"]:checked')?.value || 'dod';
  applyPresetToAdvanced(selectedRuleset);

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

// Expose analyzeRepo stub if not already available
if (!window.analyzeRepo) {
  window.analyzeRepo = async function(repoUrl: string, ruleSet: string = 'dod', selectedCategories: any = null) {
    console.log('[RulesetModal] analyzeRepo stub called:', { repoUrl, ruleSet, selectedCategories });
    
    if (ruleSet === 'show-modal') {
      showRulesetModal(repoUrl);
      return;
    }
    
    // Try to use TemplateAnalyzer if available
    if ((window as any).TemplateAnalyzer && typeof (window as any).TemplateAnalyzer.analyzeTemplate === 'function') {
      return (window as any).TemplateAnalyzer.analyzeTemplate(repoUrl, ruleSet, selectedCategories);
    }
    
    console.warn('[RulesetModal] No analyzer available');
    showNotification('error', 'Template analyzer not available. Please refresh the page.');
  };
}

export {};
