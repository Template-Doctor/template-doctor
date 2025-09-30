// Agents.md validation and enrichment for dashboard
// Performs client-side checks for agents.md presence and structure

interface AgentsCache {
  status: 'missing' | 'invalid' | 'valid';
  problems?: string[];
  agentCount?: number;
  cachedAt?: number;
}

export async function runAgentsEnrichment(adaptedData: any): Promise<void> {
  if (!adaptedData || !adaptedData.compliance) return;

  // Check if backend already provided agents data
  const existingItems = adaptedData.compliance.issues
    .concat(adaptedData.compliance.compliant)
    .filter((i: any) => i.category === 'agents');

  if (existingItems.length) {
    console.log('[AgentsEnrichment] Skipped - already present from backend');
    updateAgentsBadgeFromData(adaptedData);
    return;
  }

  // Only proceed for public GitHub URLs
  const repoUrl = adaptedData.repoUrl || '';
  if (!/https?:\/\/github\.com\//i.test(repoUrl)) {
    console.log('[AgentsEnrichment] Skipped - non-GitHub repo');
    return;
  }

  const ownerRepoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?/i);
  if (!ownerRepoMatch) return;

  const owner = ownerRepoMatch[1];
  const repo = ownerRepoMatch[2];
  const cacheKey = `__TD_agents_cache_${owner}_${repo}`;

  // Check session cache
  try {
    if (sessionStorage) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache: AgentsCache = JSON.parse(cached);
        console.log('[AgentsEnrichment] Using session cache');
        applyAgentsCachedResult(adaptedData, parsedCache);
        updateAgentsBadgeFromData(adaptedData);
        return;
      }
    }
  } catch (e) {
    console.warn('[AgentsEnrichment] Cache read error:', e);
  }

  // Fetch agents.md
  const candidateBranches = ['main', 'master'];
  let content: string | null = null;

  for (const branch of candidateBranches) {
    try {
      // Try jsdelivr CDN first (fast + cached)
      const cdnResp = await fetch(
        `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/agents.md`,
        { cache: 'no-store' }
      );
      if (cdnResp.ok) {
        content = await cdnResp.text();
        break;
      }

      // Fallback to raw.githubusercontent.com
      const rawResp = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/agents.md`,
        { cache: 'no-store' }
      );
      if (rawResp.ok) {
        content = await rawResp.text();
        break;
      }
    } catch (e) {
      // Try next branch
      continue;
    }
  }

  if (content === null) {
    // File not found
    const issue = {
      id: 'agents-missing-file',
      category: 'agents',
      severity: 'error',
      message: 'agents.md file is missing (client check)',
      recommendation:
        'Add an agents.md describing available agents following the [agents.md specification](https://agents.md) for documenting AI Agents.',
    };
    adaptedData.compliance.issues.push(issue);

    // Ensure categories object exists
    if (!adaptedData.compliance.categories) {
      adaptedData.compliance.categories = {};
    }
    if (!adaptedData.compliance.categories.agents) {
      adaptedData.compliance.categories.agents = {
        enabled: true,
        issues: [issue],
        compliant: [],
        percentage: 0,
      };
    }

    storeAgentsCache(cacheKey, { status: 'missing', problems: ['file not found'] });
    updateAgentsBadge(issue, null);
    updateAgentsTileStatus('missing');
    return;
  }

  // Parse and validate content
  const lines = content.split(/\r?\n/);
  const firstHeader = lines.find((l) => /^#\s+/.test(l.trim())) || '';
  const hasTopHeader = /^#\s+/.test(firstHeader);
  const hasAgentsSection = /##\s+agents?/i.test(content);

  // Find table header
  const tableHeaderLine = lines.find(
    (l) => /\|/.test(l) && /name/i.test(l) && /description/i.test(l)
  );
  let headerCols: string[] = [];
  if (tableHeaderLine) {
    headerCols = tableHeaderLine
      .split('|')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
  }

  const requiredCols = ['name', 'description', 'inputs', 'outputs', 'permissions'];
  const missingCols = requiredCols.filter((c) => !headerCols.some((h) => h === c));
  const hasTable = headerCols.length > 0;

  const problems: string[] = [];
  if (!hasTopHeader) problems.push('missing top-level heading');
  if (!hasAgentsSection) problems.push('missing Agents section (## Agents)');
  if (!hasTable) problems.push('missing agent definition table');
  if (hasTable && missingCols.length) {
    problems.push('missing required columns: ' + missingCols.join(', '));
  }

  // Count agent rows
  let agentCount = 0;
  if (hasTable && tableHeaderLine) {
    const tableIndex = lines.indexOf(tableHeaderLine);
    for (let i = tableIndex + 1; i < lines.length; i++) {
      const ln = lines[i];
      // Skip separator row
      if (/^\s*\|\s*[-:]+(\s*\|\s*[-:]+)*\s*\|?\s*$/.test(ln)) continue;
      // Stop if no pipes
      if (!/\|/.test(ln)) break;
      // Count rows with at least 2 cells
      const cellParts = ln.split('|').map((c) => c.trim());
      if (cellParts.filter(Boolean).length >= 2) {
        agentCount++;
      }
    }
  }

  if (problems.length) {
    const issue = {
      id: 'agents-format-invalid',
      category: 'agents',
      severity: 'warning',
      message: 'agents.md present but formatting issues detected (client check)',
      details: problems,
      recommendation:
        'Ensure agents.md contains required heading, section and columns as per the [agents.md specification](https://agents.md): ' +
        requiredCols.join(', '),
    };
    adaptedData.compliance.issues.push(issue);
    storeAgentsCache(cacheKey, { status: 'invalid', problems, agentCount });
    updateAgentsBadge(issue, null);
    updateAgentsTileStatus('invalid');
  } else {
    const compliantItem = {
      id: 'agents-doc-valid',
      category: 'agents',
      message: `agents.md present and basic structure validated (${agentCount} agent${agentCount === 1 ? '' : 's'})`,
      details: { agentCount, columns: headerCols },
    };
    adaptedData.compliance.compliant.push(compliantItem);
    storeAgentsCache(cacheKey, { status: 'valid', agentCount });
    updateAgentsBadge(null, compliantItem);
    updateAgentsTileStatus('valid');
  }
}

function storeAgentsCache(key: string, value: AgentsCache): void {
  try {
    if (sessionStorage) {
      sessionStorage.setItem(key, JSON.stringify({ ...value, cachedAt: Date.now() }));
    }
  } catch (e) {
    console.warn('[AgentsEnrichment] Cache write error:', e);
  }
}

function applyAgentsCachedResult(adaptedData: any, cached: AgentsCache): void {
  if (!cached || !adaptedData) return;

  if (cached.status === 'missing') {
    adaptedData.compliance.issues.push({
      id: 'agents-missing-file',
      category: 'agents',
      severity: 'error',
      message: 'agents.md file is missing (client check, cached)',
    });
  } else if (cached.status === 'invalid') {
    adaptedData.compliance.issues.push({
      id: 'agents-format-invalid',
      category: 'agents',
      severity: 'warning',
      message: 'agents.md formatting issues (cached)',
      details: cached.problems,
    });
  } else if (cached.status === 'valid') {
    adaptedData.compliance.compliant.push({
      id: 'agents-doc-valid',
      category: 'agents',
      message: `agents.md present and validated (${cached.agentCount || 0} agents, cached)`,
      details: { agentCount: cached.agentCount },
    });
  }
}

function updateAgentsBadgeFromData(adaptedData: any): void {
  const issues = adaptedData.compliance.issues.filter((i: any) => i.category === 'agents');
  const passes = adaptedData.compliance.compliant.filter((i: any) => i.category === 'agents');
  updateAgentsBadge(issues[0] || null, passes[0] || null);
}

function updateAgentsBadge(issue: any | null, compliant: any | null): void {
  try {
    const actionHeader = document.getElementById('action-section');
    if (!actionHeader) return;

    let badge = document.getElementById('agents-status-badge') as HTMLElement | null;
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'agents-status-badge';
      badge.style.cssText =
        'margin-left:8px; padding:2px 6px; border-radius:10px; font-size:0.65rem; letter-spacing:.5px; font-weight:600; vertical-align:middle;';

      // Insert next to header title (first h3)
      const h3 = actionHeader.querySelector('h3');
      if (h3) h3.appendChild(badge);
      else actionHeader.appendChild(badge);
    }

    if (issue && issue.id === 'agents-missing-file') {
      badge.textContent = 'Agents: Missing';
      badge.style.background = '#d9534f';
      badge.style.color = '#fff';
      badge.title = 'agents.md not found in repository';
      updateAgentsTileStatus('missing');
    } else if (issue) {
      badge.textContent = 'Agents: Invalid';
      badge.style.background = '#f0ad4e';
      badge.style.color = '#fff';
      badge.title = 'agents.md has formatting issues';
      updateAgentsTileStatus('invalid');
    } else if (compliant) {
      badge.textContent = 'Agents: Valid';
      badge.style.background = '#28a745';
      badge.style.color = '#fff';
      badge.title = 'agents.md found and validated';
      updateAgentsTileStatus('valid');
    }
  } catch (e) {
    console.warn('[AgentsEnrichment] Badge update error:', e);
  }
}

export function updateAgentsTileStatus(status: 'missing' | 'invalid' | 'valid'): void {
  try {
    const tile = document.querySelector<HTMLElement>(
      '.category-breakdown .tile[data-category="agents"]'
    );
    if (!tile) return; // Not rendered yet

    tile.style.transition = 'background 0.3s, border-color 0.3s';

    if (status === 'missing') {
      tile.style.background = '#ffe5e5';
      tile.style.border = '1px solid #d9534f';

      // Inject action button if not present
      if (!tile.querySelector('.agents-action')) {
        const actionDiv = document.createElement('div');
        actionDiv.className = 'agents-action';
        actionDiv.style.cssText = 'margin-top:8px;';
        actionDiv.innerHTML = `<button onclick="createAgentsMdIssue(event)" style="padding:6px 12px; background:#d9534f; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:0.85rem;"><i class="fas fa-magic"></i> Create agents.md Issue</button>`;
        tile.appendChild(actionDiv);
      }
    } else if (status === 'invalid') {
      tile.style.background = '#fff3cd';
      tile.style.border = '1px solid #f0ad4e';
    } else {
      tile.style.background = '';
      tile.style.border = '';
    }
  } catch (e) {
    console.warn('[AgentsEnrichment] Tile update error:', e);
  }
}

// Global function for creating agents.md issue
(window as any).createAgentsMdIssue = async function (event: Event) {
  event?.preventDefault();
  
  if (!(window as any).NotificationSystem) {
    alert('This feature requires GitHub authentication. Please sign in first.');
    return false;
  }

  const notify = (window as any).NotificationSystem;
  notify.showLoading('Creating agents.md issue...');

  try {
    const reportData = (window as any).reportData;
    if (!reportData || !reportData.repoUrl) {
      notify.showError('Repository URL not found');
      return false;
    }

    const repoUrl = reportData.repoUrl;
    const ownerRepoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?/i);
    if (!ownerRepoMatch) {
      notify.showError('Invalid repository URL');
      return false;
    }

    const owner = ownerRepoMatch[1];
    const repo = ownerRepoMatch[2];

    // Check if GitHubClient is available
    if (!(window as any).GitHubClient) {
      notify.showError('GitHub client not available. Please refresh the page.');
      return false;
    }

    const gh = (window as any).GitHubClient;
    if (!gh.auth || !gh.auth.isAuthenticated()) {
      notify.showError('Please sign in with GitHub first.');
      return false;
    }

    const token = gh.auth.getToken();
    if (!token) {
      notify.showError('GitHub token not available');
      return false;
    }

    // Create issue with template
    const issueTitle = '📋 Add agents.md documentation';
    const issueBody = `## Description
This repository is missing an \`agents.md\` file to document AI agents.

## Requirements
The \`agents.md\` file should follow the [agents.md specification](https://agents.md) and include:

- Top-level heading (# Agents)
- ## Agents section
- Table with columns: name, description, inputs, outputs, permissions

## Example Template
\`\`\`markdown
# Agents

## Agents

| name | description | inputs | outputs | permissions |
|------|-------------|--------|---------|-------------|
| ExampleAgent | Brief description | Input requirements | Output format | Required permissions |
\`\`\`

## Resources
- [agents.md Specification](https://agents.md)
- [Example agents.md files](https://github.com/topics/agents-md)

---
_This issue was auto-generated by Template Doctor._
`;

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: ['documentation', 'agents', 'template-doctor'],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const issue = await response.json();
    notify.showSuccess(
      'Issue Created!',
      `Created issue #${issue.number}: "${issueTitle}". <a href="${issue.html_url}" target="_blank">View issue</a>`,
      8000
    );

    return false;
  } catch (error: any) {
    console.error('[AgentsEnrichment] Issue creation error:', error);
    notify.showError('Failed to create issue: ' + error.message);
    return false;
  }
};

export {};
