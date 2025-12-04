'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, FileText, Activity, Settings, Plus, ArrowRight } from 'lucide-react';

interface Stats {
  agents: number;
  runs: number;
  documents: number;
}

export default function ConsolePage() {
  const [stats, setStats] = useState<Stats>({ agents: 0, runs: 0, documents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [agentsRes, runsRes, catalogRes] = await Promise.all([
          fetch('/api/agents').catch(() => null),
          fetch('/api/runs').catch(() => null),
          fetch('/api/catalog').catch(() => null),
        ]);

        const agents = agentsRes?.ok ? await agentsRes.json() : { total: 0 };
        const runs = runsRes?.ok ? await runsRes.json() : { total: 0 };
        const catalog = catalogRes?.ok ? await catalogRes.json() : { total: 0 };

        setStats({
          agents: agents.total || 0,
          runs: runs.total || 0,
          documents: catalog.total || 0,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Bot className="h-8 w-8 text-brand-600" />
            <span className="text-xl font-bold">IA Lab</span>
          </Link>

          <nav className="space-y-2">
            <Link
              href="/console"
              className="flex items-center gap-3 px-3 py-2 bg-brand-50 text-brand-700 rounded-lg"
            >
              <Activity className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/console/agents"
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Bot className="h-5 w-5" />
              Agents
            </Link>
            <Link
              href="/console/runs"
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Activity className="h-5 w-5" />
              Runs
            </Link>
            <Link
              href="/catalog"
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <FileText className="h-5 w-5" />
              Catalog
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/console/settings"
            className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-600">Welcome to IA Lab Console</p>
            </div>
            <Link
              href="/console/agents/new"
              className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Agent
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <Bot className="h-8 w-8 text-brand-600" />
                <span className="text-3xl font-bold">{loading ? '-' : stats.agents}</span>
              </div>
              <h3 className="font-semibold">Agents</h3>
              <p className="text-sm text-gray-600">Active agent definitions</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="h-8 w-8 text-green-600" />
                <span className="text-3xl font-bold">{loading ? '-' : stats.runs}</span>
              </div>
              <h3 className="font-semibold">Runs</h3>
              <p className="text-sm text-gray-600">Total agent runs</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <FileText className="h-8 w-8 text-purple-600" />
                <span className="text-3xl font-bold">{loading ? '-' : stats.documents}</span>
              </div>
              <h3 className="font-semibold">Documents</h3>
              <p className="text-sm text-gray-600">Imported specifications</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/console/agents/new"
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Plus className="h-5 w-5 text-brand-600" />
                    <span>Create new agent</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link
                  href="/catalog"
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <span>Browse catalog</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link
                  href="/console/runs"
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>View recent runs</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4">Getting Started</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                    1
                  </span>
                  <p>
                    <strong>Import content:</strong> Run{' '}
                    <code className="bg-gray-100 px-1 rounded">pnpm ingest:prototipe</code> to
                    import agent specifications
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                    2
                  </span>
                  <p>
                    <strong>Browse catalog:</strong> Explore imported specifications and their
                    requirements
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                    3
                  </span>
                  <p>
                    <strong>Create agent:</strong> Build an AgentManifest from a specification or
                    from scratch
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                    4
                  </span>
                  <p>
                    <strong>Test & deploy:</strong> Run evals, get approvals, and deploy to
                    production
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
