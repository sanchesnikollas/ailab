#!/usr/bin/env node

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PQueue from 'p-queue';
import { fetchPostList, fetchPost } from './scraper.js';
import { detectDomain, detectFSM, detectMultiAgent, extractTags } from './domain-detector.js';
import { writeMarkdown, writeRawJson, writeCatalog } from './writer.js';
import { DatabaseIndexer } from './db-indexer.js';
import type { CatalogEntry, IngestResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../../..');

const program = new Command();

program
  .name('ingest-prototipe')
  .description('Ingest posts from PrototipeAI into IA Lab')
  .version('1.0.0')
  .option('-l, --locale <locale>', 'Locale to fetch (en or pt-BR)', 'en')
  .option('-c, --concurrency <number>', 'Number of concurrent requests', '3')
  .option('--skip-db', 'Skip database indexing')
  .option('--dry-run', 'Show what would be done without writing files')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const spinner = ora('Starting PrototipeAI ingest...').start();

    const result: IngestResult = {
      total: 0,
      processed: 0,
      failed: 0,
      entries: [],
      errors: [],
    };

    try {
      // Output directories
      const contentDir = join(ROOT_DIR, 'packages/ia-lab-console/content/prototipeai');
      const rawDir = join(ROOT_DIR, 'data/prototipeai/raw');
      const catalogDir = join(ROOT_DIR, 'packages/ia-lab-console/content');

      // Database connection
      let indexer: DatabaseIndexer | null = null;
      if (!options.skipDb && !options.dryRun) {
        const dbUrl = process.env.DATABASE_URL ||
          'postgresql://ialab:ialab_password@localhost:5432/ialab';
        indexer = new DatabaseIndexer({ connectionString: dbUrl });
      }

      // Fetch post list
      spinner.text = 'Fetching post list...';
      const posts = await fetchPostList(options.locale);
      result.total = posts.length;

      if (posts.length === 0) {
        spinner.warn('No posts found. The site structure may have changed.');
        return;
      }

      spinner.succeed(`Found ${posts.length} posts`);

      if (options.dryRun) {
        console.log(chalk.yellow('\nDry run - would process:'));
        posts.forEach(p => console.log(`  - ${p.title} (${p.slug})`));
        return;
      }

      // Process posts with concurrency control
      const queue = new PQueue({ concurrency: parseInt(options.concurrency, 10) });
      const processSpinner = ora('Processing posts...').start();

      const processPost = async (postItem: { title: string; slug: string; url: string }) => {
        try {
          processSpinner.text = `Processing: ${postItem.title.slice(0, 50)}...`;

          // Fetch full post content
          const post = await fetchPost(postItem.url, postItem.slug);

          // Analyze content
          const detectedDomain = detectDomain(post);
          const hasFsm = detectFSM(post);
          const isMultiAgent = detectMultiAgent(post);
          const tags = extractTags(post);

          const entry: CatalogEntry = {
            title: post.title,
            slug: post.slug,
            url: post.url,
            tags,
            detected_domain: detectedDomain,
            has_fsm: hasFsm,
            is_flow_multiagent: isMultiAgent,
          };

          // Write files
          await writeMarkdown(post, contentDir);
          await writeRawJson(post, rawDir);

          // Index in database
          if (indexer) {
            await indexer.indexDocument(post, entry);
          }

          result.entries.push(entry);
          result.processed++;

          if (options.verbose) {
            console.log(chalk.green(`  ✓ ${post.slug}`));
          }
        } catch (error) {
          result.failed++;
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push({ slug: postItem.slug, error: errorMsg });

          if (options.verbose) {
            console.log(chalk.red(`  ✗ ${postItem.slug}: ${errorMsg}`));
          }
        }
      };

      // Add all posts to queue
      await queue.addAll(posts.map(post => () => processPost(post)));

      processSpinner.succeed(`Processed ${result.processed}/${result.total} posts`);

      // Write catalog
      spinner.start('Writing catalog...');
      await writeCatalog(result.entries, catalogDir);
      spinner.succeed('Catalog written');

      // Close database connection
      if (indexer) {
        await indexer.close();
      }

      // Summary
      console.log('\n' + chalk.bold('Ingest Summary:'));
      console.log(`  Total posts: ${result.total}`);
      console.log(`  Processed: ${chalk.green(result.processed)}`);
      console.log(`  Failed: ${result.failed > 0 ? chalk.red(result.failed) : result.failed}`);

      if (result.entries.length > 0) {
        console.log('\n' + chalk.bold('Domain Distribution:'));
        const domains = result.entries.reduce((acc, e) => {
          acc[e.detected_domain] = (acc[e.detected_domain] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        Object.entries(domains)
          .sort((a, b) => b[1] - a[1])
          .forEach(([domain, count]) => {
            console.log(`  ${domain}: ${count}`);
          });

        console.log('\n' + chalk.bold('Features:'));
        console.log(`  With FSM: ${result.entries.filter(e => e.has_fsm).length}`);
        console.log(`  Multi-agent: ${result.entries.filter(e => e.is_flow_multiagent).length}`);
      }

      if (result.errors.length > 0) {
        console.log('\n' + chalk.red.bold('Errors:'));
        result.errors.forEach(({ slug, error }) => {
          console.log(`  ${slug}: ${error}`);
        });
      }

      console.log('\n' + chalk.bold('Output:'));
      console.log(`  Markdown: ${contentDir}`);
      console.log(`  Raw JSON: ${rawDir}`);
      console.log(`  Catalog: ${join(catalogDir, 'catalog.json')}`);

    } catch (error) {
      spinner.fail('Ingest failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();
