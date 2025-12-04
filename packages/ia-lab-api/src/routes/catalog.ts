import type { FastifyPluginAsync } from 'fastify';
import * as documentsService from '../services/documents.js';
import { authMiddleware } from '../middleware/auth.js';

const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware);

  // Get catalog
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          domain: { type: 'string' },
          has_fsm: { type: 'boolean' },
          is_multiagent: { type: 'boolean' },
          tags: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const query = request.query as {
        domain?: string;
        has_fsm?: boolean;
        is_multiagent?: boolean;
        tags?: string;
      };

      const catalog = await documentsService.getCatalog({
        domain: query.domain,
        hasFsm: query.has_fsm,
        isMultiagent: query.is_multiagent,
        tags: query.tags?.split(','),
      });

      return {
        total: catalog.length,
        entries: catalog,
      };
    },
  });

  // Get domain stats
  fastify.get('/stats', {
    handler: async (request, reply) => {
      const stats = await documentsService.getDomainStats();
      return stats;
    },
  });

  // Search catalog
  fastify.get('/search', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          limit: { type: 'integer', default: 10 },
        },
        required: ['q'],
      },
    },
    handler: async (request, reply) => {
      const { q, limit } = request.query as { q: string; limit?: number };

      const results = await documentsService.searchDocuments(q, limit);

      return {
        query: q,
        total: results.length,
        results,
      };
    },
  });
};

export default catalogRoutes;
