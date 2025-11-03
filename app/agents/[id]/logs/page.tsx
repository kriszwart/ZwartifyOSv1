"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Execution {
  id: string
  agentId: string
  agentName?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  input: string
  output?: string
  error?: string
  startedAt: string
  completedAt?: string
  duration?: number
  toolCalls?: ToolCall[]
}

interface ToolCall {
  id: string
  toolName: string
  startedAt: string
  completedAt?: string
  duration?: number
  error?: string
}

interface Log {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: unknown
  timestamp: string
}

export default function AgentLogsPage() {
  const params = useParams()
  const agentId = params.id as string
  
  const [executions, setExecutions] = useState<Execution[]>([])
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (agentId) {
      loadExecutions()
    }
  }, [agentId])

  useEffect(() => {
    if (selectedExecution) {
      loadLogs(selectedExecution.id)
    }
  }, [selectedExecution, agentId])

  const loadExecutions = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/executions?limit=50`)
      const data = await response.json()
      setExecutions(data.executions || [])
    } catch (error) {
      console.error('Error loading executions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async (executionId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/executions/${executionId}/logs`)
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error loading logs:', error)
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

  const getLevelColor = (level: Log['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-400'
      case 'warn':
        return 'text-yellow-400'
      case 'debug':
        return 'text-blue-400'
      default:
        return 'text-green-400'
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
          <Link
            href="/agents"
            className="text-green-400 hover:text-green-300 transition-colors font-mono"
          >
            ← Agents
          </Link>
          <h1 className="text-2xl font-bold font-mono">Execution Logs</h1>
          <div className="w-24"></div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Executions List */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-green-400">Executions</h2>
              {loading ? (
                <div className="text-center py-12 text-green-400/60 font-mono">
                  Loading executions...
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-12 text-green-400/60 font-mono">
                  No executions found.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {executions.map((execution) => (
                    <div
                      key={execution.id}
                      onClick={() => setSelectedExecution(execution)}
                      className={`bg-black/50 border-2 p-4 rounded-lg cursor-pointer transition-all ${
                        selectedExecution?.id === execution.id
                          ? 'border-green-400 bg-green-400/10'
                          : 'border-green-400/30 hover:border-green-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-mono border ${getStatusColor(execution.status)}`}>
                          {execution.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-green-400/60 font-mono">
                          {new Date(execution.startedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-green-300 mb-2 line-clamp-2">
                        {execution.input}
                      </div>
                      {execution.duration && (
                        <div className="text-xs text-green-400/60 font-mono">
                          Duration: {execution.duration}ms
                        </div>
                      )}
                      {execution.toolCalls && execution.toolCalls.length > 0 && (
                        <div className="text-xs text-green-400/60 font-mono mt-1">
                          {execution.toolCalls.length} tool call(s)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logs Detail */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-green-400">Execution Details</h2>
              {!selectedExecution ? (
                <div className="text-center py-12 text-green-400/60 font-mono">
                  Select an execution to view details
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Execution Info */}
                  <div className="bg-black/50 border-2 border-green-400/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 text-xs font-mono border ${getStatusColor(selectedExecution.status)}`}>
                        {selectedExecution.status.toUpperCase()}
                      </span>
                      {selectedExecution.duration && (
                        <span className="text-xs text-green-400/60 font-mono">
                          {selectedExecution.duration}ms
                        </span>
                      )}
                    </div>
                    <div className="mb-2">
                      <div className="text-xs text-green-400/60 mb-1 font-mono">Input:</div>
                      <div className="bg-black/50 border border-green-400/20 p-2 rounded text-sm text-green-300">
                        {selectedExecution.input}
                      </div>
                    </div>
                    {selectedExecution.output && (
                      <div className="mb-2">
                        <div className="text-xs text-green-400/60 mb-1 font-mono">Output:</div>
                        <div className="bg-black/50 border border-green-400/20 p-2 rounded text-sm text-green-300 max-h-32 overflow-y-auto">
                          {selectedExecution.output}
                        </div>
                      </div>
                    )}
                    {selectedExecution.error && (
                      <div className="mb-2">
                        <div className="text-xs text-red-400/60 mb-1 font-mono">Error:</div>
                        <div className="bg-red-400/10 border border-red-400/30 p-2 rounded text-sm text-red-400">
                          {selectedExecution.error}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tool Calls */}
                  {selectedExecution.toolCalls && selectedExecution.toolCalls.length > 0 && (
                    <div className="bg-black/50 border-2 border-green-400/50 p-4 rounded-lg">
                      <h3 className="text-sm font-bold mb-3 text-green-400">Tool Calls</h3>
                      <div className="space-y-2">
                        {selectedExecution.toolCalls.map((toolCall) => (
                          <div key={toolCall.id} className="bg-black/50 border border-green-400/20 p-2 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-mono text-green-400">{toolCall.toolName}</span>
                              {toolCall.duration && (
                                <span className="text-xs text-green-400/60 font-mono">
                                  {toolCall.duration}ms
                                </span>
                              )}
                            </div>
                            {toolCall.error && (
                              <div className="text-xs text-red-400 mt-1">{toolCall.error}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Logs */}
                  <div className="bg-black/50 border-2 border-green-400/50 p-4 rounded-lg">
                    <h3 className="text-sm font-bold mb-3 text-green-400">Logs</h3>
                    <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
                      {logs.length === 0 ? (
                        <div className="text-green-400/60">No logs available</div>
                      ) : (
                        logs.map((log) => (
                          <div key={log.id} className="flex gap-2">
                            <span className="text-green-400/40">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className={getLevelColor(log.level)}>
                              [{log.level.toUpperCase()}]
                            </span>
                            <span className="text-green-300">{log.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

