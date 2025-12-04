import { pgPool } from '../db/pool.js';

export interface Document {
  id: string;
  slug: string;
  title: string;
  source: string;
  source_url?: string;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  detected_domain?: string;
  has_fsm: boolean;
  is_flow_multiagent: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CatalogEntry {
  slug: string;
  title: string;
  tags: string[];
  detected_domain?: string;
  has_fsm: boolean;
  is_flow_multiagent: boolean;
}

/**
 * Get full catalog
 */
export async function getCatalog(options?: {
  domain?: string;
  hasFsm?: boolean;
  isMultiagent?: boolean;
  tags?: string[];
}): Promise<CatalogEntry[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options?.domain) {
    conditions.push(`detected_domain = $${paramIndex++}`);
    params.push(options.domain);
  }

  if (options?.hasFsm !== undefined) {
    conditions.push(`has_fsm = $${paramIndex++}`);
    params.push(options.hasFsm);
  }

  if (options?.isMultiagent !== undefined) {
    conditions.push(`is_flow_multiagent = $${paramIndex++}`);
    params.push(options.isMultiagent);
  }

  if (options?.tags && options.tags.length > 0) {
    conditions.push(`tags && $${paramIndex++}`);
    params.push(options.tags);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pgPool.query(
    `SELECT slug, title, tags, detected_domain, has_fsm, is_flow_multiagent
     FROM documents
     ${whereClause}
     ORDER BY title`,
    params
  );

  return result.rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    tags: row.tags,
    detected_domain: row.detected_domain,
    has_fsm: row.has_fsm,
    is_flow_multiagent: row.is_flow_multiagent,
  }));
}

/**
 * Get document by slug
 */
export async function getDocumentBySlug(slug: string): Promise<Document | null> {
  const result = await pgPool.query(
    'SELECT * FROM documents WHERE slug = $1',
    [slug]
  );

  if (result.rows.length === 0) return null;
  return rowToDocument(result.rows[0]);
}

/**
 * Search documents
 */
export async function searchDocuments(
  query: string,
  limit = 10
): Promise<Array<{ document: CatalogEntry; snippet: string; score: number }>> {
  // Simple text search using Postgres full-text search
  const result = await pgPool.query(
    `SELECT
      slug, title, tags, detected_domain, has_fsm, is_flow_multiagent,
      ts_headline('english', content, plainto_tsquery('english', $1), 'MaxFragments=2') as snippet,
      ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) as score
     FROM documents
     WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
     ORDER BY score DESC
     LIMIT $2`,
    [query, limit]
  );

  return result.rows.map((row) => ({
    document: {
      slug: row.slug,
      title: row.title,
      tags: row.tags,
      detected_domain: row.detected_domain,
      has_fsm: row.has_fsm,
      is_flow_multiagent: row.is_flow_multiagent,
    },
    snippet: row.snippet,
    score: row.score,
  }));
}

/**
 * Get domain statistics
 */
export async function getDomainStats(): Promise<Record<string, number>> {
  const result = await pgPool.query(
    `SELECT detected_domain, COUNT(*) as count
     FROM documents
     GROUP BY detected_domain
     ORDER BY count DESC`
  );

  return result.rows.reduce((acc, row) => {
    acc[row.detected_domain || 'unknown'] = parseInt(row.count, 10);
    return acc;
  }, {} as Record<string, number>);
}

function rowToDocument(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    source: row.source as string,
    source_url: row.source_url as string | undefined,
    content: row.content as string,
    metadata: row.metadata as Record<string, unknown>,
    tags: row.tags as string[],
    detected_domain: row.detected_domain as string | undefined,
    has_fsm: row.has_fsm as boolean,
    is_flow_multiagent: row.is_flow_multiagent as boolean,
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
  };
}
