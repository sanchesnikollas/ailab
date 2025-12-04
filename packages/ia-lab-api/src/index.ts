import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../..', '.env') });

// Import routes
import healthRoutes from './routes/health.js';
import agentsRoutes from './routes/agents.js';
import runsRoutes from './routes/runs.js';
import catalogRoutes from './routes/catalog.js';
import docsRoutes from './routes/docs.js';
import ingestRoutes from './routes/ingest.js';
import chatRoutes from './routes/chat.js';

// Import database
import { closeDatabaseConnections } from './db/pool.js';

const PORT = parseInt(process.env.API_PORT || '3001', 10);
const HOST = process.env.API_HOST || '0.0.0.0';

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'IA Lab API',
        description: 'API for managing AI agents, versions, runs, and documentation',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
          },
        },
      },
      security: [{ apiKey: [] }],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(agentsRoutes, { prefix: '/agents' });
  await fastify.register(runsRoutes, { prefix: '/runs' });
  await fastify.register(catalogRoutes, { prefix: '/catalog' });
  await fastify.register(docsRoutes, { prefix: '/docs' });
  await fastify.register(ingestRoutes, { prefix: '/ingest' });
  await fastify.register(chatRoutes, { prefix: '/chat' });

  // Root route
  fastify.get('/', async () => {
    return {
      name: 'IA Lab API',
      version: '1.0.0',
      docs: '/docs',
      health: '/health',
    };
  });

  return fastify;
}

async function start() {
  const app = await buildApp();

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info('Shutting down...');
    await app.close();
    await closeDatabaseConnections();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`IA Lab API running on http://${HOST}:${PORT}`);
    app.log.info(`API Documentation: http://${HOST}:${PORT}/docs`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
