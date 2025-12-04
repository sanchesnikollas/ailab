import type { AgentManifest, State, ToolDefinition } from '../schemas/index.js';

export interface CompiledPrompt {
  system: string;
  tools: ToolDefinition[];
  tool_choice_policy: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  allowed_tool_names: string[];
  retrieval_hints: RetrievalHint[];
}

export interface RetrievalHint {
  type: 'document' | 'chunk' | 'memory';
  id: string;
  path?: string;
  relevance: number;
}

export interface CompilerOptions {
  include_examples?: boolean;
  max_tool_description_length?: number;
  retrieval_hints?: RetrievalHint[];
}

/**
 * Compiles an AgentManifest into a prompt for a specific state
 */
export function compilePrompt(
  manifest: AgentManifest,
  stateId: string,
  options: CompilerOptions = {}
): CompiledPrompt {
  const state = manifest.fsm.states.find((s) => s.id === stateId);
  if (!state) {
    throw new Error(`State '${stateId}' not found in manifest`);
  }

  const systemPrompt = buildSystemPrompt(manifest, state, options);
  const allowedTools = getAllowedTools(manifest, state);
  const tools = getToolDefinitions(manifest, allowedTools);

  return {
    system: systemPrompt,
    tools,
    tool_choice_policy: determineToolChoicePolicy(state, allowedTools),
    allowed_tool_names: allowedTools,
    retrieval_hints: options.retrieval_hints || [],
  };
}

function buildSystemPrompt(
  manifest: AgentManifest,
  state: State,
  options: CompilerOptions
): string {
  const sections: string[] = [];

  // Identity section (fixed)
  sections.push(buildIdentitySection(manifest));

  // Global rules
  sections.push(buildGlobalRulesSection(manifest));

  // State-specific context
  sections.push(buildStateSection(state, options));

  // Tool appendix (stable order)
  const allowedTools = getAllowedTools(manifest, state);
  if (allowedTools.length > 0) {
    sections.push(buildToolAppendix(manifest, allowedTools, options));
  }

  // Retrieval hints (IDs only, not content)
  if (options.retrieval_hints && options.retrieval_hints.length > 0) {
    sections.push(buildRetrievalHintsSection(options.retrieval_hints));
  }

  return sections.join('\n\n---\n\n');
}

function buildIdentitySection(manifest: AgentManifest): string {
  return `# Agent Identity

**Name:** ${manifest.metadata.name}
**Domain:** ${manifest.metadata.domain}
**Purpose:** ${manifest.prd.purpose}

## Scope
${manifest.prd.scope}

## Context
${manifest.prd.context_problem}`;
}

function buildGlobalRulesSection(manifest: AgentManifest): string {
  const rules: string[] = [
    '# Global Rules',
    '',
    '1. Always stay within your defined scope and purpose.',
    '2. Only use tools that are explicitly allowed for your current state.',
    '3. Respect data classification and privacy requirements.',
    `4. Risk level: ${manifest.metadata.risk_level} - act accordingly.`,
    `5. Data classification: ${manifest.metadata.data_classification}`,
  ];

  if (manifest.memory.pii_flags.length > 0) {
    rules.push('6. Handle PII data with appropriate care and encryption.');
  }

  return rules.join('\n');
}

function buildStateSection(state: State, options: CompilerOptions): string {
  const sections: string[] = [`# Current State: ${state.name}`];

  if (state.description) {
    sections.push(`\n${state.description}`);
  }

  // Add prompt blocks sorted by priority
  const sortedBlocks = [...state.prompt_blocks].sort((a, b) => b.priority - a.priority);

  for (const block of sortedBlocks) {
    if (block.role === 'instructions') {
      sections.push(`\n## Instructions\n${block.content}`);
    } else if (block.role === 'context') {
      sections.push(`\n## Context\n${block.content}`);
    } else if (block.role === 'examples' && options.include_examples !== false) {
      sections.push(`\n## Examples\n${block.content}`);
    }
  }

  // Transitions info
  if (state.transitions.length > 0) {
    sections.push('\n## Possible Transitions');
    for (const t of state.transitions) {
      sections.push(`- When ${t.when.type}: "${t.when.value}" → go to ${t.to_state}`);
    }
  }

  if (state.is_terminal) {
    sections.push('\n**This is a terminal state. Complete the interaction appropriately.**');
  }

  return sections.join('');
}

