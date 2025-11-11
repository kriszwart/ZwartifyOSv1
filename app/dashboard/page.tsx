"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Execution {
  id: string
  agentId: string
  agentName?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  duration?: number
}

interface Agent {
  id: string
  name: string
  enabled: boolean
}

interface DashboardStats {
  totalExecutions: number
  completedExecutions: number
  failedExecutions: number
  runningExecutions: number
  totalAgents: number
  enabledAgents: number
  avgDuration: number
}

interface UsageStats {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  totalCost: number
  executionCount: number
  averageTokensPerExecution: number
  averageCostPerExecution: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [executions, setExecutions] = useState<Execution[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load agents
      const agentsResponse = await fetch('/api/agents')
      const agentsData = await agentsResponse.json()
      setAgents(agentsData.agents || [])

      // Load recent executions from all agents
      const allExecutions: Execution[] = []
      for (const agent of agentsData.agents || []) {
        try {
          const execResponse = await fetch(`/api/agents/${agent.id}/executions?limit=10`)
          const execData = await execResponse.json()
          allExecutions.push(...(execData.executions || []))
        } catch (error) {
          console.error(`Error loading executions for agent ${agent.id}:`, error)
        }
      }

      // Sort by most recent
      allExecutions.sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )

      setExecutions(allExecutions.slice(0, 20))

      // Calculate stats
      const completed = allExecutions.filter(e => e.status === 'completed').length
      const failed = allExecutions.filter(e => e.status === 'failed').length
      const running = allExecutions.filter(e => e.status === 'running').length
      const durations = allExecutions
        .filter(e => e.duration !== undefined)
        .map(e => e.duration!)
      const avgDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0

      setStats({
        totalExecutions: allExecutions.length,
        completedExecutions: completed,
        failedExecutions: failed,
        runningExecutions: running,
        totalAgents: agentsData.agents?.length || 0,
        enabledAgents: agentsData.agents?.filter((a: Agent) => a.enabled).length || 0,
        avgDuration: Math.round(avgDuration),
      })

