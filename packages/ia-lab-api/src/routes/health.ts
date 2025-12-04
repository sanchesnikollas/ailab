import type { FastifyPluginAsync } from 'fastify';
import { checkDatabaseHealth } from '../db/pool.js';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check endpoint
  fastify.get('/health', {
    handler: async (request, reply) => {
      const dbHealthy = await checkDatabaseHealth();

      const status = dbHealthy ? 'healthy' : 'unhealthy';
      const statusCode = dbHealthy ? 200 : 503;

      return reply.status(statusCode).send({
        status,
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'up' : 'down',
          redis: dbHealthy ? 'up' : 'down',
        },
      });
    },
  });

  // Readiness check
  fastify.get('/ready', {
    handler: async (request, reply) => {
      const dbHealthy = await checkDatabaseHealth();

      if (!dbHealthy) {
        return reply.status(503).send({
          ready: false,
          reason: 'Database not available',
        });
      }

      return { ready: true };
    },
  });

  // Liveness check
  fastify.get('/live', {
    handler: async () => {
      return { alive: true };
    },
  });
};

export default healthRoutes;
