export interface PostListItem {
  title: string;
  slug: string;
  url: string;
}

export interface PostContent {
  slug: string;
  title: string;
  url: string;
  summary?: string;
  purpose?: string;
  context?: string;
  impacts?: string[];
  solution_overview?: string;
  prototypes?: string[];
  requirements?: Requirement[];
  raw_html: string;
  markdown: string;
  sections: Record<string, string>;
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
}

export interface CatalogEntry {
  title: string;
  slug: string;
  url: string;
  tags: string[];
  detected_domain: string;
  has_fsm: boolean;
  is_flow_multiagent: boolean;
}

export interface IngestResult {
  total: number;
  processed: number;
  failed: number;
  entries: CatalogEntry[];
  errors: Array<{ slug: string; error: string }>;
}
