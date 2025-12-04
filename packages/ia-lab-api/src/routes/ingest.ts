import type { FastifyPluginAsync } from 'fastify';
import * as ingestService from '../services/ingest.js';
import { authMiddleware, requireScope } from '../middleware/auth.js';

const ingestRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware);

  // Trigger PrototipeAI ingest
  fastify.post('/prototipe', {
    preHandler: requireScope('ingest:write'),
    handler: async (request, reply) => {
      const job = await ingestService.createIngestJob('prototipeai');

      // Start the ingest process (async)
      ingestService.runPrototipeIngest(job.id).catch((error) => {
        request.log.error(error, 'Ingest job failed');
      });

      return reply.status(202).send({
        job_id: job.id,
        status: 'pending',
        message: 'Ingest job created. Run "pnpm ingest:prototipe" to process.',
      });
    },
  });

  // Get ingest job status
  fastify.get('/jobs/:id', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const job = await ingestService.getIngestJob(id);
      if (!job) {
        return reply.status(404).send({ error: 'Job not found' });
      }

      return job;
    },
  });

  // List ingest jobs
  fastify.get('/jobs', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          status: { type: 'string' },
          limit: { type: 'integer', default: 20 },
        },
      },
    },
    handler: async (request, reply) => {
      const query = request.query as {
        source?: string;
        status?: string;
        limit?: number;
      };

      const jobs = await ingestService.listIngestJobs(query);
      return jobs;
    },
  });
};

export default ingestRoutes;
