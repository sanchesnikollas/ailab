import { v4 as uuidv4 } from 'uuid';
import type { AgentManifest } from '../schemas/index.js';
import { compilePrompt, type CompiledPrompt } from '../compiler/index.js';
import { PolicyGate } from './policy-gate.js';
import { StateMachine, type TransitionContext } from './state-machine.js';
import type {
  RuntimeConfig,
  ChatMessage,
  ToolCall,
  ToolResult,
  Run,
  RunStep,
  SessionState,
} from './types.js';

export interface AgentRuntimeOptions {
  maxIterationsPerState?: number;
  maxTotalIterations?: number;
  enablePolicyGate?: boolean;
  costPerToken?: { prompt: number; completion: number };
}

const DEFAULT_OPTIONS: AgentRuntimeOptions = {
  maxIterationsPerState: 10,
  maxTotalIterations: 50,
  enablePolicyGate: true,
  costPerToken: { prompt: 0.00001, completion: 0.00003 },
};

/**
 * AgentRuntime - executes agent conversations with FSM-based state management
 */
export class AgentRuntime {
  private config: RuntimeConfig;
  private options: AgentRuntimeOptions;
  private stateMachine: StateMachine;
  private policyGate: PolicyGate;
  private currentRun: Run | null = null;
  private sessionState: SessionState | null = null;

  constructor(config: RuntimeConfig, options: AgentRuntimeOptions = {}) {
    this.config = config;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.stateMachine = new StateMachine(config.manifest);
    this.policyGate = new PolicyGate(config.manifest);
  }

  get manifest(): AgentManifest {
    return this.config.manifest;
  }

  get currentState(): string {
    return this.stateMachine.currentStateIdentifier;
  }

  /**
   * Initialize or restore session
   */
  async initialize(): Promise<void> {
    const existingState = await this.config.memoryStore.getSessionState(this.config.sessionId);

    if (existingState) {
      this.sessionState = existingState;
      this.stateMachine.transitionTo(existingState.currentState);
    } else {
      this.sessionState = {
        currentState: this.stateMachine.currentStateIdentifier,
        history: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.config.memoryStore.setSessionState(this.config.sessionId, this.sessionState);
    }
  }

  /**
   * Process a user message and return the agent's response
   */
  async processMessage(userMessage: string): Promise<AgentResponse> {
    const startTime = Date.now();

    // Initialize run
    this.currentRun = {
      id: uuidv4(),
      agentId: this.config.manifest.metadata.id,
      agentVersion: this.config.manifest.versions[0]?.version || '0.0.1',
      sessionId: this.config.sessionId,
      userId: this.config.userId,
      status: 'running',
      steps: [],
      totalTokens: 0,
      totalCost: 0,
      totalLatencyMs: 0,
      createdAt: new Date(),
    };

    // Add user message to history
    this.sessionState!.history.push({
      role: 'user',
      content: userMessage,
    });

    let iteration = 0;
    let stateIteration = 0;
    let stateEnteredAt = new Date();
    let finalResponse: ChatMessage | null = null;

    try {
      while (iteration < this.options.maxTotalIterations!) {
        const stepStartTime = Date.now();
        iteration++;
        stateIteration++;

        // Check state iteration limit
        if (stateIteration > this.options.maxIterationsPerState!) {
          if (this.stateMachine.goToFallback()) {
            stateIteration = 0;
            stateEnteredAt = new Date();
            continue;
          }
          throw new Error(`Max iterations (${this.options.maxIterationsPerState}) reached for state`);
        }

        // Compile prompt for current state
        const compiled = compilePrompt(this.config.manifest, this.currentState);

        // Build messages array
        const messages = this.buildMessages(compiled);

        // Call model
        const response = await this.config.modelProvider.chat({
          messages,
          tools: compiled.tools,
          tool_choice: this.config.modelProvider.supportsToolChoice
            ? compiled.tool_choice_policy
            : undefined,
        });

        // Track tokens
        const tokens = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        this.currentRun.totalTokens += tokens.total_tokens;
        this.currentRun.totalCost +=
          tokens.prompt_tokens * this.options.costPerToken!.prompt +
          tokens.completion_tokens * this.options.costPerToken!.completion;

        // Handle tool calls
        let toolCalls = response.message.tool_calls || [];
        let toolResults: Array<{ toolName: string; result: ToolResult }> = [];

        if (toolCalls.length > 0) {
          // Apply policy gate if provider doesn't support tool_choice
          if (this.options.enablePolicyGate && !this.config.modelProvider.supportsToolChoice) {
            const gateResult = this.policyGate.validate(this.currentState, toolCalls);
            if (!gateResult.allowed) {
              // Add constraint message and retry
              this.sessionState!.history.push({
                role: 'assistant',
                content: '',
                tool_calls: toolCalls,
              });
              this.sessionState!.history.push({
                role: 'user',
                content: this.policyGate.generateConstraintMessage(
                  this.currentState,
                  gateResult.blockedTools
                ),
              });
              continue;
            }
          }

          // Execute allowed tools
          toolResults = await this.executeTools(toolCalls);

          // Add tool results to history
          this.sessionState!.history.push({
            role: 'assistant',
            content: response.message.content || '',
            tool_calls: toolCalls,
          });

          for (const { toolName, result } of toolResults) {
            this.sessionState!.history.push({
              role: 'tool',
              content: JSON.stringify(result.output),
              tool_call_id: toolCalls.find((tc) => tc.name === toolName)?.id,
            });
          }
        } else {
          // No tool calls - add assistant response
          this.sessionState!.history.push(response.message);
          finalResponse = response.message;
        }

        // Record step
        const step: RunStep = {
          id: uuidv4(),
          runId: this.currentRun.id,
          stepNumber: iteration,
          state: this.currentState,
          input: iteration === 1 ? userMessage : undefined,
          output: response.message.content || undefined,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          toolResults: toolResults.length > 0 ? toolResults.map((r) => r.result) : undefined,
          tokens: {
            prompt: tokens.prompt_tokens,
            completion: tokens.completion_tokens,
            total: tokens.total_tokens,
          },
          costEstimate:
            tokens.prompt_tokens * this.options.costPerToken!.prompt +
            tokens.completion_tokens * this.options.costPerToken!.completion,
          latencyMs: Date.now() - stepStartTime,
          createdAt: new Date(),
        };
        this.currentRun.steps.push(step);

        // Evaluate transitions
        const transitionContext: TransitionContext = {
          lastUserMessage: userMessage,
          lastAssistantMessage: response.message.content || undefined,
          lastToolResult: toolResults.length > 0 ? toolResults : undefined,
          metadata: this.sessionState!.metadata,
          iteration: stateIteration,
          toolCallsCount: toolCalls.length,
          stateEnteredAt,
        };

        const transition = this.stateMachine.evaluateTransitions(transitionContext);
        if (transition.transitioned) {
          stateIteration = 0;
          stateEnteredAt = new Date();
          this.sessionState!.currentState = transition.toState;
        }

        // Check if we're done
        if (response.finish_reason === 'stop' && toolCalls.length === 0) {
          break;
        }

        // Check if terminal state
        if (this.stateMachine.isTerminal() && finalResponse) {
          break;
        }
      }

      // Finalize run
      this.currentRun.status = 'completed';
      this.currentRun.completedAt = new Date();
      this.currentRun.totalLatencyMs = Date.now() - startTime;

      // Save session state
      this.sessionState!.updatedAt = new Date();
      await this.config.memoryStore.setSessionState(this.config.sessionId, this.sessionState!);

      return {
        message: finalResponse?.content || '',
        run: this.currentRun,
        state: this.currentState,
        isTerminal: this.stateMachine.isTerminal(),
      };
    } catch (error) {
      this.currentRun.status = 'failed';
      this.currentRun.error = error instanceof Error ? error.message : String(error);
      this.currentRun.completedAt = new Date();
      this.currentRun.totalLatencyMs = Date.now() - startTime;

      throw error;
    }
  }

  private buildMessages(compiled: CompiledPrompt): ChatMessage[] {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: compiled.system,
      },
    ];

