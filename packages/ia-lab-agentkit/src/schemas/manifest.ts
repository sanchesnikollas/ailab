import { z } from 'zod';
import { AgentMetadataSchema } from './metadata.js';
import { PRDSchema } from './prd.js';
import { FSMSchema } from './fsm.js';
import { ToolRegistrySchema } from './tools.js';
import { MemoryConfigSchema } from './memory.js';
import { EvalsConfigSchema } from './evals.js';
import { DeploymentConfigSchema, VersionSchema } from './deployments.js';

export const AgentManifestSchema = z.object({
  $schema: z.string().optional().default('https://ialab.dev/schemas/agent-manifest-v1.json'),
  manifest_version: z.literal('1.0'),
  metadata: AgentMetadataSchema,
  prd: PRDSchema,
  fsm: FSMSchema,
  tools: ToolRegistrySchema.default({ tools: [] }),
  memory: MemoryConfigSchema.default({}),
  evals: EvalsConfigSchema.default({}),
  deployments: DeploymentConfigSchema.default({}),
  versions: z.array(VersionSchema).default([]),
});

export type AgentManifest = z.infer<typeof AgentManifestSchema>;

// Validation helper
export function validateManifest(data: unknown): AgentManifest {
  return AgentManifestSchema.parse(data);
}

// Safe validation helper
export function safeValidateManifest(data: unknown): {
  success: boolean;
  data?: AgentManifest;
  errors?: z.ZodError;
} {
  const result = AgentManifestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// FSM validation helper - ensures all state references are valid
export function validateFSMIntegrity(manifest: AgentManifest): string[] {
  const errors: string[] = [];
  const stateIds = new Set(manifest.fsm.states.map((s) => s.id));
  const toolNames = new Set(manifest.tools.tools.map((t) => t.name));

  // Check initial state exists
  if (!stateIds.has(manifest.fsm.initial_state)) {
    errors.push(`Initial state '${manifest.fsm.initial_state}' not found in states`);
  }

  // Check fallback state exists
  if (manifest.fsm.fallback_state && !stateIds.has(manifest.fsm.fallback_state)) {
    errors.push(`Fallback state '${manifest.fsm.fallback_state}' not found in states`);
  }

  // Check all transition targets exist
  for (const state of manifest.fsm.states) {
    for (const transition of state.transitions) {
      if (!stateIds.has(transition.to_state)) {
        errors.push(
          `State '${state.id}' has transition to unknown state '${transition.to_state}'`
        );
      }
    }

    // Check all allowed tools exist in registry
    for (const toolName of state.allowed_tools) {
      if (!toolNames.has(toolName) && !isInternalTool(toolName)) {
        errors.push(`State '${state.id}' references unknown tool '${toolName}'`);
      }
    }
  }

  // Check global allowed tools
  for (const toolName of manifest.fsm.global_allowed_tools) {
    if (!toolNames.has(toolName) && !isInternalTool(toolName)) {
      errors.push(`Global allowed tool '${toolName}' not found in tool registry`);
    }
  }

  return errors;
}

function isInternalTool(name: string): boolean {
  return ['kb.search', 'kb.open', 'notes.write', 'notes.read'].includes(name);
}
