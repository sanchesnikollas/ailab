import * as cheerio from 'cheerio';
import type { PostListItem, PostContent, Requirement } from './types.js';

const BASE_URL = 'https://www.prototipeai.com';

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  retries = 3,
  delay = 1000
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'IA-Lab-Ingestor/1.0 (https://ialab.dev)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Fetch failed after retries');
}

/**
 * Fetch post list from paginated listing
 */
export async function fetchPostList(locale = 'en'): Promise<PostListItem[]> {
  const posts: PostListItem[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${BASE_URL}/posts?locale=${locale}&page=${page}`;
    console.log(`Fetching page ${page}: ${url}`);

    try {
      const html = await fetchWithRetry(url);
      const $ = cheerio.load(html);

      // Find post links - adjust selectors based on actual page structure
      const pageItems: PostListItem[] = [];

      // Try different possible selectors
      $('article a, .post-item a, [data-post] a, .card a').each((_, el) => {
        const $el = $(el);
        const href = $el.attr('href');
        const title = $el.find('h2, h3, .title').text().trim() || $el.text().trim();

        if (href && href.includes('/posts/') && title) {
          const slug = href.split('/posts/').pop()?.split('?')[0] || '';
          if (slug && !pageItems.some((p) => p.slug === slug)) {
            pageItems.push({
              title,
              slug,
              url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
            });
          }
        }
      });

      // Also try direct post links
      $('a[href*="/posts/"]').each((_, el) => {
        const $el = $(el);
        const href = $el.attr('href') || '';
        if (!href.includes('?page=') && !href.endsWith('/posts') && !href.endsWith('/posts/')) {
          const slug = href.split('/posts/').pop()?.split('?')[0] || '';
          const title = $el.text().trim() || $el.find('h1, h2, h3').text().trim();

          if (slug && title && !pageItems.some((p) => p.slug === slug)) {
            pageItems.push({
              title: title.slice(0, 200),
              slug,
              url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
            });
          }
        }
      });

      if (pageItems.length === 0) {
        hasMore = false;
      } else {
        posts.push(...pageItems);

        // Check for next page link
        const hasNextPage = $('a[href*="page="]').filter((_, el) => {
          const href = $(el).attr('href') || '';
          return href.includes(`page=${page + 1}`);
        }).length > 0;

        if (hasNextPage) {
          page++;
          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      hasMore = false;
    }
  }

  // Deduplicate
  const uniquePosts = posts.filter(
    (post, index, self) => self.findIndex((p) => p.slug === post.slug) === index
  );

  return uniquePosts;
}

/**
 * Fetch and parse a single post
 */
export async function fetchPost(url: string, slug: string): Promise<PostContent> {
  const html = await fetchWithRetry(url);
  const $ = cheerio.load(html);

  // Extract title
  const title = $('h1').first().text().trim() ||
    $('article h1, .post-title, [data-title]').first().text().trim() ||
    slug.replace(/-/g, ' ');

  // Extract main content
  const articleContent = $('article, .post-content, .content, main').first();
  const contentHtml = articleContent.html() || $('body').html() || '';

  // Extract sections based on headings
  const sections: Record<string, string> = {};
  let currentSection = 'intro';
  let currentContent: string[] = [];

  articleContent.children().each((_, el) => {
    const $el = $(el);
    const tagName = el.tagName?.toLowerCase();

    if (tagName === 'h2' || tagName === 'h3') {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = $el.text().trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
      currentContent = [];
    } else {
      currentContent.push($el.text().trim());
    }
  });

  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  // Extract structured data
  const summary = extractSection($, ['sumário', 'summary', 'resumo', 'overview']);
  const purpose = extractSection($, ['propósito', 'purpose', 'objetivo', 'goal']);
  const context = extractSection($, ['contexto', 'context', 'problema', 'problem']);
  const solutionOverview = extractSection($, ['solução', 'solution', 'visão geral', 'overview']);

  // Extract impacts
  const impacts = extractListItems($, ['impactos', 'impacts', 'benefícios', 'benefits']);

  // Extract prototypes
  const prototypes = extractListItems($, ['protótipos', 'prototypes', 'mvp']);

  // Extract requirements (RFs)
  const requirements = extractRequirements($);

  // Convert to markdown
  const markdown = htmlToMarkdown(contentHtml, $);

  return {
    slug,
    title,
    url,
    summary,
    purpose,
    context,
    impacts,
    solution_overview: solutionOverview,
    prototypes,
    requirements,
    raw_html: contentHtml,
    markdown,
    sections,
  };
}

function extractSection($: cheerio.CheerioAPI, keywords: string[]): string | undefined {
  for (const keyword of keywords) {
    const heading = $(`h2, h3`).filter((_, el) => {
      return $(el).text().toLowerCase().includes(keyword);
    }).first();

    if (heading.length) {
      const content: string[] = [];
      let sibling = heading.next();
      while (sibling.length && !['h2', 'h3'].includes(sibling[0].tagName?.toLowerCase())) {
        content.push(sibling.text().trim());
        sibling = sibling.next();
      }
      if (content.length > 0) {
        return content.join('\n').trim();
      }
    }
  }
  return undefined;
}

function extractListItems($: cheerio.CheerioAPI, keywords: string[]): string[] {
  const items: string[] = [];

  for (const keyword of keywords) {
    const heading = $(`h2, h3`).filter((_, el) => {
      return $(el).text().toLowerCase().includes(keyword);
    }).first();

    if (heading.length) {
      const list = heading.nextAll('ul, ol').first();
      list.find('li').each((_, el) => {
        items.push($(el).text().trim());
      });
      if (items.length > 0) break;
    }
  }

  return items;
}

function extractRequirements($: cheerio.CheerioAPI): Requirement[] {
  const requirements: Requirement[] = [];

  // Look for RF patterns
  $('h2, h3, h4, strong, b').each((_, el) => {
    const text = $(el).text().trim();
    const rfMatch = text.match(/RF\s*(\d+)/i);

    if (rfMatch) {
      const id = `RF${rfMatch[1]}`;
      const title = text.replace(/RF\s*\d+\s*[-–:.]?\s*/i, '').trim();

      // Get description from next sibling
      const nextSibling = $(el).next();
      const description = nextSibling.text().trim().slice(0, 500);

      if (!requirements.some((r) => r.id === id)) {
        requirements.push({ id, title: title || id, description });
      }
    }
  });

  // Also look for numbered lists that might be requirements
  $('ol li, ul li').each((_, el) => {
    const text = $(el).text().trim();
    const rfMatch = text.match(/^RF\s*(\d+)/i);

    if (rfMatch) {
      const id = `RF${rfMatch[1]}`;
      const rest = text.replace(/^RF\s*\d+\s*[-–:.]?\s*/i, '');
      const [title, ...descParts] = rest.split(/[.!?]/);

      if (!requirements.some((r) => r.id === id)) {
        requirements.push({
          id,
          title: title?.trim() || id,
          description: descParts.join('. ').trim().slice(0, 500),
        });
      }
    }
  });

  return requirements.sort((a, b) => {
    const numA = parseInt(a.id.replace('RF', ''), 10);
    const numB = parseInt(b.id.replace('RF', ''), 10);
    return numA - numB;
  });
}

function htmlToMarkdown(html: string, $: cheerio.CheerioAPI): string {
  const content = cheerio.load(html);
  const lines: string[] = [];

  function processNode(node: cheerio.Element, depth = 0): void {
    const tagName = node.tagName?.toLowerCase();

    if (!tagName) {
      // Text node
      const text = content(node).text().trim();
      if (text) lines.push(text);
      return;
    }

    switch (tagName) {
      case 'h1':
        lines.push(`# ${content(node).text().trim()}`);
        lines.push('');
        break;
      case 'h2':
        lines.push(`## ${content(node).text().trim()}`);
        lines.push('');
        break;
      case 'h3':
        lines.push(`### ${content(node).text().trim()}`);
        lines.push('');
        break;
      case 'h4':
        lines.push(`#### ${content(node).text().trim()}`);
        lines.push('');
        break;
      case 'p':
        lines.push(content(node).text().trim());
        lines.push('');
        break;
      case 'ul':
      case 'ol':
        content(node).children('li').each((i, li) => {
          const prefix = tagName === 'ol' ? `${i + 1}.` : '-';
          lines.push(`${prefix} ${content(li).text().trim()}`);
        });
        lines.push('');
        break;
      case 'pre':
      case 'code':
        lines.push('```');
        lines.push(content(node).text().trim());
        lines.push('```');
        lines.push('');
        break;
      case 'blockquote':
        lines.push(`> ${content(node).text().trim()}`);
        lines.push('');
        break;
      case 'a':
        const href = content(node).attr('href');
        const text = content(node).text().trim();
        if (href && text) {
          lines.push(`[${text}](${href})`);
        }
        break;
      case 'img':
        const src = content(node).attr('src');
        const alt = content(node).attr('alt') || 'image';
        if (src) {
          lines.push(`![${alt}](${src})`);
          lines.push('');
        }
        break;
      case 'strong':
      case 'b':
        lines.push(`**${content(node).text().trim()}**`);
        break;
      case 'em':
      case 'i':
        lines.push(`*${content(node).text().trim()}*`);
        break;
      case 'br':
        lines.push('');
        break;
      case 'hr':
        lines.push('---');
        lines.push('');
        break;
      case 'div':
      case 'section':
      case 'article':
        content(node).children().each((_, child) => {
          processNode(child as cheerio.Element, depth);
        });
        break;
      default:
        // Process children
        content(node).children().each((_, child) => {
          processNode(child as cheerio.Element, depth);
        });
    }
  }

  content('body').children().each((_, node) => {
    processNode(node as cheerio.Element);
  });

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
