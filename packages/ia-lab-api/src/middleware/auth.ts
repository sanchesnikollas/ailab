import type { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';
import { pgPool } from '../db/pool.js';

// TODO: Implement proper SSO/RBAC authentication
// This is a stub implementation using API keys

export interface AuthUser {
  id: string;
  name: string;
  owner: string;
  scopes: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

/**
 * API Key authentication middleware
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = request.headers['x-api-key'] as string ||
    request.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    // Development mode: allow requests without auth
    if (process.env.NODE_ENV === 'development') {
      request.user = {
        id: 'dev-user',
        name: 'Development User',
        owner: 'dev',
        scopes: ['*'],
      };
      return;
    }

    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing API key',
    });
  }

  try {
    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    const result = await pgPool.query(
      `SELECT id, name, owner, scopes, is_active, expires_at
       FROM api_keys
       WHERE key_hash = $1`,
      [keyHash]
    );

    if (result.rows.length === 0) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
    }

    const key = result.rows[0];

    if (!key.is_active) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'API key is disabled',
      });
    }

    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'API key has expired',
      });
    }

    // Update last used
    await pgPool.query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [key.id]
    );

    request.user = {
      id: key.id,
      name: key.name,
      owner: key.owner,
      scopes: key.scopes || [],
    };
  } catch (error) {
    request.log.error(error, 'Auth middleware error');
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Check if user has required scope
 */
export function hasScope(user: AuthUser | undefined, scope: string): boolean {
  if (!user) return false;
  if (user.scopes.includes('*')) return true;
  return user.scopes.includes(scope);
}

/**
 * Scope check middleware factory
 */
export function requireScope(scope: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!hasScope(request.user, scope)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Missing required scope: ${scope}`,
      });
    }
  };
}
