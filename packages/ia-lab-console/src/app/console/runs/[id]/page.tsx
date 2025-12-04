'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Cpu, DollarSign, CheckCircle, XCircle, PlayCircle } from 'lucide-react';

interface Run {
  id: string;
  agent_id: string;
  agent_version: string;
  session_id: string;
  status: string;
  total_tokens: number;
  total_cost: number;
  total_latency_ms: number;
  steps: RunStep[];
  created_at: string;
  completed_at?: string;
}

interface RunStep {
  id: string;
  step_number: number;
  state: string;
  input?: string;
  output?: string;
  tool_calls?: unknown[];
  tool_results?: unknown[];
  tokens_total: number;
  cost_estimate: number;
  latency_ms: number;
}

export default function RunPage({ params }: { params: { id: string } }) {
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRun() {
      try {
        const response = await fetch(`/api/runs/${params.id}`);
        if (response.ok) {
          setRun(await response.json());
        } else if (response.status === 404) {
          setError('Run not found');
        } else {
          setError('Failed to load run');
        }
      } catch (err) {
        setError('Failed to load run');
      } finally {
        setLoading(false);
      }
    }
    loadRun();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">{error || 'Run not found'}</p>
          <Link href="/console/runs" className="text-brand-600 hover:underline">
            Back to Runs
          </Link>
        </div>
      </div>
    );
  }

  const statusIcon = {
    running: <PlayCircle className="h-5 w-5 text-blue-500" />,
    completed: <CheckCircle className="h-5 w-5 text-green-500" />,
    failed: <XCircle className="h-5 w-5 text-red-500" />,
    cancelled: <XCircle className="h-5 w-5 text-gray-500" />,
  }[run.status] || <PlayCircle className="h-5 w-5" />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/console/runs"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Runs
          </Link>
          <div className="flex items-center gap-3">
            {statusIcon}
            <h1 className="text-2xl font-bold">Run {run.id.slice(0, 8)}</h1>
            <span
              className={`px-2 py-1 rounded text-sm ${
                run.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : run.status === 'failed'
                  ? 'bg-red-100 text-red-700'
                  : run.status === 'running'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {run.status}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Duration</span>
            </div>
            <p className="text-xl font-semibold">{(run.total_latency_ms / 1000).toFixed(2)}s</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Cpu className="h-4 w-4" />
              <span className="text-sm">Tokens</span>
            </div>
            <p className="text-xl font-semibold">{run.total_tokens.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Cost</span>
            </div>
            <p className="text-xl font-semibold">${run.total_cost.toFixed(4)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <span className="text-sm">Steps</span>
            </div>
            <p className="text-xl font-semibold">{run.steps.length}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-6">Run Timeline</h2>

          <div className="space-y-4">
            {run.steps.map((step, index) => (
              <div key={step.id} className="relative pl-8">
                {/* Timeline line */}
                {index < run.steps.length - 1 && (
                  <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200" />
                )}

                {/* Step marker */}
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                  {step.step_number}
                </div>

                {/* Step content */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">State: {step.state}</span>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{step.latency_ms}ms</span>
                      <span>{step.tokens_total} tokens</span>
                      <span>${step.cost_estimate.toFixed(4)}</span>
                    </div>
                  </div>

                  {step.input && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-500">Input:</span>
                      <p className="text-sm bg-gray-50 p-2 rounded mt-1">{step.input}</p>
                    </div>
                  )}

                  {step.tool_calls && (step.tool_calls as unknown[]).length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-500">Tool Calls:</span>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(step.tool_calls, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.output && (
                    <div>
                      <span className="text-sm text-gray-500">Output:</span>
                      <p className="text-sm bg-gray-50 p-2 rounded mt-1">{step.output}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
