import { v4 as uuidv4 } from 'uuid';
import { pgPool, redis } from '../db/pool.js';
import type { Run, RunStep, SessionState, MemoryStore } from 'ia-lab-agentkit';

export interface CreateRunInput {
  agentId: string;
  agentVersion: string;
  sessionId: string;
  userId?: string;
}

export interface RunWithSteps {
  id: string;
  agent_id: string;
  agent_version: string;
  session_id: string;
  user_id?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  total_tokens: number;
  total_cost: number;
  total_latency_ms: number;
  error?: string;
  created_at: Date;
  completed_at?: Date;
  steps: RunStepRecord[];
}

export interface RunStepRecord {
  id: string;
  run_id: string;
  step_number: number;
  state: string;
  input?: string;
  output?: string;
  tool_calls?: unknown[];
  tool_results?: unknown[];
  tokens_prompt: number;
  tokens_completion: number;
  tokens_total: number;
  cost_estimate: number;
  latency_ms: number;
  created_at: Date;
}

/**
 * Create a new run
 */
export async function createRun(input: CreateRunInput): Promise<RunWithSteps> {
  const id = uuidv4();

  const result = await pgPool.query(
    `INSERT INTO runs (id, agent_id, agent_version, session_id, user_id, status)
     VALUES ($1, $2, $3, $4, $5, 'running')
     RETURNING *`,
    [id, input.agentId, input.agentVersion, input.sessionId, input.userId]
  );

  return { ...rowToRun(result.rows[0]), steps: [] };
}

/**
 * Get run by ID with steps
 */
export async function getRunById(id: string): Promise<RunWithSteps | null> {
  const runResult = await pgPool.query(
    'SELECT * FROM runs WHERE id = $1',
    [id]
  );

  if (runResult.rows.length === 0) return null;

  const stepsResult = await pgPool.query(
    'SELECT * FROM run_steps WHERE run_id = $1 ORDER BY step_number',
    [id]
  );

  return {
    ...rowToRun(runResult.rows[0]),
    steps: stepsResult.rows.map(rowToStep),
  };
}

/**
 * List runs for an agent
 */
