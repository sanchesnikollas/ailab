import type { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import * as runsService from '../services/runs.js';
import * as agentsService from '../services/agents.js';
import * as versionsService from '../services/versions.js';
import { authMiddleware, requireScope } from '../middleware/auth.js';

const runsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware);

  // Create new run
  fastify.post('/', {
    preHandler: requireScope('runs:write'),
    handler: async (request, reply) => {
      const body = request.body as {
        agent_id: string;
        session_id?: string;
        version?: string;
      };

      // Get agent
      const agent = await agentsService.getAgentById(body.agent_id);
      if (!agent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      // Get version
      let version = body.version;
      if (!version) {
        const latestVersion = await versionsService.getLatestApprovedVersion(body.agent_id);
        version = latestVersion?.version || '0.0.1';
      }

      const run = await runsService.createRun({
        agentId: body.agent_id,
        agentVersion: version,
        sessionId: body.session_id || uuidv4(),
        userId: request.user?.id,
      });

      return reply.status(201).send(run);
    },
  });

  // List runs
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          agent_id: { type: 'string' },
          session_id: { type: 'string' },
          status: { type: 'string' },
          limit: { type: 'integer', default: 20 },
          offset: { type: 'integer', default: 0 },
        },
      },
    },
    handler: async (request, reply) => {
      const query = request.query as {
        agent_id?: string;
        session_id?: string;
        status?: string;
        limit?: number;
        offset?: number;
      };

      const result = await runsService.listRuns({
        agentId: query.agent_id,
        sessionId: query.session_id,
        status: query.status,
        limit: query.limit,
        offset: query.offset,
      });

      return result;
    },
  });

  // Get run by ID
  fastify.get('/:id', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const run = await runsService.getRunById(id);
      if (!run) {
        return reply.status(404).send({ error: 'Run not found' });
      }

      return run;
    },
  });

  // Get run steps
  fastify.get('/:id/steps', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const run = await runsService.getRunById(id);
      if (!run) {
        return reply.status(404).send({ error: 'Run not found' });
      }

      return run.steps;
    },
  });

  // Cancel run
  fastify.post('/:id/cancel', {
    preHandler: requireScope('runs:write'),
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const run = await runsService.getRunById(id);
      if (!run) {
        return reply.status(404).send({ error: 'Run not found' });
      }

      if (run.status !== 'running') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Can only cancel running runs',
        });
      }

      await runsService.completeRun(id, 'cancelled');

      return { success: true };
    },
  });
};

export default runsRoutes;
