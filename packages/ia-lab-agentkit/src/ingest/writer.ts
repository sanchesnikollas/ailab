import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import type { PostContent, CatalogEntry } from './types.js';

/**
 * Write post content to markdown file
 */
export async function writeMarkdown(
  post: PostContent,
  outputDir: string
): Promise<void> {
  const filePath = join(outputDir, `${post.slug}.md`);
  await mkdir(dirname(filePath), { recursive: true });

  const frontmatter = [
    '---',
    `title: "${escapeYaml(post.title)}"`,
    `slug: "${post.slug}"`,
    `url: "${post.url}"`,
    post.summary ? `summary: "${escapeYaml(post.summary.slice(0, 200))}"` : null,
    post.purpose ? `purpose: "${escapeYaml(post.purpose.slice(0, 200))}"` : null,
    post.requirements && post.requirements.length > 0
      ? `requirements_count: ${post.requirements.length}`
      : null,
    '---',
    '',
  ].filter(Boolean).join('\n');

  const content = [
    frontmatter,
    `# ${post.title}`,
    '',
    post.summary ? `## Sumário\n${post.summary}\n` : null,
    post.purpose ? `## Propósito\n${post.purpose}\n` : null,
    post.context ? `## Contexto\n${post.context}\n` : null,
    post.solution_overview ? `## Visão Geral da Solução\n${post.solution_overview}\n` : null,
    post.impacts && post.impacts.length > 0
      ? `## Impactos Esperados\n${post.impacts.map(i => `- ${i}`).join('\n')}\n`
      : null,
    post.prototypes && post.prototypes.length > 0
      ? `## Protótipos\n${post.prototypes.map(p => `- ${p}`).join('\n')}\n`
      : null,
    post.requirements && post.requirements.length > 0
      ? `## Requisitos Funcionais\n${post.requirements.map(r => `### ${r.id}: ${r.title}\n${r.description}`).join('\n\n')}\n`
      : null,
    '---',
    '',
    '## Conteúdo Original',
    '',
    post.markdown,
  ].filter(Boolean).join('\n');

  await writeFile(filePath, content, 'utf-8');
}

/**
 * Write raw JSON data
 */
export async function writeRawJson(
  post: PostContent,
  outputDir: string
): Promise<void> {
  const filePath = join(outputDir, `${post.slug}.json`);
  await mkdir(dirname(filePath), { recursive: true });

  const data = {
    slug: post.slug,
    title: post.title,
    url: post.url,
    summary: post.summary,
    purpose: post.purpose,
    context: post.context,
    impacts: post.impacts,
    solution_overview: post.solution_overview,
    prototypes: post.prototypes,
    requirements: post.requirements,
    sections: post.sections,
    extracted_at: new Date().toISOString(),
  };

  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Write catalog.json
 */
export async function writeCatalog(
  entries: CatalogEntry[],
  outputDir: string
): Promise<void> {
  const filePath = join(outputDir, 'catalog.json');
  await mkdir(dirname(filePath), { recursive: true });

  const catalog = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    total_entries: entries.length,
    entries: entries.sort((a, b) => a.title.localeCompare(b.title)),
    stats: {
      by_domain: groupBy(entries, 'detected_domain'),
      with_fsm: entries.filter(e => e.has_fsm).length,
      multiagent: entries.filter(e => e.is_flow_multiagent).length,
    },
  };

  await writeFile(filePath, JSON.stringify(catalog, null, 2), 'utf-8');
}

function groupBy<T>(items: T[], key: keyof T): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const value = String(item[key]);
    result[value] = (result[value] || 0) + 1;
  }
  return result;
}

function escapeYaml(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .trim();
}
