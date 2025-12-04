import type { ToolCall } from './types.js';
import type { AgentManifest, State } from '../schemas/index.js';

export interface PolicyGateResult {
  allowed: boolean;
  blockedTools: string[];
  reason?: string;
}

/**
 * Policy Gate - validates tool calls against allowed tools for current state
 * Used when the model provider doesn't support native tool_choice constraints
 */
export class PolicyGate {
  private manifest: AgentManifest;

  constructor(manifest: AgentManifest) {
    this.manifest = manifest;
  }

  /**
   * Validates tool calls against the allowed tools for a state
   */
  validate(stateId: string, toolCalls: ToolCall[]): PolicyGateResult {
    const state = this.manifest.fsm.states.find((s) => s.id === stateId);
    if (!state) {
      return {
        allowed: false,
        blockedTools: toolCalls.map((t) => t.name),
        reason: `Unknown state: ${stateId}`,
      };
    }

    const allowedTools = this.getAllowedTools(state);
    const blockedTools: string[] = [];

    for (const call of toolCalls) {
      if (!allowedTools.has(call.name)) {
        blockedTools.push(call.name);
      }
    }

    if (blockedTools.length > 0) {
      return {
        allowed: false,
        blockedTools,
        reason: `Tools not allowed in state '${state.name}': ${blockedTools.join(', ')}`,
      };
    }

    return { allowed: true, blockedTools: [] };
  }

  /**
   * Filters tool calls, keeping only allowed ones
   */
  filter(stateId: string, toolCalls: ToolCall[]): { allowed: ToolCall[]; blocked: ToolCall[] } {
    const state = this.manifest.fsm.states.find((s) => s.id === stateId);
    if (!state) {
      return { allowed: [], blocked: toolCalls };
    }

    const allowedTools = this.getAllowedTools(state);
    const allowed: ToolCall[] = [];
    const blocked: ToolCall[] = [];

    for (const call of toolCalls) {
      if (allowedTools.has(call.name)) {
        allowed.push(call);
      } else {
        blocked.push(call);
      }
    }

    return { allowed, blocked };
  }

  /**
   * Gets all allowed tools for a state (including global tools)
   */
  private getAllowedTools(state: State): Set<string> {
    const tools = new Set<string>(this.manifest.fsm.global_allowed_tools);
    for (const tool of state.allowed_tools) {
      tools.add(tool);
    }
    // Always add internal tools
    tools.add('kb.search');
    tools.add('kb.open');
    tools.add('notes.write');
    tools.add('notes.read');
    return tools;
  }

  /**
   * Generates a constraint message for the model when blocking tools
   */
  generateConstraintMessage(stateId: string, blockedTools: string[]): string {
    const state = this.manifest.fsm.states.find((s) => s.id === stateId);
    const stateName = state?.name || stateId;
    const allowedTools = state ? Array.from(this.getAllowedTools(state)) : [];

    return `[POLICY GATE] The following tools are not allowed in the current state "${stateName}": ${blockedTools.join(', ')}. ` +
      `Allowed tools: ${allowedTools.length > 0 ? allowedTools.join(', ') : 'none'}. ` +
      `Please try again using only allowed tools.`;
  }
}
