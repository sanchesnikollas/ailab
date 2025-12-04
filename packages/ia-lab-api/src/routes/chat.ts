import { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { chatCompletion, streamChatCompletion, calculateCost, AgentMessage, AgentTool } from '../services/openai.js';
import { createRun, addRunStep, completeRun, DatabaseMemoryStore } from '../services/runs.js';

interface AgentManifest {
  metadata: {
    id: string;
    name: string;
    description: string;
  };
  prd: {
    purpose: string;
    persona: {
      tone: string;
      personality: string;
      language: string;
    };
  };
  fsm: {
    initial: string;
    states: Record<string, {
      name: string;
      description: string;
      prompt: string;
      transitions: Array<{
        target: string;
        condition: string;
      }>;
    }>;
  };
  tools?: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
  deployments: {
    environments: {
      development: {
        provider: string;
        model: string;
        maxTokens: number;
      };
      production: {
        provider: string;
        model: string;
        maxTokens: number;
      };
    };
    currentEnvironment: string;
  };
}

interface ChatSession {
  id: string;
  agentId: string;
  currentState: string;
  messages: AgentMessage[];
  metadata: Record<string, unknown>;
}

// In-memory session store (use Redis in production)
const sessions = new Map<string, ChatSession>();

// Load manifest from file
async function loadManifest(agentId: string): Promise<AgentManifest | null> {
  const manifestsDir = path.resolve(process.cwd(), '..', '..', 'manifests');

  try {
    const files = await fs.readdir(manifestsDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(manifestsDir, file), 'utf-8');
        const manifest = JSON.parse(content) as AgentManifest;
        if (manifest.metadata.id === agentId) {
          return manifest;
        }
      }
    }
  } catch (error) {
    console.error('Error loading manifest:', error);
  }

  return null;
}

// Build system prompt from manifest and current state
function buildSystemPrompt(manifest: AgentManifest, state: string): string {
  const stateConfig = manifest.fsm.states[state];
  if (!stateConfig) {
    throw new Error(`State ${state} not found in manifest`);
  }

  const sections = [
    `# ${manifest.metadata.name}`,
    '',
    `## Identidade`,
    `Voce e ${manifest.metadata.name}.`,
    `${manifest.metadata.description}`,
    '',
    `## Proposito`,
    manifest.prd.purpose,
    '',
    `## Persona`,
    `- Tom: ${manifest.prd.persona.tone}`,
    `- Personalidade: ${manifest.prd.persona.personality}`,
    `- Idioma: ${manifest.prd.persona.language}`,
    '',
    `## Estado Atual: ${stateConfig.name}`,
    stateConfig.description,
    '',
    `## Instrucoes`,
    stateConfig.prompt,
  ];

  // Add transitions info
  if (stateConfig.transitions.length > 0) {
    sections.push('', '## Transicoes Possiveis');
    for (const t of stateConfig.transitions) {
      sections.push(`- Quando: "${t.condition}" -> Ir para: ${t.target}`);
    }
  }

  return sections.join('\n');
}

