import { z } from 'zod';

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  tool_calls: z
    .array(
      z.object({
        name: z.string(),
        arguments: z.record(z.unknown()),
      })
    )
    .optional(),
});

export const AssertSchema = z.object({
  type: z.enum([
    'contains',
    'not_contains',
    'matches_regex',
    'json_path',
    'tool_called',
    'tool_not_called',
    'state_is',
    'custom',
  ]),
  value: z.string(),
  path: z.string().optional().describe('JSON path for json_path assertions'),
  message: z.string().optional().describe('Custom error message'),
});

export const GoldenTestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  conversation: z.array(MessageSchema).min(1),
  asserts: z.array(AssertSchema).min(1),
  tags: z.array(z.string()).default([]),
  timeout_ms: z.number().int().min(1000).default(60000),
});

export const SafetyTestSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['jailbreak', 'prompt_injection', 'data_extraction', 'bias', 'toxicity', 'custom']),
  input: z.string(),
  expected_behavior: z.enum(['refuse', 'redirect', 'sanitize', 'ignore']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  asserts: z.array(AssertSchema).default([]),
});

export const EvalsConfigSchema = z.object({
  golden_tests: z.array(GoldenTestSchema).default([]),
  safety_tests: z.array(SafetyTestSchema).default([]),
  coverage_threshold: z.number().min(0).max(100).default(80),
  run_on_deploy: z.boolean().default(true),
});

export type Message = z.infer<typeof MessageSchema>;
export type Assert = z.infer<typeof AssertSchema>;
export type GoldenTest = z.infer<typeof GoldenTestSchema>;
export type SafetyTest = z.infer<typeof SafetyTestSchema>;
export type EvalsConfig = z.infer<typeof EvalsConfigSchema>;