    // Add conversation history (limited to avoid context overflow)
    const maxHistory = 20;
    const history = this.sessionState!.history.slice(-maxHistory);
    messages.push(...history);

    return messages;
  }

  private async executeTools(
    toolCalls: ToolCall[]
  ): Promise<Array<{ toolName: string; result: ToolResult }>> {
    const results: Array<{ toolName: string; result: ToolResult }> = [];

    for (const call of toolCalls) {
      // Check if it's an internal tool
      if (this.isInternalTool(call.name)) {
        const result = await this.executeInternalTool(call);
        results.push({ toolName: call.name, result });
        continue;
      }

      // Find tool definition
      const toolDef = this.config.manifest.tools.tools.find((t) => t.name === call.name);
      if (!toolDef) {
        results.push({
          toolName: call.name,
          result: {
            success: false,
            output: null,
            error: `Tool '${call.name}' not found`,
          },
        });
        continue;
      }

      // Execute via tool executor
      const result = await this.config.toolExecutor.execute(toolDef, call.arguments);
      results.push({ toolName: call.name, result });
    }

    return results;
  }

  private isInternalTool(name: string): boolean {
    return ['kb.search', 'kb.open', 'notes.write', 'notes.read'].includes(name);
  }

  private async executeInternalTool(call: ToolCall): Promise<ToolResult> {
    const { name, arguments: args } = call;

    try {
      switch (name) {
        case 'kb.search':
          // TODO: Implement knowledge base search
          return {
            success: true,
            output: { results: [], message: 'KB search not yet implemented' },
          };

        case 'kb.open':
          // TODO: Implement document retrieval
          return {
            success: true,
            output: { content: '', message: 'KB open not yet implemented' },
          };

        case 'notes.write':
          await this.config.memoryStore.setLongTermMemory(
            'notes',
            args.path as string,
            args.content
          );
          return { success: true, output: { written: true } };

        case 'notes.read':
          const content = await this.config.memoryStore.getLongTermMemory(
            'notes',
            args.path as string
          );
          return { success: true, output: { content } };

        default:
          return {
            success: false,
            output: null,
            error: `Unknown internal tool: ${name}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export interface AgentResponse {
  message: string;
  run: Run;
  state: string;
  isTerminal: boolean;
}
