import type { AgentManifest, State, Transition } from '../schemas/index.js';
import type { ChatMessage, ToolCall, ToolResult } from './types.js';

export interface StateTransitionResult {
  transitioned: boolean;
  fromState: string;
  toState: string;
  trigger?: Transition;
}

/**
 * State Machine - manages state transitions based on FSM definition
 */
export class StateMachine {
  private manifest: AgentManifest;
  private currentStateId: string;

  constructor(manifest: AgentManifest, initialState?: string) {
    this.manifest = manifest;
    this.currentStateId = initialState || manifest.fsm.initial_state;

    // Validate initial state exists
    if (!this.getState(this.currentStateId)) {
      throw new Error(`Initial state '${this.currentStateId}' not found in manifest`);
    }
  }

  get currentState(): State {
    const state = this.getState(this.currentStateId);
    if (!state) {
      throw new Error(`Current state '${this.currentStateId}' not found`);
    }
    return state;
  }

  get currentStateIdentifier(): string {
    return this.currentStateId;
  }

  /**
   * Evaluates if a transition should occur based on context
   */
  evaluateTransitions(context: TransitionContext): StateTransitionResult {
    const state = this.currentState;
    const fromState = this.currentStateId;

    // Sort transitions by priority (higher first)
    const sortedTransitions = [...state.transitions].sort((a, b) => b.priority - a.priority);

    for (const transition of sortedTransitions) {
      if (this.shouldTransition(transition, context)) {
        this.currentStateId = transition.to_state;
        return {
          transitioned: true,
          fromState,
          toState: transition.to_state,
          trigger: transition,
        };
      }
    }

    return {
      transitioned: false,
      fromState,
      toState: fromState,
    };
  }

  /**
   * Force transition to a specific state
   */
  transitionTo(stateId: string): void {
    const state = this.getState(stateId);
    if (!state) {
      throw new Error(`Cannot transition to unknown state '${stateId}'`);
    }
    this.currentStateId = stateId;
  }

  /**
   * Go to fallback state if defined
   */
  goToFallback(): boolean {
    if (this.manifest.fsm.fallback_state) {
      this.currentStateId = this.manifest.fsm.fallback_state;
      return true;
    }
    return false;
  }

  /**
   * Check if current state is terminal
   */
  isTerminal(): boolean {
    return this.currentState.is_terminal;
  }

  private getState(stateId: string): State | undefined {
    return this.manifest.fsm.states.find((s) => s.id === stateId);
  }

  private shouldTransition(transition: Transition, context: TransitionContext): boolean {
    const { type, value } = transition.when;

    switch (type) {
      case 'intent':
        return this.matchesIntent(value, context);
      case 'condition':
        return this.evaluateCondition(value, context);
      case 'tool_result':
        return this.matchesToolResult(value, context);
      case 'timeout':
        return this.checkTimeout(value, context);
      default:
        return false;
    }
  }

  private matchesIntent(intent: string, context: TransitionContext): boolean {
    // Simple keyword matching - in production would use NLU
    const message = context.lastUserMessage?.toLowerCase() || '';
    const keywords = intent.toLowerCase().split('|');
    return keywords.some((kw) => message.includes(kw.trim()));
  }

  private evaluateCondition(condition: string, context: TransitionContext): boolean {
    // Simple condition evaluation - in production would use expression parser
    // Format: "variable operator value"
    const parts = condition.split(/\s+(==|!=|>|<|>=|<=|contains)\s+/);
    if (parts.length !== 3) return false;

    const [variable, operator, value] = parts;
    const actualValue = this.resolveVariable(variable, context);

    switch (operator) {
      case '==':
        return String(actualValue) === value;
      case '!=':
        return String(actualValue) !== value;
      case '>':
        return Number(actualValue) > Number(value);
      case '<':
        return Number(actualValue) < Number(value);
      case '>=':
        return Number(actualValue) >= Number(value);
      case '<=':
        return Number(actualValue) <= Number(value);
      case 'contains':
        return String(actualValue).includes(value);
      default:
        return false;
    }
  }

  private matchesToolResult(pattern: string, context: TransitionContext): boolean {
    if (!context.lastToolResult) return false;

    // Format: "toolName:resultPattern"
    const [toolName, resultPattern] = pattern.split(':');

    const matchingResult = context.lastToolResult.find(
      (r) => r.toolName === toolName
    );

    if (!matchingResult) return false;

    if (resultPattern === 'success') {
      return matchingResult.result.success;
    }
    if (resultPattern === 'error') {
      return !matchingResult.result.success;
    }

    // Check if output contains pattern
    const output = JSON.stringify(matchingResult.result.output);
    return output.includes(resultPattern);
  }

  private checkTimeout(value: string, context: TransitionContext): boolean {
    const timeoutMs = parseInt(value, 10);
    if (isNaN(timeoutMs)) return false;

    const elapsed = Date.now() - context.stateEnteredAt.getTime();
    return elapsed >= timeoutMs;
  }

  private resolveVariable(variable: string, context: TransitionContext): unknown {
    const parts = variable.split('.');

    if (parts[0] === 'metadata') {
      return context.metadata?.[parts.slice(1).join('.')];
    }
    if (parts[0] === 'iteration') {
      return context.iteration;
    }
    if (parts[0] === 'tool_calls_count') {
      return context.toolCallsCount;
    }

    return context.metadata?.[variable];
  }
}

export interface TransitionContext {
  lastUserMessage?: string;
  lastAssistantMessage?: string;
  lastToolResult?: Array<{ toolName: string; result: ToolResult }>;
  metadata?: Record<string, unknown>;
  iteration: number;
  toolCallsCount: number;
  stateEnteredAt: Date;
}
