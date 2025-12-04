'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Run {
  id: string;
  agent_id: string;
  agent_version: string;
  session_id: string;
  status: string;
  total_tokens: number;
  total_cost: number;
  total_latency_ms: number;
  created_at: string;
}

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRuns() {
      try {
        const response = await fetch('/api/runs');
        if (response.ok) {
          const data = await response.json();
          setRuns(data.runs || []);
        }
      } catch (error) {
        console.error('Failed to load runs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadRuns();
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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
          <h1 className="text-2xl font-bold">Agent Runs</h1>
          <p className="text-gray-600">View execution history and details</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No runs yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Runs will appear here when agents are executed
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Run ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Agent</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Version</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tokens</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Cost</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Duration</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">{statusIcon(run.status)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/console/runs/${run.id}`}
                        className="text-brand-600 hover:underline font-mono text-sm"
                      >
                        {run.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">{run.agent_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm">{run.agent_version}</td>
                    <td className="px-4 py-3 text-sm">{run.total_tokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">${run.total_cost.toFixed(4)}</td>
                    <td className="px-4 py-3 text-sm">{(run.total_latency_ms / 1000).toFixed(2)}s</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
