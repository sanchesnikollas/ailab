import { z } from 'zod';

export const RetentionPolicySchema = z.object({
  type: z.enum(['session', 'ttl', 'permanent']),
  ttl_seconds: z.number().int().min(0).optional(),
  max_entries: z.number().int().min(1).optional(),
});

export const PIIFieldSchema = z.object({
  path: z.string(),
  type: z.enum(['name', 'email', 'phone', 'address', 'ssn', 'medical', 'financial', 'other']),
  encryption_required: z.boolean().default(true),
  anonymize_in_logs: z.boolean().default(true),
});

export const MemoryNamespaceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  scope: z.enum(['session', 'user', 'org', 'global']),
  retention: RetentionPolicySchema,
  pii_fields: z.array(PIIFieldSchema).default([]),
  schema: z.record(z.unknown()).optional().describe('JSON Schema for the memory structure'),
});

export const MemoryConfigSchema = z.object({
  short_term: z
    .object({
      enabled: z.boolean().default(true),
      max_tokens: z.number().int().min(100).default(4000),
      summarization_threshold: z.number().int().min(100).default(3000),
    })
    .default({}),
  long_term: z
    .object({
      enabled: z.boolean().default(true),
      namespaces: z.array(MemoryNamespaceSchema).default([]),
    })
    .default({}),
  pii_flags: z.array(PIIFieldSchema).default([]),
});

export type RetentionPolicy = z.infer<typeof RetentionPolicySchema>;
export type PIIField = z.infer<typeof PIIFieldSchema>;
export type MemoryNamespace = z.infer<typeof MemoryNamespaceSchema>;
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;
