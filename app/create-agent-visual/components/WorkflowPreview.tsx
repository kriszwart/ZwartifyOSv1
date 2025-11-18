"use client"

import { useState } from 'react'
import { useAgentConfig } from '../hooks/useAgentConfig'
import type { CustomNode } from '../types'

interface WorkflowPreviewProps {
  nodes: CustomNode[]
}

export default function WorkflowPreview({ nodes }: WorkflowPreviewProps) {
  const agentConfig = useAgentConfig(nodes)
  const [testInput, setTestInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [executionTrace, setExecutionTrace] = useState<any[]>([])

  const handleRunTest = async () => {
    if (!agentConfig || !agentConfig.name || !testInput.trim()) {
      return
    }

    setIsRunning(true)
    setTestResult(null)
    setExecutionTrace([])

    try {
      // Create a temporary agent for testing
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${agentConfig.name}_test_${Date.now()}`,
          description: agentConfig.description,
          prompt: agentConfig.prompt,
          enabled: true,
          useMemory: agentConfig.useMemory,
          version: agentConfig.version,
          ragFolderId: agentConfig.ragFolderId || '',
          skillIds: agentConfig.skillIds || [],
          metadata: {
            mcpServers: agentConfig.mcpServers || [],
            toolNames: agentConfig.toolNames || [],
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const testAgentId = data.agent.id

        // Run the agent
        const runResponse = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: testInput,
            agentId: testAgentId,
          }),
        })

        if (runResponse.ok) {
          const runData = await runResponse.json()
          setTestResult(runData.text || runData.output || 'No response')
          
          // Try to get execution trace
          if (runData.executionId) {
            try {
              const traceResponse = await fetch(`/api/agents/${testAgentId}/executions/${runData.executionId}/logs`)
              if (traceResponse.ok) {
                const traceData = await traceResponse.json()
                setExecutionTrace(traceData.logs || [])
              }
            } catch (e) {
              // Trace not available
            }
          }
        } else {
          const errorData = await runResponse.json()
          setTestResult(`Error: ${errorData.error || 'Failed to run agent'}`)
        }

        // Clean up test agent
        try {
          await fetch(`/api/agents/${testAgentId}`, { method: 'DELETE' })
        } catch (e) {
          // Ignore cleanup errors
        }
      } else {
        setTestResult('Error: Failed to create test agent')
      }
    } catch (error) {
      console.error('Error running test:', error)
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
    }
  }

  if (!agentConfig) {
    return (
      <div className="bg-black/90 p-4">
        <p className="text-green-400/60 font-mono text-sm">Configure agent to test workflow</p>
      </div>
    )
  }

  return (
    <div className="bg-black/90 p-4 max-h-96 overflow-y-auto">
      <h3 className="text-green-400 font-mono font-bold text-sm mb-3 uppercase tracking-wider">
        Preview & Test
      </h3>
      
      <div className="space-y-3 text-xs font-mono">
        <div>
          <label className="block text-green-400/70 mb-1 text-[10px]">Test Input:</label>
          <textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter test input..."
            className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 text-xs focus:outline-none focus:border-green-400 resize-none"
            rows={3}
          />
        </div>
        
        <button
          onClick={handleRunTest}
          disabled={isRunning || !testInput.trim()}
          className="w-full px-3 py-2 border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running...' : '▶ Run Test'}
        </button>

        {testResult && (
          <div className="mt-3 pt-3 border-t border-green-400/20">
            <div className="text-green-400/70 mb-2 text-[10px] font-semibold">Result:</div>
            <div className="text-green-300/80 text-[11px] bg-black/50 p-2 rounded border border-green-400/20 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {testResult}
            </div>
          </div>
        )}

        {executionTrace.length > 0 && (
          <div className="mt-3 pt-3 border-t border-green-400/20">
            <div className="text-green-400/70 mb-2 text-[10px] font-semibold">Execution Trace:</div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {executionTrace.slice(0, 5).map((log, idx) => (
                <div key={idx} className="text-green-300/60 text-[10px] font-mono">
                  [{log.level}] {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

