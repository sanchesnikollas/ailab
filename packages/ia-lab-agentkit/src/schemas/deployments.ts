import { z } from 'zod';

export const EnvironmentSchema = z.enum(['development', 'staging', 'production']);

export const ApprovalSchema = z.object({
  required: z.boolean().default(false),
  approvers: z.array(z.string()).default([]),
  min_approvals: z.number().int().min(1).default(1),
});

export const DeploymentConfigSchema = z.object({
  environments: z.array(EnvironmentSchema).default(['staging', 'production']),
  approvals_required: z.boolean().default(true),
  approval_rules: z.record(EnvironmentSchema, ApprovalSchema).optional(),
  auto_rollback: z.boolean().default(true),
  canary_percentage: z.number().min(0).max(100).default(10),
});

export const VersionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  changelog: z.string().optional(),
  created_at: z.string().datetime(),
  created_by: z.string(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'deployed', 'deprecated']),
  deployed_environments: z.array(EnvironmentSchema).default([]),
});

export type Environment = z.infer<typeof EnvironmentSchema>;
export type Approval = z.infer<typeof ApprovalSchema>;
export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;
export type Version = z.infer<typeof VersionSchema>;
