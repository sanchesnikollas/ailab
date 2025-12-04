'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Bot, ArrowLeft, Save, AlertCircle } from 'lucide-react';

const EMPTY_MANIFEST = {
  manifest_version: '1.0',
  metadata: {
    id: '',
    name: '',
    slug: '',
    domain: '',
    tags: [],
    owner: '',
    risk_level: 'medium',
    data_classification: 'internal',
  },
  prd: {
    purpose: '',
    scope: '',
    context_problem: '',
    expected_impacts: [],
    requirements: [],
  },
  fsm: {
    initial_state: 'start',
    states: [
      {
        id: 'start',
        name: 'Initial State',
        prompt_blocks: [],
        allowed_tools: [],
        memory_writes: [],
        transitions: [],
        is_terminal: false,
      },
    ],
    global_allowed_tools: ['kb.search', 'kb.open'],
  },
  tools: { tools: [] },
  memory: {},
  evals: {},
  deployments: {},
};

export default function NewAgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSlug = searchParams.get('from');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [manifest, setManifest] = useState(JSON.stringify(EMPTY_MANIFEST, null, 2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docData, setDocData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (fromSlug) {
      // Load document data to pre-fill
      fetch(`/api/docs/${fromSlug}`)
        .then((res) => res.json())
        .then((doc) => {
          setDocData(doc);
          setName(doc.title);
          setSlug(fromSlug);
          setDomain(doc.detected_domain || '');

          // Create manifest from doc
          const newManifest = {
            ...EMPTY_MANIFEST,
            metadata: {
              ...EMPTY_MANIFEST.metadata,
              name: doc.title,
              slug: fromSlug,
              domain: doc.detected_domain || '',
              tags: doc.tags || [],
            },
            prd: {
              purpose: doc.metadata?.purpose || '',
              scope: doc.metadata?.summary || '',
              context_problem: doc.metadata?.context || '',
              expected_impacts: doc.metadata?.impacts || [],
              requirements: doc.metadata?.requirements || [],
            },
          };

          setManifest(JSON.stringify(newManifest, null, 2));
        })
        .catch(console.error);
    }
  }, [fromSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const parsedManifest = JSON.parse(manifest);

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          domain,
          manifest: parsedManifest,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create agent');
      }

      const agent = await response.json();
      router.push(`/console/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/console"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Console
          </Link>
          <h1 className="text-2xl font-bold">Create New Agent</h1>
          {fromSlug && (
            <p className="text-gray-600">
              Based on: <span className="font-medium">{docData?.title || fromSlug}</span>
            </p>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Error creating agent</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="My Agent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="my-agent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="healthcare, finance, etc."
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="font-semibold mb-4">Agent Manifest (JSON)</h2>
            <textarea
              value={manifest}
              onChange={(e) => setManifest(e.target.value)}
              className="w-full h-[500px] px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-brand-500"
              spellCheck={false}
            />
            <p className="text-sm text-gray-500 mt-2">
              Edit the JSON manifest to define the agent's PRD, FSM states, tools, and memory
              configuration.
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/console"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
