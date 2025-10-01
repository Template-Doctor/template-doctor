// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Category breakdown tiles display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForFunction(() => !!window.DashboardRenderer);
  });

  test('renders all six category tiles with correct structure', async ({ page }) => {
    // Mock analysis result with categories
    const mockResult = {
      repoUrl: 'https://github.com/test/repo',
      ruleSet: 'dod',
      timestamp: new Date().toISOString(),
      compliance: {
        issues: [{ id: 'missing-file-license', category: 'file', message: 'Missing LICENSE' }],
        compliant: [
          { id: 'file-present-readme', category: 'file', message: 'README present' },
          { id: 'workflow-present', category: 'workflow', message: 'Workflow present' },
          { id: 'bicep-present', category: 'bicep', message: 'Bicep present' },
        ],
        percentage: 75,
        summary: '75% compliant',
        categories: {
          repositoryManagement: {
            enabled: true,
            issues: [{ id: 'missing-file-license', category: 'file', message: 'Missing LICENSE' }],
            compliant: [{ id: 'file-present-readme', category: 'file', message: 'README present' }],
            percentage: 50,
          },
          functionalRequirements: {
            enabled: true,
            issues: [],
            compliant: [],
            percentage: 0,
          },
          deployment: {
            enabled: true,
            issues: [],
            compliant: [
              { id: 'workflow-present', category: 'workflow', message: 'Workflow present' },
              { id: 'bicep-present', category: 'bicep', message: 'Bicep present' },
            ],
            percentage: 100,
          },
          security: {
            enabled: true,
            issues: [],
            compliant: [],
            percentage: 0,
          },
          testing: {
            enabled: false,
            issues: [],
            compliant: [],
            percentage: 0,
          },
          agents: {
            enabled: true,
            issues: [],
            compliant: [],
            percentage: 0,
          },
        },
      },
    };

    // Render dashboard with mock result
    await page.evaluate((result) => {
      const container = document.getElementById('dashboard') || document.body;
      if (window.DashboardRenderer && typeof window.DashboardRenderer.render === 'function') {
        window.DashboardRenderer.render(result, container);
      }
    }, mockResult);

    // Wait for category breakdown section to render
    await page.waitForSelector('.category-breakdown', { timeout: 5000 });

    // Verify section header
    const header = page.locator('.category-breakdown h3');
    await expect(header).toHaveText('By Category');

    // Verify all 6 tiles are present
    const tiles = page.locator('.category-breakdown .tile');
    await expect(tiles).toHaveCount(6);

    // Verify each tile has the required structure
    const expectedCategories = [
      { key: 'repositoryManagement', label: 'Repository Management', icon: 'fa-folder' },
      { key: 'functionalRequirements', label: 'Functional Requirements', icon: 'fa-tasks' },
      { key: 'deployment', label: 'Deployment', icon: 'fa-cloud-upload-alt' },
      { key: 'security', label: 'Security', icon: 'fa-shield-alt' },
      { key: 'testing', label: 'Testing', icon: 'fa-vial' },
      { key: 'agents', label: 'Agents', icon: 'fa-robot' },
    ];

    for (const cat of expectedCategories) {
      const tile = page.locator(`.category-breakdown .tile[data-category="${cat.key}"]`);
      await expect(tile).toBeVisible();

      // Verify icon
      const icon = tile.locator(`i.${cat.icon}`);
      await expect(icon).toBeVisible();

      // Verify label
      await expect(tile.locator('.tile-title').first()).toContainText(cat.label);

      // Verify percentage display
      const percentage = tile.locator('.tile-value');
      await expect(percentage).toBeVisible();

      // Verify enabled/disabled badge
      const badge = tile.locator('.badge');
      await expect(badge).toBeVisible();
    }
  });

  test('displays correct percentage and counts for each category', async ({ page }) => {
    const mockResult = {
      repoUrl: 'https://github.com/test/repo',
      ruleSet: 'dod',
      compliance: {
        issues: [],
        compliant: [],
        percentage: 100,
        summary: '100% compliant',
        categories: {
          repositoryManagement: {
            enabled: true,
            issues: [{ id: 'i1' }, { id: 'i2' }],
            compliant: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }],
            percentage: 60, // 3/5 = 60%
          },
          functionalRequirements: {
            enabled: true,
            issues: [],
            compliant: [{ id: 'c1' }],
            percentage: 100,
          },
          deployment: {
            enabled: true,
            issues: [{ id: 'i1' }],
            compliant: [],
            percentage: 0,
          },
          security: { enabled: true, issues: [], compliant: [], percentage: 0 },
          testing: { enabled: false, issues: [], compliant: [], percentage: 0 },
          agents: { enabled: true, issues: [], compliant: [], percentage: 0 },
        },
      },
    };

    await page.evaluate((result) => {
      const container = document.getElementById('dashboard') || document.body;
      if (window.DashboardRenderer) {
        window.DashboardRenderer.render(result, container);
      }
    }, mockResult);

    await page.waitForSelector('.category-breakdown', { timeout: 5000 });

    // Verify Repository Management: 60%, 3 passed, 2 issues
    const repoMgmt = page.locator('.tile[data-category="repositoryManagement"]');
    await expect(repoMgmt.locator('.tile-value')).toHaveText('60%');
    await expect(repoMgmt).toContainText('3 passed • 2 issues');

    // Verify Functional Requirements: 100%, 1 passed, 0 issues
    const funcReq = page.locator('.tile[data-category="functionalRequirements"]');
    await expect(funcReq.locator('.tile-value')).toHaveText('100%');
    await expect(funcReq).toContainText('1 passed • 0 issues');

    // Verify Deployment: 0%, 0 passed, 1 issue
    const deployment = page.locator('.tile[data-category="deployment"]');
    await expect(deployment.locator('.tile-value')).toHaveText('0%');
    await expect(deployment).toContainText('0 passed • 1 issue');
  });

  test('shows enabled badge in green for enabled categories', async ({ page }) => {
    const mockResult = {
      repoUrl: 'https://github.com/test/repo',
      ruleSet: 'dod',
      compliance: {
        issues: [],
        compliant: [],
        percentage: 100,
        summary: '100% compliant',
        categories: {
          repositoryManagement: { enabled: true, issues: [], compliant: [], percentage: 0 },
          functionalRequirements: { enabled: true, issues: [], compliant: [], percentage: 0 },
          deployment: { enabled: true, issues: [], compliant: [], percentage: 0 },
          security: { enabled: true, issues: [], compliant: [], percentage: 0 },
          testing: { enabled: true, issues: [], compliant: [], percentage: 0 },
          agents: { enabled: true, issues: [], compliant: [], percentage: 0 },
        },
      },
    };

    await page.evaluate((result) => {
      const container = document.getElementById('dashboard') || document.body;
      if (window.DashboardRenderer) {
        window.DashboardRenderer.render(result, container);
      }
    }, mockResult);

    await page.waitForSelector('.category-breakdown', { timeout: 5000 });

    // Verify enabled badges are green
    const enabledBadges = page.locator('.category-breakdown .badge').filter({ hasText: 'Enabled' });
    const count = await enabledBadges.count();
    expect(count).toBe(6);

    // Check first enabled badge styling
    const firstBadge = enabledBadges.first();
    const bgColor = await firstBadge.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // #28a745 is rgb(40, 167, 69)
    expect(bgColor).toContain('40'); // Contains green component
  });

  test('shows disabled badge in gray for disabled categories', async ({ page }) => {
    const mockResult = {
      repoUrl: 'https://github.com/test/repo',
      ruleSet: 'dod',
      compliance: {
        issues: [],
        compliant: [],
        percentage: 100,
        summary: '100% compliant',
        categories: {
          repositoryManagement: { enabled: true, issues: [], compliant: [], percentage: 0 },
          functionalRequirements: { enabled: true, issues: [], compliant: [], percentage: 0 },
          deployment: { enabled: true, issues: [], compliant: [], percentage: 0 },
          security: { enabled: true, issues: [], compliant: [], percentage: 0 },
          testing: { enabled: false, issues: [], compliant: [], percentage: 0 },
          agents: { enabled: false, issues: [], compliant: [], percentage: 0 },
        },
      },
    };

    await page.evaluate((result) => {
      const container = document.getElementById('dashboard') || document.body;
      if (window.DashboardRenderer) {
        window.DashboardRenderer.render(result, container);
      }
    }, mockResult);

    await page.waitForSelector('.category-breakdown', { timeout: 5000 });

    // Verify disabled badges exist
    const disabledBadges = page
      .locator('.category-breakdown .badge')
      .filter({ hasText: 'Disabled' });
    const count = await disabledBadges.count();
    expect(count).toBe(2);

    // Check disabled badge styling
    const firstDisabledBadge = disabledBadges.first();
    const bgColor = await firstDisabledBadge.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    // #6c757d is gray
    expect(bgColor).toContain('108'); // Contains gray component
  });

  test('handles empty categories gracefully', async ({ page }) => {
    const mockResult = {
      repoUrl: 'https://github.com/test/repo',
      ruleSet: 'dod',
      compliance: {
        issues: [],
        compliant: [],
        percentage: 0,
        summary: '0% compliant',
        categories: {
          repositoryManagement: { enabled: true, issues: [], compliant: [], percentage: 0 },
          functionalRequirements: { enabled: true, issues: [], compliant: [], percentage: 0 },
          deployment: { enabled: true, issues: [], compliant: [], percentage: 0 },
          security: { enabled: true, issues: [], compliant: [], percentage: 0 },
          testing: { enabled: true, issues: [], compliant: [], percentage: 0 },
          agents: { enabled: true, issues: [], compliant: [], percentage: 0 },
        },
      },
    };

    await page.evaluate((result) => {
      const container = document.getElementById('dashboard') || document.body;
      if (window.DashboardRenderer) {
        window.DashboardRenderer.render(result, container);
      }
    }, mockResult);

    await page.waitForSelector('.category-breakdown', { timeout: 5000 });

    // All tiles should show 0%, 0 passed, 0 issues
    const tiles = page.locator('.category-breakdown .tile');
    const count = await tiles.count();

    for (let i = 0; i < count; i++) {
      const tile = tiles.nth(i);
      await expect(tile.locator('.tile-value')).toHaveText('0%');
      await expect(tile).toContainText('0 passed • 0 issues');
    }
  });

  test('category tiles are responsive and maintain minimum width', async ({ page }) => {
    const mockResult = {
      repoUrl: 'https://github.com/test/repo',
      ruleSet: 'dod',
      compliance: {
        issues: [],
        compliant: [],
        percentage: 100,
        summary: '100% compliant',
        categories: {
          repositoryManagement: { enabled: true, issues: [], compliant: [], percentage: 0 },
          functionalRequirements: { enabled: true, issues: [], compliant: [], percentage: 0 },
          deployment: { enabled: true, issues: [], compliant: [], percentage: 0 },
          security: { enabled: true, issues: [], compliant: [], percentage: 0 },
          testing: { enabled: true, issues: [], compliant: [], percentage: 0 },
          agents: { enabled: true, issues: [], compliant: [], percentage: 0 },
        },
      },
    };

    await page.evaluate((result) => {
      const container = document.getElementById('dashboard') || document.body;
      if (window.DashboardRenderer) {
        window.DashboardRenderer.render(result, container);
      }
    }, mockResult);

    await page.waitForSelector('.category-breakdown', { timeout: 5000 });

    // Verify each tile has min-width of 200px
    const tiles = page.locator('.category-breakdown .tile');
    const count = await tiles.count();

    for (let i = 0; i < count; i++) {
      const tile = tiles.nth(i);
      const minWidth = await tile.evaluate((el) => el.style.minWidth);
      expect(minWidth).toBe('200px');
    }
  });
});
