'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Plus, Tag } from 'lucide-react';

interface Agent {
  id: string;
  slug: string;
  name: string;
  domain: string;
  owner: string;
  risk_level: string;
  tags: string[];
  created_at: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAgents() {
      try {
        const response = await fetch('/api/agents');
        if (response.ok) {
          const data = await response.json();
          setAgents(data.agents || []);
        }
      } catch (error) {
        console.error('Failed to load agents:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAgents();
  }, []);

  const riskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'critical':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/console"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Console
              </Link>
              <h1 className="text-2xl font-bold">Agents</h1>
              <p className="text-gray-600">Manage your AI agent definitions</p>
            </div>
            <Link
              href="/console/agents/new"
              className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Agent
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No agents yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Create your first agent to get started
            </p>
            <Link
              href="/console/agents/new"
              className="inline-block mt-4 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
            >
              Create Agent
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/console/agents/${agent.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{agent.name}</h3>
                    <p className="text-sm text-gray-500 font-mono">{agent.slug}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${riskColor(agent.risk_level)}`}>
                    {agent.risk_level}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-brand-50 text-brand-700 rounded">
                    {agent.domain}
                  </span>
                  <span>Owner: {agent.owner}</span>
                </div>

                {agent.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {agent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded flex items-center gap-1"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