export async function listRuns(options: {
  agentId?: string;
  sessionId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ runs: RunWithSteps[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options.agentId) {
    conditions.push(`agent_id = $${paramIndex++}`);
    params.push(options.agentId);
  }

  if (options.sessionId) {
    conditions.push(`session_id = $${paramIndex++}`);
    params.push(options.sessionId);
  }

  if (options.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(options.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pgPool.query(
    `SELECT COUNT(*) FROM runs ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const limit = options.limit || 20;
  const offset = options.offset || 0;

  const result = await pgPool.query(
    `SELECT * FROM runs ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  // Get steps for each run
  const runs: RunWithSteps[] = [];
  for (const row of result.rows) {
    const stepsResult = await pgPool.query(
      'SELECT * FROM run_steps WHERE run_id = $1 ORDER BY step_number',
      [row.id]
    );
    runs.push({
      ...rowToRun(row),
      steps: stepsResult.rows.map(rowToStep),
    });
  }

  return { runs, total };
}

/**
 * Add step to run
 */
export async function addRunStep(step: Omit<RunStepRecord, 'id' | 'created_at'>): Promise<RunStepRecord> {
  const id = uuidv4();

  const result = await pgPool.query(
    `INSERT INTO run_steps (
      id, run_id, step_number, state, input, output,
      tool_calls, tool_results, tokens_prompt, tokens_completion,
      tokens_total, cost_estimate, latency_ms
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      id, step.run_id, step.step_number, step.state, step.input, step.output,
      JSON.stringify(step.tool_calls || []),
      JSON.stringify(step.tool_results || []),
      step.tokens_prompt, step.tokens_completion, step.tokens_total,
      step.cost_estimate, step.latency_ms,
    ]
  );

  // Update run totals
  await pgPool.query(
    `UPDATE runs SET
      total_tokens = total_tokens + $1,
      total_cost = total_cost + $2,
      total_latency_ms = total_latency_ms + $3
     WHERE id = $4`,
    [step.tokens_total, step.cost_estimate, step.latency_ms, step.run_id]
  );

  return rowToStep(result.rows[0]);
}

/**
 * Complete run
 */
export async function completeRun(
  id: string,
  status: 'completed' | 'failed' | 'cancelled',
  error?: string
): Promise<void> {
  await pgPool.query(
    `UPDATE runs SET status = $1, error = $2, completed_at = NOW() WHERE id = $3`,
    [status, error, id]
  );
}

/**
 * Memory store implementation using Redis + Postgres
 */
export class DatabaseMemoryStore implements MemoryStore {
  async getSessionState(sessionId: string): Promise<SessionState | null> {
    // Try Redis first
    const cached = await redis.get(`session:${sessionId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fall back to Postgres
    const result = await pgPool.query(
      'SELECT * FROM session_states WHERE session_id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) return null;

    const state: SessionState = {
      currentState: result.rows[0].current_state,
      history: result.rows[0].history,
      metadata: result.rows[0].metadata,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    // Cache in Redis
    await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(state));

    return state;
  }

  async setSessionState(sessionId: string, state: SessionState): Promise<void> {
    // Save to Postgres
    await pgPool.query(
      `INSERT INTO session_states (session_id, current_state, history, metadata)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id) DO UPDATE SET
         current_state = EXCLUDED.current_state,
         history = EXCLUDED.history,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()`,
      [sessionId, state.currentState, JSON.stringify(state.history), state.metadata]
    );

    // Cache in Redis
    await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(state));
  }

  async getLongTermMemory(namespace: string, key: string): Promise<unknown> {
    const result = await pgPool.query(
      `SELECT value FROM long_term_memory
       WHERE namespace = $1 AND key = $2
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [namespace, key]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0].value;
  }

  async setLongTermMemory(
    namespace: string,
    key: string,
    value: unknown,
    ttl?: number
  ): Promise<void> {
    const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : null;

    await pgPool.query(
      `INSERT INTO long_term_memory (namespace, key, value, ttl_seconds, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (namespace, key, user_id, org_id) DO UPDATE SET
         value = EXCLUDED.value,
         ttl_seconds = EXCLUDED.ttl_seconds,
         expires_at = EXCLUDED.expires_at,
         updated_at = NOW()`,
      [namespace, key, JSON.stringify(value), ttl, expiresAt]
    );
  }
}

function rowToRun(row: Record<string, unknown>): Omit<RunWithSteps, 'steps'> {
  return {
    id: row.id as string,
    agent_id: row.agent_id as string,
    agent_version: row.agent_version as string,
    session_id: row.session_id as string,
    user_id: row.user_id as string | undefined,
    status: row.status as RunWithSteps['status'],
    total_tokens: row.total_tokens as number,
    total_cost: parseFloat(row.total_cost as string),
    total_latency_ms: row.total_latency_ms as number,
    error: row.error as string | undefined,
    created_at: row.created_at as Date,
    completed_at: row.completed_at as Date | undefined,
  };
}

function rowToStep(row: Record<string, unknown>): RunStepRecord {
  return {
    id: row.id as string,
    run_id: row.run_id as string,
    step_number: row.step_number as number,
    state: row.state as string,
    input: row.input as string | undefined,
    output: row.output as string | undefined,
    tool_calls: row.tool_calls as unknown[] | undefined,
    tool_results: row.tool_results as unknown[] | undefined,
    tokens_prompt: row.tokens_prompt as number,
    tokens_completion: row.tokens_completion as number,
    tokens_total: row.tokens_total as number,
    cost_estimate: parseFloat(row.cost_estimate as string),
    latency_ms: row.latency_ms as number,
    created_at: row.created_at as Date,
  };
}
