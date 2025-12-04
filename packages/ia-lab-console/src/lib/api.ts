const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CatalogEntry {
  slug: string;
  title: string;
  tags: string[];
  detected_domain: string;
  has_fsm: boolean;
  is_flow_multiagent: boolean;
}

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
}

export interface Agent {
  id: string;
  slug: string;
  name: string;
  domain: string;
  owner: string;
  risk_level: string;
  tags: string[];
  manifest: Record<string, unknown>;
}

export interface Run {
  id: string;
  agent_id: string;
  agent_version: string;
  session_id: string;
  status: string;
  total_tokens: number;
  total_cost: number;
  total_latency_ms: number;
  steps: RunStep[];
  created_at: string;
  completed_at?: string;
}

export interface RunStep {
  id: string;
  step_number: number;
  state: string;
  input?: string;
  output?: string;
  tool_calls?: unknown[];
  tool_results?: unknown[];
  tokens_total: number;
  cost_estimate: number;
  latency_ms: number;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getCatalog(filters?: {
  domain?: string;
  has_fsm?: boolean;
  is_multiagent?: boolean;
  tags?: string[];
}): Promise<{ total: number; entries: CatalogEntry[] }> {
  const params = new URLSearchParams();
  if (filters?.domain) params.set('domain', filters.domain);
  if (filters?.has_fsm !== undefined) params.set('has_fsm', String(filters.has_fsm));
  if (filters?.is_multiagent !== undefined) params.set('is_multiagent', String(filters.is_multiagent));
  if (filters?.tags?.length) params.set('tags', filters.tags.join(','));

  return fetchApi(`/catalog?${params}`);
}

export async function getDocument(slug: string): Promise<Document> {
  return fetchApi(`/docs/${slug}`);
}

export async function searchCatalog(query: string): Promise<{
  query: string;
  total: number;
  results: Array<{ document: CatalogEntry; snippet: string; score: number }>;
}> {
  return fetchApi(`/catalog/search?q=${encodeURIComponent(query)}`);
}

export async function getAgents(): Promise<{ agents: Agent[]; total: number }> {
  return fetchApi('/agents');
}

export async function getAgent(idOrSlug: string): Promise<Agent> {
  return fetchApi(`/agents/${idOrSlug}`);
}

export async function createAgent(data: {
  name: string;
  slug: string;
  domain: string;
  manifest: Record<string, unknown>;
}): Promise<Agent> {
  return fetchApi('/agents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getRun(id: string): Promise<Run> {
  return fetchApi(`/runs/${id}`);
}

export async function listRuns(filters?: {
  agent_id?: string;
  status?: string;
}): Promise<{ runs: Run[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.agent_id) params.set('agent_id', filters.agent_id);
  if (filters?.status) params.set('status', filters.status);

  return fetchApi(`/runs?${params}`);
}
