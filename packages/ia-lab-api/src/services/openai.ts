import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Lazy initialization of OpenAI client
let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OPENAI_API_KEY not configured. Please set it in your .env file.');
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ChatCompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: AgentTool[];
}

export interface ChatCompletionResult {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

/**
 * Send a chat completion request to OpenAI
 */
export async function chatCompletion(
  messages: AgentMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResult> {
  const {
    model = 'gpt-4o',
    maxTokens = 4096,
    temperature = 0.7,
    tools,
  } = options;

  const openaiMessages: ChatCompletionMessageParam[] = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const requestOptions: OpenAI.ChatCompletionCreateParams = {
    model,
    messages: openaiMessages,
    max_tokens: maxTokens,
    temperature,
  };

  // Add tools if provided
  if (tools && tools.length > 0) {
    requestOptions.tools = tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
    requestOptions.tool_choice = 'auto';
  }

  const response = await getOpenAIClient().chat.completions.create(requestOptions);

  const choice = response.choices[0];
  const toolCalls = choice.message.tool_calls?.map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments),
  }));

  return {
    content: choice.message.content || '',
    toolCalls,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    finishReason: choice.finish_reason,
  };
}

/**
 * Stream a chat completion response
 */
export async function* streamChatCompletion(
  messages: AgentMessage[],
  options: ChatCompletionOptions = {}
): AsyncGenerator<{ type: 'content' | 'tool_call' | 'done'; data: unknown }> {
  const {
    model = 'gpt-4o',
    maxTokens = 4096,
    temperature = 0.7,
    tools,
  } = options;

  const openaiMessages: ChatCompletionMessageParam[] = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const requestOptions: OpenAI.ChatCompletionCreateParams = {
    model,
    messages: openaiMessages,
    max_tokens: maxTokens,
    temperature,
    stream: true,
  };

  if (tools && tools.length > 0) {
    requestOptions.tools = tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
    requestOptions.tool_choice = 'auto';
  }

  const stream = await getOpenAIClient().chat.completions.create(requestOptions);

  let currentToolCall: { id: string; name: string; arguments: string } | null = null;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      yield { type: 'content', data: delta.content };
    }

    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        if (tc.id) {
          // New tool call starting
          if (currentToolCall) {
            yield {
              type: 'tool_call',
              data: {
                id: currentToolCall.id,
                name: currentToolCall.name,
                arguments: JSON.parse(currentToolCall.arguments || '{}'),
              },
            };
          }
          currentToolCall = {
            id: tc.id,
            name: tc.function?.name || '',
            arguments: tc.function?.arguments || '',
          };
        } else if (currentToolCall) {
          // Continuing tool call arguments
          if (tc.function?.name) {
            currentToolCall.name += tc.function.name;
          }
          if (tc.function?.arguments) {
            currentToolCall.arguments += tc.function.arguments;
          }
        }
      }
    }

    if (chunk.choices[0]?.finish_reason) {
      // Emit final tool call if any
      if (currentToolCall) {
        yield {
          type: 'tool_call',
          data: {
            id: currentToolCall.id,
            name: currentToolCall.name,
            arguments: JSON.parse(currentToolCall.arguments || '{}'),
          },
        };
      }
      yield { type: 'done', data: { finishReason: chunk.choices[0].finish_reason } };
    }
  }
}

/**
 * Calculate cost estimate based on model and tokens
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Pricing per 1K tokens (as of 2024)
  const pricing: Record<string, { prompt: number; completion: number }> = {
    'gpt-4o': { prompt: 0.005, completion: 0.015 },
    'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
    'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
    'gpt-4': { prompt: 0.03, completion: 0.06 },
    'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  };

  const modelPricing = pricing[model] || pricing['gpt-4o'];

  return (
    (promptTokens / 1000) * modelPricing.prompt +
    (completionTokens / 1000) * modelPricing.completion
  );
}

export { getOpenAIClient };
