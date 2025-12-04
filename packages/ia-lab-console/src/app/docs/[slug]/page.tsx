'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, ArrowLeft, ExternalLink, GitBranch, Tag, Plus } from 'lucide-react';

interface DocData {
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

export default function DocPage({ params }: { params: { slug: string } }) {
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDoc() {
      try {
        const response = await fetch(`/api/docs/${params.slug}`);
        if (response.ok) {
          const data = await response.json();
          setDoc(data);
        } else if (response.status === 404) {
          setError('Document not found');
        } else {
          setError('Failed to load document');
        }
      } catch (err) {
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">{error || 'Document not found'}</p>
          <Link href="/catalog" className="text-brand-600 hover:underline">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/catalog"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Catalog
            </Link>
            <div className="flex items-center gap-2">
              {doc.source_url && (
                <a
                  href={doc.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                >
                  <ExternalLink className="h-4 w-4" />
                  Source
                </a>
              )}
              <Link
                href={`/console/agents/new?from=${doc.slug}`}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Agent
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Title and metadata */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{doc.title}</h1>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            {doc.detected_domain && (
              <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm">
                {doc.detected_domain}
              </span>
            )}
            {doc.has_fsm && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                <GitBranch className="h-3 w-3" /> FSM-based
              </span>
            )}
            {doc.is_flow_multiagent && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                <Bot className="h-3 w-3" /> Multi-Agent
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {doc.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-sm flex items-center gap-1"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Metadata summary */}
        {doc.metadata && Object.keys(doc.metadata).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-8">
            <h2 className="font-semibold mb-3">Summary</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doc.metadata.summary && (
                <div>
                  <dt className="text-sm text-gray-500">Summary</dt>
                  <dd className="text-sm">{String(doc.metadata.summary)}</dd>
                </div>
              )}
              {doc.metadata.purpose && (
                <div>
                  <dt className="text-sm text-gray-500">Purpose</dt>
                  <dd className="text-sm">{String(doc.metadata.purpose)}</dd>
                </div>
              )}
              {doc.metadata.requirements && Array.isArray(doc.metadata.requirements) && (
                <div className="col-span-2">
                  <dt className="text-sm text-gray-500">
                    Requirements ({(doc.metadata.requirements as unknown[]).length})
                  </dt>
                  <dd className="text-sm">
                    {(doc.metadata.requirements as Array<{ id: string }>)
                      .map((r) => r.id)
                      .join(', ')}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Main content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <article className="prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}
