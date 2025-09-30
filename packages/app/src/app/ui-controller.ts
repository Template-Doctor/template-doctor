// UI Controller - Manages section visibility and page layout
// Extracted from legacy app.js DOMContentLoaded initialization

interface Sections {
  welcome: HTMLElement | null;
  search: HTMLElement | null;
  analysis: HTMLElement | null;
  error: HTMLElement | null;
}

class UIController {
  private sections: Sections;

  constructor() {
    this.sections = {
      welcome: document.getElementById('welcome-section'),
      search: document.getElementById('search-section'),
      analysis: document.getElementById('analysis-section'),
      error: document.getElementById('error-section')
    };

    this.initializeUI();
    this.attachEventListeners();
  }

  private initializeUI() {
    // Initial state: show welcome and search, hide analysis and error
    this.showWelcome();
    this.showSearch();
    this.hideAnalysis();
    this.hideError();
    
    console.debug('[UIController] Initialized with default section visibility');
  }

  private attachEventListeners() {
    // Back button from analysis section
    const backButton = document.getElementById('back-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.showSearch();
        this.hideAnalysis();
        console.debug('[UIController] Back to search');
      });
    }

    // Back button from error section  
    const errorBackButton = document.getElementById('error-back-button');
    if (errorBackButton) {
      errorBackButton.addEventListener('click', () => {
        this.showSearch();
        this.hideError();
        console.debug('[UIController] Back from error');
      });
    }

    // Listen for events to show analysis section
    document.addEventListener('show-analysis-section', () => {
      this.hideSearch();
      this.showAnalysis();
    });

    // Listen for events to show search section
    document.addEventListener('show-search-section', () => {
      this.showSearch();
      this.hideAnalysis();
      this.hideError();
    });

    // Batch mode toggle
    const scanModeToggle = document.getElementById('scan-mode-toggle') as HTMLInputElement;
    const singleModeLabel = document.getElementById('single-mode-label');
    const batchModeLabel = document.getElementById('batch-mode-label');
    const singleContainer = document.getElementById('single-scan-container');
    const batchContainer = document.getElementById('batch-urls-container');

    if (scanModeToggle && singleContainer && batchContainer) {
      scanModeToggle.addEventListener('change', () => {
        if (scanModeToggle.checked) {
          // Batch mode
          singleContainer.style.display = 'none';
          batchContainer.style.display = 'block';
          singleModeLabel?.classList.remove('active');
          batchModeLabel?.classList.add('active');
          console.debug('[UIController] Switched to batch mode');
        } else {
          // Single mode
          singleContainer.style.display = 'flex';
          batchContainer.style.display = 'none';
          singleModeLabel?.classList.add('active');
          batchModeLabel?.classList.remove('active');
          console.debug('[UIController] Switched to single mode');
        }
      });
    }

    console.debug('[UIController] Event listeners attached');
  }

  showWelcome() {
    if (this.sections.welcome) this.sections.welcome.style.display = 'block';
  }

  hideWelcome() {
    if (this.sections.welcome) this.sections.welcome.style.display = 'none';
  }

  showSearch() {
    if (this.sections.search) this.sections.search.style.display = 'block';
  }

  hideSearch() {
    if (this.sections.search) this.sections.search.style.display = 'none';
  }

  showAnalysis() {
    if (this.sections.analysis) this.sections.analysis.style.display = 'block';
  }

  hideAnalysis() {
    if (this.sections.analysis) this.sections.analysis.style.display = 'none';
  }

  showError(message: string) {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) errorMessage.textContent = message;
    if (this.sections.error) this.sections.error.style.display = 'block';
  }

  hideError() {
    if (this.sections.error) this.sections.error.style.display = 'none';
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const controller = new UIController();
    (window as any).UIController = controller;
  });
} else {
  const controller = new UIController();
  (window as any).UIController = controller;
}

export {};
