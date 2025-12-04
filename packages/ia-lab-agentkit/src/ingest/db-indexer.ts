import pg from 'pg';
import { createHash } from 'crypto';
import type { PostContent, CatalogEntry } from './types.js';

const { Pool } = pg;

export interface IndexerConfig {
  connectionString: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Index documents into Postgres with optional vector embeddings
 */
export class DatabaseIndexer {
  private pool: pg.Pool;
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(config: IndexerConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
    });
    this.chunkSize = config.chunkSize || 1000;
    this.chunkOverlap = config.chunkOverlap || 100;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Index a post into the documents table
   */
  async indexDocument(
    post: PostContent,
    entry: CatalogEntry
  ): Promise<string> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const contentHash = createHash('sha256')
        .update(post.markdown)
        .digest('hex');

      // Check if document already exists with same hash
      const existing = await client.query(
        'SELECT id, content_hash FROM documents WHERE slug = $1',
        [post.slug]
      );

      let documentId: string;

      if (existing.rows.length > 0) {
        if (existing.rows[0].content_hash === contentHash) {
          // No changes, skip
          await client.query('COMMIT');
          return existing.rows[0].id;
        }

        // Update existing document
        const result = await client.query(
          `UPDATE documents SET
            title = $1,
            content = $2,
            content_hash = $3,
            metadata = $4,
            tags = $5,
            detected_domain = $6,
            has_fsm = $7,
            is_flow_multiagent = $8,
            updated_at = NOW()
          WHERE slug = $9
          RETURNING id`,
          [
            post.title,
            post.markdown,
            contentHash,
            JSON.stringify({
              summary: post.summary,
              purpose: post.purpose,
              context: post.context,
              impacts: post.impacts,
              requirements: post.requirements,
            }),
            entry.tags,
            entry.detected_domain,
            entry.has_fsm,
            entry.is_flow_multiagent,
            post.slug,
          ]
        );
        documentId = result.rows[0].id;

        // Delete old chunks
        await client.query(
          'DELETE FROM document_chunks WHERE document_id = $1',
          [documentId]
        );
      } else {
        // Insert new document
        const result = await client.query(
          `INSERT INTO documents (
            slug, title, source, source_url, content, content_hash,
            metadata, tags, detected_domain, has_fsm, is_flow_multiagent
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id`,
          [
            post.slug,
            post.title,
            'prototipeai',
            post.url,
            post.markdown,
            contentHash,
            JSON.stringify({
              summary: post.summary,
              purpose: post.purpose,
              context: post.context,
              impacts: post.impacts,
              requirements: post.requirements,
            }),
            entry.tags,
            entry.detected_domain,
            entry.has_fsm,
            entry.is_flow_multiagent,
          ]
        );
        documentId = result.rows[0].id;
      }

      // Create chunks
      const chunks = this.createChunks(post.markdown);

      for (let i = 0; i < chunks.length; i++) {
        await client.query(
          `INSERT INTO document_chunks (
            document_id, chunk_index, content, token_count, metadata
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            documentId,
            i,
            chunks[i],
            this.estimateTokens(chunks[i]),
            JSON.stringify({ position: i, total_chunks: chunks.length }),
          ]
        );
      }

      await client.query('COMMIT');
      return documentId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create chunks from content with overlap
   */
  private createChunks(content: string): string[] {
    const chunks: string[] = [];
    const sentences = content.split(/(?<=[.!?])\s+/);

    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > this.chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        // Start new chunk with overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(this.chunkOverlap / 5));
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Rough token estimation (4 chars per token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Search documents by vector similarity (requires embeddings)
   */
  async searchSimilar(
    embedding: number[],
    limit = 10
  ): Promise<Array<{ id: string; slug: string; content: string; score: number }>> {
    const result = await this.pool.query(
      `SELECT
        d.id, d.slug, dc.content,
        1 - (dc.embedding <=> $1::vector) as score
      FROM document_chunks dc
      JOIN documents d ON d.id = dc.document_id
      WHERE dc.embedding IS NOT NULL
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $2`,
      [`[${embedding.join(',')}]`, limit]
    );

    return result.rows;
  }
}
