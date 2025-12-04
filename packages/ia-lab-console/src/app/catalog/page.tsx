'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, FileText, GitBranch, Search, Filter, Tag } from 'lucide-react';
import type { CatalogEntry } from '@/lib/api';

export default function CatalogPage() {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [showFsmOnly, setShowFsmOnly] = useState(false);
  const [showMultiagentOnly, setShowMultiagentOnly] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        // Try to load from API first
        const response = await fetch('/api/catalog');
        if (response.ok) {
          const data = await response.json();
          setEntries(data.entries || []);
        } else {
          // Fallback to static catalog.json
          const staticResponse = await fetch('/content/catalog.json');
          if (staticResponse.ok) {
            const data = await staticResponse.json();
            setEntries(data.entries || []);
          }
        }
      } catch (error) {
        console.error('Failed to load catalog:', error);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const domains = [...new Set(entries.map((e) => e.detected_domain).filter(Boolean))];

  const filteredEntries = entries.filter((entry) => {
    if (searchQuery && !entry.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedDomain && entry.detected_domain !== selectedDomain) {
      return false;
    }
    if (showFsmOnly && !entry.has_fsm) {
      return false;
    }
    if (showMultiagentOnly && !entry.is_flow_multiagent) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Bot className="h-6 w-6 text-brand-600" />
                <span className="font-semibold">IA Lab</span>
              </Link>
              <h1 className="text-2xl font-bold">Agent Catalog</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Browse and explore agent specifications from PrototipeAI
              </p>
            </div>
            <Link
              href="/console/agents/new"
              className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
            >
              Create Agent
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Domain filter */}
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Domains</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>

          {/* FSM filter */}
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showFsmOnly}
              onChange={(e) => setShowFsmOnly(e.target.checked)}
              className="rounded text-brand-600"
            />
            <GitBranch className="h-4 w-4" />
            <span className="text-sm">FSM Only</span>
          </label>

          {/* Multi-agent filter */}
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showMultiagentOnly}
              onChange={(e) => setShowMultiagentOnly(e.target.checked)}
              className="rounded text-brand-600"
            />
            <Bot className="h-4 w-4" />
            <span className="text-sm">Multi-Agent</span>
          </label>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-600 mb-4">
          Showing {filteredEntries.length} of {entries.length} entries
        </p>

        {/* Entries grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading catalog...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No entries found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters or run the ingestor to import content
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => (
              <Link
                key={entry.slug}
                href={`/docs/${entry.slug}`}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold mb-2 line-clamp-2">{entry.title}</h3>

                <div className="flex items-center gap-2 mb-3">
                  {entry.detected_domain && (
                    <span className="text-xs px-2 py-1 bg-brand-100 text-brand-700 rounded">
                      {entry.detected_domain}
                    </span>
                  )}
                  {entry.has_fsm && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                      <GitBranch className="h-3 w-3" /> FSM
                    </span>
                  )}
                  {entry.is_flow_multiagent && (
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded flex items-center gap-1">
                      <Bot className="h-3 w-3" /> Multi-Agent
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {entry.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {entry.tags.length > 4 && (
                    <span className="text-xs text-gray-500">
                      +{entry.tags.length - 4} more
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
