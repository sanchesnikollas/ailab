import { z } from 'zod';

// JSON Schema subset for tool parameters
export const JsonSchemaPropertySchema: z.ZodType<Record<string, unknown>> = z.record(z.unknown());

export const ToolParameterSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  description: z.string().optional(),
  required: z.boolean().default(false),
  enum: z.array(z.string()).optional(),
  items: z.lazy(() => ToolParameterSchema).optional(),
  properties: z.record(z.lazy(() => ToolParameterSchema)).optional(),
});

// HTTP Tool (OpenAPI-based)
export const HttpToolSchema = z.object({
  type: z.literal('http'),
  name: z.string().regex(/^[a-z][a-z0-9_]*$/),
  description: z.string(),
  endpoint: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.record(z.string()).optional(),
  parameters: z.record(ToolParameterSchema).default({}),
  body_schema: JsonSchemaPropertySchema.optional(),
  response_schema: JsonSchemaPropertySchema.optional(),
  timeout_ms: z.number().int().min(100).default(30000),
  retry_count: z.number().int().min(0).default(3),
});

// MCP Tool (Model Context Protocol)
export const McpToolSchema = z.object({
  type: z.literal('mcp'),
  name: z.string().regex(/^[a-z][a-z0-9_]*$/),
  description: z.string(),
  server: z.string().describe('MCP server identifier'),
  tool_name: z.string().describe('Tool name within the MCP server'),
  parameters: z.record(ToolParameterSchema).default({}),
});

// Internal Tools (kb.search, kb.open, notes.write, notes.read)
export const InternalToolSchema = z.object({
  type: z.literal('internal'),
  name: z.enum(['kb.search', 'kb.open', 'notes.write', 'notes.read']),
  description: z.string(),
  parameters: z.record(ToolParameterSchema).default({}),
});

export const ToolDefinitionSchema = z.discriminatedUnion('type', [
  HttpToolSchema,
  McpToolSchema,
  InternalToolSchema,
]);

export const ToolRegistrySchema = z.object({
  tools: z.array(ToolDefinitionSchema).default([]),
  // Stable serialization order for deterministic prompts
  serialization_order: z.array(z.string()).optional(),
});

export type ToolParameter = z.infer<typeof ToolParameterSchema>;
export type HttpTool = z.infer<typeof HttpToolSchema>;
export type McpTool = z.infer<typeof McpToolSchema>;
export type InternalTool = z.infer<typeof InternalToolSchema>;
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
export type ToolRegistry = z.infer<typeof ToolRegistrySchema>;
