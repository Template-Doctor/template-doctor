/**
 * Workflow Artifact Parser Registry
 * 
 * Provides default parsers for common artifact formats and allows
 * registration of custom parsers for specific workflow types.
 */

import { ArtifactParser, ParserRegistryEntry, WorkflowConfig } from '../types/workflow.js';
import { parseAzdValidationResult } from './azd-validation.js';

const parserRegistry = new Map<string, ParserRegistryEntry>();

/**
 * Default markdown parser - extracts common patterns
 */
export const markdownParser: ArtifactParser = (content: string, config: WorkflowConfig) => {
  return {
    format: 'markdown',
    content,
    rawText: content,
    // Extract common sections
    sections: extractMarkdownSections(content),
    // Extract lists
    checklists: extractChecklists(content),
    // Extract code blocks
    codeBlocks: extractCodeBlocks(content),
  };
};

/**
 * Default log parser - extracts log patterns
 */
export const logParser: ArtifactParser = (content: string, config: WorkflowConfig) => {
  return {
    format: 'log',
    content,
    rawText: content,
    lines: content.split('\n'),
    errors: extractLogErrors(content),
    warnings: extractLogWarnings(content),
  };
};

/**
 * JSON parser - parses JSON artifacts
 */
export const jsonParser: ArtifactParser = (content: string, config: WorkflowConfig) => {
  try {
    const parsed = JSON.parse(content);
    return {
      format: 'json',
      content,
      data: parsed,
    };
  } catch (error) {
    return {
      format: 'json',
      content,
      error: 'Failed to parse JSON',
      rawText: content,
    };
  }
};

/**
 * AZD validation parser - wraps existing azd-validation parser
 */
export const azdValidationParser: ArtifactParser = (content: string, config: WorkflowConfig) => {
  const parsed = parseAzdValidationResult(content);
  return {
    format: 'azd-validation',
    ...parsed,
  };
};

/**
 * Register default parsers
 */
function registerDefaultParsers() {
  parserRegistry.set('markdown', {
    name: 'markdown',
    parser: markdownParser,
    description: 'Default markdown artifact parser',
  });

  parserRegistry.set('log', {
    name: 'log',
    parser: logParser,
    description: 'Default log file parser',
  });

  parserRegistry.set('json', {
    name: 'json',
    parser: jsonParser,
    description: 'JSON artifact parser',
  });

  parserRegistry.set('azd-validation', {
    name: 'azd-validation',
    parser: azdValidationParser,
    description: 'AZD template validation parser',
  });
}

// Register default parsers on module load
registerDefaultParsers();

/**
 * Register a custom artifact parser
 */
export function registerParser(name: string, parser: ArtifactParser, description?: string): void {
  parserRegistry.set(name, {
    name,
    parser,
    description,
  });
}

/**
 * Get parser by name, fallback to auto-detection
 */
export function getParser(parserName?: string, fileExtension?: string): ArtifactParser {
  // If parser name specified, use it
  if (parserName && parserRegistry.has(parserName)) {
    return parserRegistry.get(parserName)!.parser;
  }

  // Auto-detect based on file extension
  if (fileExtension) {
    const ext = fileExtension.toLowerCase();
    if (ext === '.md' || ext === '.markdown') {
      return markdownParser;
    }
    if (ext === '.log' || ext === '.txt') {
      return logParser;
    }
    if (ext === '.json') {
      return jsonParser;
    }
  }

  // Default to markdown parser
  return markdownParser;
}

/**
 * List all registered parsers
 */
export function listParsers(): ParserRegistryEntry[] {
  return Array.from(parserRegistry.values());
}

// Helper functions

function extractMarkdownSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const headerRegex = /^#{1,6}\s+(.+)$/gm;
  let match;
  let lastHeader = '';
  let lastIndex = 0;

  while ((match = headerRegex.exec(content)) !== null) {
    if (lastHeader) {
      sections[lastHeader] = content.substring(lastIndex, match.index).trim();
    }
    lastHeader = match[1];
    lastIndex = headerRegex.lastIndex;
  }

  if (lastHeader) {
    sections[lastHeader] = content.substring(lastIndex).trim();
  }

  return sections;
}

function extractChecklists(content: string): Array<{ checked: boolean; text: string }> {
  const checklistRegex = /^[-*]\s+\[([ xX])\]\s+(.+)$/gm;
  const checklists: Array<{ checked: boolean; text: string }> = [];
  let match;

  while ((match = checklistRegex.exec(content)) !== null) {
    checklists.push({
      checked: match[1].toLowerCase() === 'x',
      text: match[2],
    });
  }

  return checklists;
}

function extractCodeBlocks(content: string): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const codeBlocks: Array<{ language: string; code: string }> = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }

  return codeBlocks;
}

function extractLogErrors(content: string): string[] {
  const errorRegex = /^.*\b(error|err|fatal|failed|failure)\b.*$/gim;
  const errors: string[] = [];
  let match;

  while ((match = errorRegex.exec(content)) !== null) {
    errors.push(match[0].trim());
  }

  return errors;
}

function extractLogWarnings(content: string): string[] {
  const warningRegex = /^.*\b(warning|warn|caution)\b.*$/gim;
  const warnings: string[] = [];
  let match;

  while ((match = warningRegex.exec(content)) !== null) {
    warnings.push(match[0].trim());
  }

  return warnings;
}