// Convert manifest tools to OpenAI format
function getAgentTools(manifest: AgentManifest): AgentTool[] {
  if (!manifest.tools) return [];

  return manifest.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  // List available agents
  fastify.get('/agents', async (request, reply) => {
    const manifestsDir = path.resolve(process.cwd(), '..', '..', 'manifests');

    try {
      const files = await fs.readdir(manifestsDir);
      const agents = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(manifestsDir, file), 'utf-8');
          const manifest = JSON.parse(content) as AgentManifest;
          agents.push({
            id: manifest.metadata.id,
            name: manifest.metadata.name,
            description: manifest.metadata.description,
            category: (manifest.metadata as Record<string, unknown>).category || 'General',
            tags: (manifest.metadata as Record<string, unknown>).tags || [],
          });
        }
      }

      return { agents };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to load agents' });
    }
  });

  // Get agent details
  fastify.get<{ Params: { agentId: string } }>('/agents/:agentId', async (request, reply) => {
    const { agentId } = request.params;
    const manifest = await loadManifest(agentId);

    if (!manifest) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    return {
      id: manifest.metadata.id,
      name: manifest.metadata.name,
      description: manifest.metadata.description,
      purpose: manifest.prd.purpose,
      persona: manifest.prd.persona,
      states: Object.keys(manifest.fsm.states),
      initialState: manifest.fsm.initial,
      tools: manifest.tools?.map((t) => ({ name: t.name, description: t.description })) || [],
    };
  });

  // Start a new chat session
  fastify.post<{
    Body: { agentId: string; userId?: string };
  }>('/sessions', async (request, reply) => {
    const { agentId, userId } = request.body;

    const manifest = await loadManifest(agentId);
    if (!manifest) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    const sessionId = uuidv4();
    const systemPrompt = buildSystemPrompt(manifest, manifest.fsm.initial);

    const session: ChatSession = {
      id: sessionId,
      agentId,
      currentState: manifest.fsm.initial,
      messages: [{ role: 'system', content: systemPrompt }],
      metadata: { userId },
    };

    sessions.set(sessionId, session);

    return {
      sessionId,
      agentId,
      currentState: manifest.fsm.initial,
      agentName: manifest.metadata.name,
    };
  });

  // Send message to chat
  fastify.post<{
    Body: { sessionId: string; message: string };
  }>('/chat', async (request, reply) => {
    const { sessionId, message } = request.body;

    const session = sessions.get(sessionId);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const manifest = await loadManifest(session.agentId);
    if (!manifest) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    // Add user message
    session.messages.push({ role: 'user', content: message });

    // Get deployment config
    const env = manifest.deployments.currentEnvironment as 'development' | 'production';
    const config = manifest.deployments.environments[env];

    // Create run record
    const run = await createRun({
      agentId: session.agentId,
      agentVersion: '1.0.0',
      sessionId,
      userId: session.metadata.userId as string | undefined,
    });

    const startTime = Date.now();

    try {
      // Call OpenAI
      const result = await chatCompletion(session.messages, {
        model: config.model,
        maxTokens: config.maxTokens,
        tools: getAgentTools(manifest),
      });

      const latencyMs = Date.now() - startTime;

      // Add assistant response to history
      session.messages.push({ role: 'assistant', content: result.content });

      // Record step
      await addRunStep({
        run_id: run.id,
        step_number: 1,
        state: session.currentState,
        input: message,
        output: result.content,
        tool_calls: result.toolCalls,
        tokens_prompt: result.usage.promptTokens,
        tokens_completion: result.usage.completionTokens,
        tokens_total: result.usage.totalTokens,
        cost_estimate: calculateCost(config.model, result.usage.promptTokens, result.usage.completionTokens),
        latency_ms: latencyMs,
      });

      // Check for state transition (simplified - in production use proper NLU)
      const currentStateConfig = manifest.fsm.states[session.currentState];
      for (const transition of currentStateConfig.transitions) {
        // Simple keyword matching for demo
        const combined = (message + ' ' + result.content).toLowerCase();
        const keywords = transition.condition.toLowerCase().split(' ');
        const matches = keywords.some((kw) => combined.includes(kw));

        if (matches && manifest.fsm.states[transition.target]) {
          session.currentState = transition.target;
          // Update system prompt for new state
          const newSystemPrompt = buildSystemPrompt(manifest, session.currentState);
          session.messages[0] = { role: 'system', content: newSystemPrompt };
          break;
        }
      }

      await completeRun(run.id, 'completed');

      return {
        sessionId,
        response: result.content,
        currentState: session.currentState,
        toolCalls: result.toolCalls,
        usage: result.usage,
        runId: run.id,
      };
    } catch (error) {
      await completeRun(run.id, 'failed', (error as Error).message);
      throw error;
    }
  });

  // Stream chat response
  fastify.post<{
    Body: { sessionId: string; message: string };
  }>('/chat/stream', async (request, reply) => {
    const { sessionId, message } = request.body;

    const session = sessions.get(sessionId);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const manifest = await loadManifest(session.agentId);
    if (!manifest) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    // Add user message
    session.messages.push({ role: 'user', content: message });

    // Get deployment config
    const env = manifest.deployments.currentEnvironment as 'development' | 'production';
    const config = manifest.deployments.environments[env];

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    let fullContent = '';

    try {
      const stream = streamChatCompletion(session.messages, {
        model: config.model,
        maxTokens: config.maxTokens,
        tools: getAgentTools(manifest),
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content') {
          fullContent += chunk.data as string;
          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        } else if (chunk.type === 'tool_call') {
          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        } else if (chunk.type === 'done') {
          // Add to history
          session.messages.push({ role: 'assistant', content: fullContent });
          reply.raw.write(`data: ${JSON.stringify({ type: 'done', data: { content: fullContent } })}\n\n`);
        }
      }
    } catch (error) {
      reply.raw.write(`data: ${JSON.stringify({ type: 'error', data: { message: (error as Error).message } })}\n\n`);
    }

    reply.raw.end();
  });

  // Get session history
  fastify.get<{ Params: { sessionId: string } }>('/sessions/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;

    const session = sessions.get(sessionId);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    return {
      sessionId: session.id,
      agentId: session.agentId,
      currentState: session.currentState,
      messages: session.messages.filter((m) => m.role !== 'system').map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };
  });

  // End session
  fastify.delete<{ Params: { sessionId: string } }>('/sessions/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;

    if (!sessions.has(sessionId)) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    sessions.delete(sessionId);

    return { success: true };
  });
};

export default chatRoutes;