function buildToolAppendix(
  manifest: AgentManifest,
  allowedTools: string[],
  options: CompilerOptions
): string {
  const maxLen = options.max_tool_description_length || 500;
  const toolDefs = manifest.tools.tools.filter((t) => allowedTools.includes(t.name));

  // Sort by serialization order if provided, otherwise alphabetically
  const order = manifest.tools.serialization_order || toolDefs.map((t) => t.name).sort();
  const sorted = order
    .map((name) => toolDefs.find((t) => t.name === name))
    .filter((t): t is ToolDefinition => t !== undefined);

  const lines: string[] = ['# Available Tools', ''];

  for (const tool of sorted) {
    const desc =
      tool.description.length > maxLen
        ? tool.description.substring(0, maxLen) + '...'
        : tool.description;

    lines.push(`## ${tool.name}`);
    lines.push(`Type: ${tool.type}`);
    lines.push(`Description: ${desc}`);

    if (Object.keys(tool.parameters).length > 0) {
      lines.push('Parameters:');
      for (const [name, param] of Object.entries(tool.parameters)) {
        lines.push(`  - ${name}: ${param.type}${param.required ? ' (required)' : ''}`);
      }
    }
    lines.push('');
  }

  // Add internal tools if allowed
  const internalTools = allowedTools.filter((t) =>
    ['kb.search', 'kb.open', 'notes.write', 'notes.read'].includes(t)
  );

  if (internalTools.length > 0) {
    lines.push('## Internal Tools');
    for (const tool of internalTools) {
      lines.push(`- ${tool}: ${getInternalToolDescription(tool)}`);
    }
  }

  return lines.join('\n');
}

function getInternalToolDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'kb.search': 'Search the knowledge base. Parameters: query (string), topK (number)',
    'kb.open': 'Open a specific document. Parameters: docId (string), chunkIds (string[])',
    'notes.write': 'Write to agent notes. Parameters: path (string), content (string)',
    'notes.read': 'Read from agent notes. Parameters: path (string)',
  };
  return descriptions[name] || 'Unknown internal tool';
}

function buildRetrievalHintsSection(hints: RetrievalHint[]): string {
  const lines: string[] = ['# Retrieval Hints', '', 'The following resources may be relevant:'];

  for (const hint of hints.sort((a, b) => b.relevance - a.relevance)) {
    lines.push(`- [${hint.type}] ${hint.id}${hint.path ? ` (${hint.path})` : ''}`);
  }

  lines.push('', 'Use kb.open to retrieve full content when needed.');

  return lines.join('\n');
}

function getAllowedTools(manifest: AgentManifest, state: State): string[] {
  const tools = new Set<string>(manifest.fsm.global_allowed_tools);
  for (const tool of state.allowed_tools) {
    tools.add(tool);
  }
  return Array.from(tools);
}

function getToolDefinitions(manifest: AgentManifest, allowedTools: string[]): ToolDefinition[] {
  return manifest.tools.tools.filter((t) => allowedTools.includes(t.name));
}

function determineToolChoicePolicy(
  state: State,
  allowedTools: string[]
): CompiledPrompt['tool_choice_policy'] {
  if (allowedTools.length === 0) {
    return 'none';
  }

  // If state is terminal and no tools, don't require tools
  if (state.is_terminal) {
    return 'auto';
  }

  return 'auto';
}

export { compilePrompt as compile };
