import { z } from 'zod';

export const TransitionConditionSchema = z.object({
  type: z.enum(['intent', 'condition', 'tool_result', 'timeout']),
  value: z.string(),
  description: z.string().optional(),
});

export const TransitionSchema = z.object({
  when: TransitionConditionSchema,
  to_state: z.string(),
  priority: z.number().int().min(0).default(0),
});

export const PromptBlockSchema = z.object({
  role: z.enum(['system', 'context', 'instructions', 'examples']),
  content: z.string(),
  priority: z.number().int().default(0),
});

export const MemoryWriteSchema = z.object({
  path: z.string(),
  type: z.enum(['append', 'replace', 'merge']),
  description: z.string().optional(),
});

export const StateSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string(),
  description: z.string().optional(),
  prompt_blocks: z.array(PromptBlockSchema).default([]),
  allowed_tools: z.array(z.string()).default([]),
  memory_writes: z.array(MemoryWriteSchema).default([]),
  transitions: z.array(TransitionSchema).default([]),
  is_terminal: z.boolean().default(false),
  max_iterations: z.number().int().min(1).default(10),
});

export const FSMSchema = z.object({
  initial_state: z.string(),
  states: z.array(StateSchema).min(1),
  fallback_state: z.string().optional().describe('State to go when no transition matches'),
  global_allowed_tools: z.array(z.string()).default([]).describe('Tools allowed in all states'),
});

export type TransitionCondition = z.infer<typeof TransitionConditionSchema>;
export type Transition = z.infer<typeof TransitionSchema>;
export type PromptBlock = z.infer<typeof PromptBlockSchema>;
export type MemoryWrite = z.infer<typeof MemoryWriteSchema>;
export type State = z.infer<typeof StateSchema>;
export type FSM = z.infer<typeof FSMSchema>;
