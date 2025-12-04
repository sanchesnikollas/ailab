import { v4 as uuidv4 } from 'uuid';
import { pgPool } from '../db/pool.js';
import { validateManifest, validateFSMIntegrity, type AgentManifest } from 'ia-lab-agentkit';

export interface CreateVersionInput {
  agentId: string;
  version: string;
  changelog?: string;
  manifest: AgentManifest;
  createdBy: string;
}

export interface AgentVersion {
  id: string;
  agent_id: string;
  version: string;
  changelog?: string;
  manifest: AgentManifest;
  status: 'draft' | 'pending_approval' | 'approved' | 'deployed' | 'deprecated';
  created_by: string;
  created_at: Date;
}

/**
 * Create a new version for an agent
 */
export async function createVersion(input: CreateVersionInput): Promise<AgentVersion> {
  // Validate manifest
  const manifest = validateManifest(input.manifest);
  const fsmErrors = validateFSMIntegrity(manifest);
  if (fsmErrors.length > 0) {
    throw new Error(`FSM validation errors: ${fsmErrors.join(', ')}`);
  }

  // Check agent exists
  const agentCheck = await pgPool.query(
    'SELECT id FROM agents WHERE id = $1',
    [input.agentId]
  );
  if (agentCheck.rows.length === 0) {
    throw new Error(`Agent not found: ${input.agentId}`);
  }

  // Check version doesn't already exist
  const versionCheck = await pgPool.query(
    'SELECT id FROM agent_versions WHERE agent_id = $1 AND version = $2',
    [input.agentId, input.version]
  );
  if (versionCheck.rows.length > 0) {
    throw new Error(`Version ${input.version} already exists for this agent`);
  }

  const id = uuidv4();

  const result = await pgPool.query(
    `INSERT INTO agent_versions (id, agent_id, version, changelog, manifest, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [id, input.agentId, input.version, input.changelog, manifest, 'draft', input.createdBy]
  );

  return rowToVersion(result.rows[0]);
}

/**
 * Get version by ID
 */
export async function getVersionById(id: string): Promise<AgentVersion | null> {
  const result = await pgPool.query(
    'SELECT * FROM agent_versions WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) return null;
  return rowToVersion(result.rows[0]);
}

/**
 * List versions for an agent
 */
export async function listVersions(agentId: string): Promise<AgentVersion[]> {
  const result = await pgPool.query(
    `SELECT * FROM agent_versions
     WHERE agent_id = $1
     ORDER BY created_at DESC`,
    [agentId]
  );

  return result.rows.map(rowToVersion);
}

/**
 * Update version status
 */
export async function updateVersionStatus(
  id: string,
  status: AgentVersion['status']
): Promise<AgentVersion> {
  const result = await pgPool.query(
    `UPDATE agent_versions SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );

  if (result.rows.length === 0) {
    throw new Error(`Version not found: ${id}`);
  }

  return rowToVersion(result.rows[0]);
}

/**
 * Get latest approved version for an agent
 */
export async function getLatestApprovedVersion(agentId: string): Promise<AgentVersion | null> {
  const result = await pgPool.query(
    `SELECT * FROM agent_versions
     WHERE agent_id = $1 AND status IN ('approved', 'deployed')
     ORDER BY created_at DESC
     LIMIT 1`,
    [agentId]
  );

  if (result.rows.length === 0) return null;
  return rowToVersion(result.rows[0]);
}

function rowToVersion(row: Record<string, unknown>): AgentVersion {
  return {
    id: row.id as string,
    agent_id: row.agent_id as string,
    version: row.version as string,
    changelog: row.changelog as string | undefined,
    manifest: row.manifest as AgentManifest,
    status: row.status as AgentVersion['status'],
    created_by: row.created_by as string,
    created_at: row.created_at as Date,
  };
}
