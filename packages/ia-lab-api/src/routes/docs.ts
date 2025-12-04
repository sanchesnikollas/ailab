import type { FastifyPluginAsync } from 'fastify';
import * as documentsService from '../services/documents.js';
import { authMiddleware } from '../middleware/auth.js';

const docsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware);

  // Get document by slug
  fastify.get('/:slug', {
    handler: async (request, reply) => {
      const { slug } = request.params as { slug: string };

      const doc = await documentsService.getDocumentBySlug(slug);
      if (!doc) {
        return reply.status(404).send({ error: 'Document not found' });
      }

      return doc;
    },
  });

  // Get document content only (for rendering)
  fastify.get('/:slug/content', {
    handler: async (request, reply) => {
      const { slug } = request.params as { slug: string };

      const doc = await documentsService.getDocumentBySlug(slug);
      if (!doc) {
        return reply.status(404).send({ error: 'Document not found' });
      }

      return {
        slug: doc.slug,
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata,
      };
    },
  });

  // Get document metadata only
  fastify.get('/:slug/meta', {
    handler: async (request, reply) => {
      const { slug } = request.params as { slug: string };

      const doc = await documentsService.getDocumentBySlug(slug);
      if (!doc) {
        return reply.status(404).send({ error: 'Document not found' });
      }

      return {
        slug: doc.slug,
        title: doc.title,
        source: doc.source,
        source_url: doc.source_url,
        tags: doc.tags,
        detected_domain: doc.detected_domain,
        has_fsm: doc.has_fsm,
        is_flow_multiagent: doc.is_flow_multiagent,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      };
    },
  });
};

export default docsRoutes;
