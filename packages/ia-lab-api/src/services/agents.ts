import { v4 as uuidv4 } from 'uuid';
import { pgPool } from '../db/pool.js';
import {
  AgentManifestSchema,
  validateManifest,
  validateFSMIntegrity,
  type AgentManifest,
} from 'ia-lab-agentkit';

export interface CreateAgentInput {
  name: string;
  slug: string;
  domain: string;
  owner: string;
  manifest: AgentManifest;
}

export interface AgentSummary {
  id: string;
  slug: string;
  name: string;
  domain: string;
  owner: string;
  risk_level: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface AgentWithManifest extends AgentSummary {
  manifest: AgentManifest;
}

/**
 * Create a new agent
 */
export async function createAgent(input: CreateAgentInput): Promise<AgentWithManifest> {
  // Validate manifest
  const manifest = validateManifest(input.manifest);

  // Validate FSM integrity
  const fsmErrors = validateFSMIntegrity(manifest);
  if (fsmErrors.length > 0) {
    throw new Error(`FSM validation errors: ${fsmErrors.join(', ')}`);
  }

  const id = manifest.metadata.id || uuidv4();
  manifest.metadata.id = id;
  manifest.metadata.slug = input.slug;
  manifest.metadata.name = input.name;
  manifest.metadata.domain = input.domain;
  manifest.metadata.owner = input.owner;

  const result = await pgPool.query(
    `INSERT INTO agents (id, slug, name, domain, owner, risk_level, data_classification, tags, manifest)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      input.slug,
      input.name,
      input.domain,
      input.owner,
      manifest.metadata.risk_level,
      manifest.metadata.data_classification,
      manifest.metadata.tags,
      manifest,
    ]
  );

  return rowToAgent(result.rows[0]);
}

/**
 * Get agent by ID
 */
export async function getAgentById(id: string): Promise<AgentWithManifest | null> {
  const result = await pgPool.query(
    'SELECT * FROM agents WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) return null;
  return rowToAgent(result.rows[0]);
}

/**
 * Get agent by slug
 */
export async function getAgentBySlug(slug: string): Promise<AgentWithManifest | null> {
  const result = await pgPool.query(
    'SELECT * FROM agents WHERE slug = $1',
    [slug]
  );

  if (result.rows.length === 0) return null;
  return rowToAgent(result.rows[0]);
}

/**
 * List agents with optional filters
 */
export async function listAgents(options: {
  domain?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}): Promise<{ agents: AgentSummary[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options.domain) {
    conditions.push(`domain = $${paramIndex++}`);
    params.push(options.domain);
  }

  if (options.tags && options.tags.length > 0) {
    conditions.push(`tags && $${paramIndex++}`);
    params.push(options.tags);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await pgPool.query(
    `SELECT COUNT(*) FROM agents ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get agents
  const limit = options.limit || 20;
  const offset = options.offset || 0;

  const result = await pgPool.query(
    `SELECT id, slug, name, domain, owner, risk_level, tags, created_at, updated_at
     FROM agents ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    agents: result.rows.map(rowToAgentSummary),
    total,
  };
}

/**
 * Update agent manifest
 */
export async function updateAgent(
  id: string,
  manifest: AgentManifest
): Promise<AgentWithManifest> {
  const validated = validateManifest(manifest);
  const fsmErrors = validateFSMIntegrity(validated);
  if (fsmErrors.length > 0) {
    throw new Error(`FSM validation errors: ${fsmErrors.join(', ')}`);
  }

  const result = await pgPool.query(
    `UPDATE agents SET
      name = $1,
      domain = $2,
      risk_level = $3,
      data_classification = $4,
      tags = $5,
      manifest = $6,
      updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [
      validated.metadata.name,
      validated.metadata.domain,
      validated.metadata.risk_level,
      validated.metadata.data_classification,
      validated.metadata.tags,
      validated,
      id,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error(`Agent not found: ${id}`);
  }

  return rowToAgent(result.rows[0]);
}

/**
 * Delete agent
 */
export async function deleteAgent(id: string): Promise<void> {
  await pgPool.query('DELETE FROM agents WHERE id = $1', [id]);
}

function rowToAgent(row: Record<string, unknown>): AgentWithManifest {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    domain: row.domain as string,
    owner: row.owner as string,
    risk_level: row.risk_level as string,
    tags: row.tags as string[],
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
    manifest: row.manifest as AgentManifest,
  };
}

function rowToAgentSummary(row: Record<string, unknown>): AgentSummary {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    domain: row.domain as string,
    owner: row.owner as string,
    risk_level: row.risk_level as string,
    tags: row.tags as string[],
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
  };
}
