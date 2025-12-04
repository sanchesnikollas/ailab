import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AgentManifestSchema } from 'ia-lab-agentkit';
import * as agentsService from '../services/agents.js';
import * as versionsService from '../services/versions.js';
import { authMiddleware, requireScope } from '../middleware/auth.js';

const agentsRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply auth to all routes
  fastify.addHook('preHandler', authMiddleware);

  // List agents
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          domain: { type: 'string' },
          tags: { type: 'string' },
          limit: { type: 'integer', default: 20 },
          offset: { type: 'integer', default: 0 },
        },
      },
    },
    handler: async (request, reply) => {
      const query = request.query as {
        domain?: string;
        tags?: string;
        limit?: number;
        offset?: number;
      };

      const result = await agentsService.listAgents({
        domain: query.domain,
        tags: query.tags?.split(','),
        limit: query.limit,
        offset: query.offset,
      });

      return result;
    },
  });

  // Get agent by ID or slug
  fastify.get('/:idOrSlug', {
    handler: async (request, reply) => {
      const { idOrSlug } = request.params as { idOrSlug: string };

      // Try as UUID first, then as slug
      let agent = await agentsService.getAgentById(idOrSlug);
      if (!agent) {
        agent = await agentsService.getAgentBySlug(idOrSlug);
      }

      if (!agent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      return agent;
    },
  });

  // Create agent
  fastify.post('/', {
    preHandler: requireScope('agents:write'),
    handler: async (request, reply) => {
      try {
        const body = request.body as {
          name: string;
          slug: string;
          domain: string;
          manifest: unknown;
        };

        const agent = await agentsService.createAgent({
          name: body.name,
          slug: body.slug,
          domain: body.domain,
          owner: request.user!.owner,
          manifest: body.manifest as any,
        });

        return reply.status(201).send(agent);
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({
          error: 'Bad Request',
          message: error instanceof Error ? error.message : 'Invalid manifest',
        });
      }
    },
  });

  // Update agent
  fastify.put('/:id', {
    preHandler: requireScope('agents:write'),
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { manifest: unknown };

      try {
        const agent = await agentsService.updateAgent(id, body.manifest as any);
        return agent;
      } catch (error) {
        if ((error as Error).message?.includes('not found')) {
          return reply.status(404).send({ error: 'Agent not found' });
        }
        throw error;
      }
    },
  });

  // Delete agent
  fastify.delete('/:id', {
    preHandler: requireScope('agents:delete'),
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      await agentsService.deleteAgent(id);
      return reply.status(204).send();
    },
  });

  // Create version
  fastify.post('/:id/versions', {
    preHandler: requireScope('agents:write'),
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        version: string;
        changelog?: string;
        manifest: unknown;
      };

      try {
        const version = await versionsService.createVersion({
          agentId: id,
          version: body.version,
          changelog: body.changelog,
          manifest: body.manifest as any,
          createdBy: request.user!.owner,
        });

        return reply.status(201).send(version);
      } catch (error) {
        if ((error as Error).message?.includes('not found')) {
          return reply.status(404).send({ error: 'Agent not found' });
        }
        if ((error as Error).message?.includes('already exists')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: (error as Error).message,
          });
        }
        throw error;
      }
    },
  });

  // List versions
  fastify.get('/:id/versions', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const versions = await versionsService.listVersions(id);
      return versions;
    },
  });

  // Get specific version
  fastify.get('/:id/versions/:version', {
    handler: async (request, reply) => {
      const { id, version } = request.params as { id: string; version: string };

      // If version is "latest", get latest approved
      if (version === 'latest') {
        const latest = await versionsService.getLatestApprovedVersion(id);
        if (!latest) {
          return reply.status(404).send({ error: 'No approved version found' });
        }
        return latest;
      }

      const versions = await versionsService.listVersions(id);
      const found = versions.find((v) => v.version === version);

      if (!found) {
        return reply.status(404).send({ error: 'Version not found' });
      }

      return found;
    },
  });
};

export default agentsRoutes;
