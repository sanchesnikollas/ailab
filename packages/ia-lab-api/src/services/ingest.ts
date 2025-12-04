import { v4 as uuidv4 } from 'uuid';
import { pgPool } from '../db/pool.js';

export interface IngestJob {
  id: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_items: number;
  processed_items: number;
  failed_items: number;
  error?: string;
  metadata: Record<string, unknown>;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

/**
 * Create a new ingest job
 */
export async function createIngestJob(source: string): Promise<IngestJob> {
  const id = uuidv4();

  const result = await pgPool.query(
    `INSERT INTO ingest_jobs (id, source, status, metadata)
     VALUES ($1, $2, 'pending', '{}')
     RETURNING *`,
    [id, source]
  );

  return rowToJob(result.rows[0]);
}

/**
 * Get ingest job by ID
 */
export async function getIngestJob(id: string): Promise<IngestJob | null> {
  const result = await pgPool.query(
    'SELECT * FROM ingest_jobs WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) return null;
  return rowToJob(result.rows[0]);
}

/**
 * Update ingest job status
 */
export async function updateIngestJob(
  id: string,
  updates: Partial<Pick<IngestJob, 'status' | 'total_items' | 'processed_items' | 'failed_items' | 'error' | 'metadata'>>
): Promise<IngestJob> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);

    if (updates.status === 'running') {
      fields.push(`started_at = NOW()`);
    } else if (updates.status === 'completed' || updates.status === 'failed') {
      fields.push(`completed_at = NOW()`);
    }
  }

  if (updates.total_items !== undefined) {
    fields.push(`total_items = $${paramIndex++}`);
    values.push(updates.total_items);
  }

  if (updates.processed_items !== undefined) {
    fields.push(`processed_items = $${paramIndex++}`);
    values.push(updates.processed_items);
  }

  if (updates.failed_items !== undefined) {
    fields.push(`failed_items = $${paramIndex++}`);
    values.push(updates.failed_items);
  }

  if (updates.error !== undefined) {
    fields.push(`error = $${paramIndex++}`);
    values.push(updates.error);
  }

  if (updates.metadata !== undefined) {
    fields.push(`metadata = $${paramIndex++}`);
    values.push(updates.metadata);
  }

  values.push(id);

  const result = await pgPool.query(
    `UPDATE ingest_jobs SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error(`Ingest job not found: ${id}`);
  }

  return rowToJob(result.rows[0]);
}

/**
 * List ingest jobs
 */
export async function listIngestJobs(options?: {
  source?: string;
  status?: string;
  limit?: number;
}): Promise<IngestJob[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options?.source) {
    conditions.push(`source = $${paramIndex++}`);
    params.push(options.source);
  }

  if (options?.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(options.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = options?.limit || 20;

  const result = await pgPool.query(
    `SELECT * FROM ingest_jobs ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex}`,
    [...params, limit]
  );

  return result.rows.map(rowToJob);
}

/**
 * Run PrototipeAI ingest (would typically be a background worker)
 */
export async function runPrototipeIngest(jobId: string): Promise<void> {
  // This is a placeholder - in production this would:
  // 1. Spawn a background worker
  // 2. Run the ingest CLI
  // 3. Update the job status

  // For now, we'll just mark it as pending
  // The actual ingest is run via CLI: pnpm ingest:prototipe

  await updateIngestJob(jobId, {
    status: 'pending',
    metadata: {
      message: 'Run "pnpm ingest:prototipe" to start the ingest process',
    },
  });
}

function rowToJob(row: Record<string, unknown>): IngestJob {
  return {
    id: row.id as string,
    source: row.source as string,
    status: row.status as IngestJob['status'],
    total_items: row.total_items as number,
    processed_items: row.processed_items as number,
    failed_items: row.failed_items as number,
    error: row.error as string | undefined,
    metadata: row.metadata as Record<string, unknown>,
    started_at: row.started_at as Date | undefined,
    completed_at: row.completed_at as Date | undefined,
    created_at: row.created_at as Date,
  };
}
