import { z } from 'zod';

export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const DataClassificationSchema = z.enum([
  'public',
  'internal',
  'confidential',
  'restricted',
]);
export type DataClassification = z.infer<typeof DataClassificationSchema>;

export const AgentMetadataSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  domain: z.string().min(1),
  tags: z.array(z.string()).default([]),
  owner: z.string().min(1),
  risk_level: RiskLevelSchema.default('medium'),
  data_classification: DataClassificationSchema.default('internal'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;
