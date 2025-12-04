import { z } from 'zod';

export const PrototypeRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url().optional(),
});

export const RelatedPostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  relevance: z.enum(['high', 'medium', 'low']).optional(),
});

export const PRDSchema = z.object({
  purpose: z.string().min(1).describe('Why this agent exists'),
  scope: z.string().min(1).describe('What this agent does and does not do'),
  context_problem: z.string().min(1).describe('The problem being solved'),
  expected_impacts: z.array(z.string()).default([]),
  solution_overview: z.string().optional(),
  prototypes: z.array(PrototypeRefSchema).default([]),
  related_posts: z.array(RelatedPostSchema).default([]),
  requirements: z
    .array(
      z.object({
        id: z.string().regex(/^RF\d+$/),
        title: z.string(),
        description: z.string(),
        priority: z.enum(['must', 'should', 'could', 'wont']).default('must'),
      })
    )
    .default([]),
});

export type PRD = z.infer<typeof PRDSchema>;
export type PrototypeRef = z.infer<typeof PrototypeRefSchema>;
export type RelatedPost = z.infer<typeof RelatedPostSchema>;
