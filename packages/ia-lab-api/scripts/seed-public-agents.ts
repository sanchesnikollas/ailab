import fs from 'fs';
import path from 'path';
import { pgPool } from '../src/db/pool.js';
import { createAgent, getAgentBySlug, updateAgent } from '../src/services/agents.js';
import { validateManifest, type AgentManifest } from 'ia-lab-agentkit';

/**
 * Seed public catalog agents into the database from examples/prototipe-public.
 * Usage:
 *   pnpm --filter ia-lab-api tsx scripts/seed-public-agents.ts
 */
async function main() {
  const root = path.resolve(__dirname, '../../../examples/prototipe-public');
  const owner = process.env.SEED_OWNER || 'public-catalog';

  const manifestFiles = [
    { file: 'indicacao-profissionais-manifest.json', slug: 'saude-conecta-public' },
    { file: 'assistente-reembolso-manifest.json', slug: 'assistente-reembolso' },
    { file: 'codificacao-medica-manifest.json', slug: 'codificacao-medica' },
    { file: 'relatorios-medicos-manifest.json', slug: 'relatorios-medicos' },
    { file: 'interoperabilidade-hl7fhir-manifest.json', slug: 'interoperabilidade-hl7fhir' },
    { file: 'suporte-corretoras-manifest.json', slug: 'suporte-corretoras' },
    { file: 'telcoassist-manifest.json', slug: 'telcoassist' },
    { file: 'agente-agendamento-manifest.json', slug: 'agente-agendamento' },
    { file: 'auditoria-faturamento-manifest.json', slug: 'auditoria-faturamento' },
  ];

  for (const entry of manifestFiles) {
    const manifestPath = path.join(root, entry.file);
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = validateManifest(JSON.parse(raw) as AgentManifest);

    manifest.metadata.slug = entry.slug;
    manifest.metadata.owner = owner;
    manifest.metadata.name = manifest.metadata.name || entry.slug;
    manifest.metadata.domain = manifest.metadata.domain || 'general';
    manifest.metadata.tags = manifest.metadata.tags || [];
    manifest.metadata.risk_level = manifest.metadata.risk_level || 'medium';
    manifest.metadata.data_classification =
      manifest.metadata.data_classification || 'internal';

    const existing = await getAgentBySlug(entry.slug);

    if (existing) {
      manifest.metadata.id = existing.id;
      await updateAgent(existing.id, manifest);
      console.log(`Updated agent: ${entry.slug}`);
    } else {
      await createAgent({
        name: manifest.metadata.name,
        slug: entry.slug,
        domain: manifest.metadata.domain,
        owner,
        manifest,
      });
      console.log(`Created agent: ${entry.slug}`);
    }
  }
}

main()
  .catch((err) => {
    console.error('Seed failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await pgPool.end();
  });
