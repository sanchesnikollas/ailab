import type { AgentManifest, ToolDefinition } from '../schemas/index.js';

export interface RuntimeConfig {
  manifest: AgentManifest;
  sessionId: string;
  userId?: string;
  orgId?: string;
  modelProvider: ModelProvider;
  memoryStore: MemoryStore;
  toolExecutor: ToolExecutor;
}

export interface ModelProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  supportsToolChoice: boolean;
}

export interface ChatRequest {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  temperature?: number;
  max_tokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolExecutor {
  execute(tool: ToolDefinition, args: Record<string, unknown>): Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  output: unknown;
  error?: string;
}

export interface MemoryStore {
  getSessionState(sessionId: string): Promise<SessionState | null>;
  setSessionState(sessionId: string, state: SessionState): Promise<void>;
  getLongTermMemory(namespace: string, key: string): Promise<unknown>;
  setLongTermMemory(namespace: string, key: string, value: unknown, ttl?: number): Promise<void>;
}

export interface SessionState {
  currentState: string;
  history: ChatMessage[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RunStep {
  id: string;
  runId: string;
  stepNumber: number;
  state: string;
  input?: string;
  output?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  costEstimate?: number;
  latencyMs: number;
  createdAt: Date;
}

export interface Run {
  id: string;
  agentId: string;
  agentVersion: string;
  sessionId: string;
  userId?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: RunStep[];
  totalTokens: number;
  totalCost: number;
  totalLatencyMs: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}