      // Load usage statistics
      try {
        const usageResponse = await fetch('/api/usage/stats')
        if (usageResponse.ok) {
          const usageData = await usageResponse.json()
          setUsageStats(usageData.stats)
        }
      } catch (error) {
        console.error('Error loading usage stats:', error)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: Execution['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 border-green-400/50 bg-green-400/10'
      case 'failed':
        return 'text-red-400 border-red-400/50 bg-red-400/10'
      case 'running':
        return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10'
      case 'pending':
        return 'text-blue-400 border-blue-400/50 bg-blue-400/10'
      default:
        return 'text-gray-400 border-gray-400/50 bg-gray-400/10'
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none" />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="border-b border-green-400/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              ← HOME
            </Link>
            <span className="text-green-400/50">|</span>
            <button
              onClick={() => window.history.back()}
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              ← Back
            </button>
          </div>
          <h1 className="text-2xl font-bold font-mono">Dashboard</h1>
          <div className="flex gap-4">
            <Link
              href="/agents"
              className="text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              Agents
            </Link>
            <Link
              href="/agent"
              className="text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              Test Agent
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12 text-green-400/60 font-mono">
              Loading dashboard...
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
                  <div className="text-sm text-green-400/60 font-mono mb-2">Total Executions</div>
                  <div className="text-3xl font-bold text-green-400">
                    {stats?.totalExecutions || 0}
                  </div>
                </div>
                <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
                  <div className="text-sm text-green-400/60 font-mono mb-2">Completed</div>
                  <div className="text-3xl font-bold text-green-400">
                    {stats?.completedExecutions || 0}
                  </div>
                </div>
                <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
                  <div className="text-sm text-green-400/60 font-mono mb-2">Failed</div>
                  <div className="text-3xl font-bold text-red-400">
                    {stats?.failedExecutions || 0}
                  </div>
                </div>
                <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
                  <div className="text-sm text-green-400/60 font-mono mb-2">Running</div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {stats?.runningExecutions || 0}
                  </div>
                </div>
                <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
                  <div className="text-sm text-green-400/60 font-mono mb-2">Total Agents</div>
                  <div className="text-3xl font-bold text-green-400">
                    {stats?.totalAgents || 0}
                  </div>
                </div>
                <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
                  <div className="text-sm text-green-400/60 font-mono mb-2">Enabled Agents</div>
                  <div className="text-3xl font-bold text-green-400">
                    {stats?.enabledAgents || 0}
                  </div>
                </div>
                <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
                  <div className="text-sm text-green-400/60 font-mono mb-2">Avg Duration</div>
                  <div className="text-3xl font-bold text-green-400">
                    {stats?.avgDuration ? `${stats.avgDuration}ms` : 'N/A'}
                  </div>
                </div>
                <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
                  <div className="text-sm text-green-400/60 font-mono mb-2">Success Rate</div>
                  <div className="text-3xl font-bold text-green-400">
                    {stats && stats.totalExecutions > 0
                      ? `${Math.round((stats.completedExecutions / stats.totalExecutions) * 100)}%`
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Token Usage Stats */}
              {usageStats && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-green-400">Token Usage & Costs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-black/50 border-2 border-cyan-400/50 p-6 rounded-lg">
                      <div className="text-sm text-cyan-400/60 font-mono mb-2">Total Tokens</div>
                      <div className="text-3xl font-bold text-cyan-400">
                        {usageStats.totalTokens.toLocaleString()}
                      </div>
                      <div className="text-xs text-cyan-400/50 font-mono mt-1">
                        {usageStats.inputTokens.toLocaleString()} in / {usageStats.outputTokens.toLocaleString()} out
                      </div>
                    </div>
                    <div className="bg-black/50 border-2 border-purple-400/50 p-6 rounded-lg">
                      <div className="text-sm text-purple-400/60 font-mono mb-2">Estimated Cost</div>
                      <div className="text-3xl font-bold text-purple-400">
                        ${usageStats.totalCost.toFixed(4)}
                      </div>
                      <div className="text-xs text-purple-400/50 font-mono mt-1">
                        ${usageStats.averageCostPerExecution.toFixed(4)} avg per execution
                      </div>
                    </div>
                    <div className="bg-black/50 border-2 border-yellow-400/50 p-6 rounded-lg">
                      <div className="text-sm text-yellow-400/60 font-mono mb-2">Avg Tokens/Execution</div>
                      <div className="text-3xl font-bold text-yellow-400">
                        {usageStats.averageTokensPerExecution.toLocaleString()}
                      </div>
                      <div className="text-xs text-yellow-400/50 font-mono mt-1">
                        {usageStats.executionCount} executions tracked
                      </div>
                    </div>
                    <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
                      <div className="text-sm text-green-400/60 font-mono mb-2">Cost Efficiency</div>
                      <div className="text-3xl font-bold text-green-400">
                        ${(usageStats.totalCost / Math.max(usageStats.executionCount, 1)).toFixed(4)}
                      </div>
                      <div className="text-xs text-green-400/50 font-mono mt-1">
                        per execution
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Executions */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-green-400">Recent Executions</h2>
                {executions.length === 0 ? (
                  <div className="text-center py-12 text-green-400/60 font-mono">
                    No executions yet. Run an agent to see executions here.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {executions.map((execution) => (
                      <Link
                        key={execution.id}
                        href={`/agents/${execution.agentId}/logs`}
                        className="block bg-black/50 border-2 border-green-400/50 p-4 rounded-lg hover:bg-green-400/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-green-400">
                                {execution.agentName || execution.agentId}
                              </span>
                              <span className={`px-2 py-1 text-xs font-mono border ${getStatusColor(execution.status)}`}>
                                {execution.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-green-300/80 mb-1 line-clamp-1">
                              {execution.input || 'No input'}
                            </div>
                            <div className="text-xs text-green-400/60 font-mono">
                              {new Date(execution.startedAt).toLocaleString()}
                              {execution.duration && ` • ${execution.duration}ms`}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Agents Overview */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-green-400">Agents</h2>
                {agents.length === 0 ? (
                  <div className="text-center py-12 text-green-400/60 font-mono">
                    No agents found. Create your first agent.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((agent) => (
                      <Link
                        key={agent.id}
                        href={`/agents/${agent.id}/logs`}
                        className="block bg-black/50 border-2 border-green-400/50 p-4 rounded-lg hover:bg-green-400/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-green-400">{agent.name}</span>
                          <span
                            className={`px-2 py-1 text-xs font-mono border ${
                              agent.enabled
                                ? 'border-green-400/50 bg-green-400/10 text-green-400'
                                : 'border-red-400/50 bg-red-400/10 text-red-400'
                            }`}
                          >
                            {agent.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="text-xs text-green-400/60 font-mono">
                          View logs →
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

