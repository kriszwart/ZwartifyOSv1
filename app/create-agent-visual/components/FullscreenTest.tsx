"use client"

import { useState, useEffect, useRef } from 'react'
import { useAgentConfig } from '../hooks/useAgentConfig'
import type { CustomNode } from '../types'

interface FullscreenTestProps {
  nodes: CustomNode[]
  onClose: () => void
}

interface ExecutionStep {
  type: 'info' | 'tool' | 'response' | 'thinking' | 'error'
  message: string
  timestamp: number
  data?: any
}

const examplePrompts = [
  "Build me a Slack bot that monitors customer feedback",
  "Build me an agent that helps write marketing copy",
  "Build me a system to automate social media posts",
  "Create an agent that analyzes code and suggests improvements",
  "Build a research assistant that synthesizes findings from multiple sources",
]

export default function FullscreenTest({ nodes, onClose }: FullscreenTestProps) {
  const agentConfig = useAgentConfig(nodes)
  const [testInput, setTestInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState('')
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])
  const [testAgentId, setTestAgentId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const responseRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [executionSteps, streamingResponse])

  // Auto-scroll response
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [streamingResponse])

  const addStep = (step: Omit<ExecutionStep, 'timestamp'>) => {
    setExecutionSteps(prev => [...prev, { ...step, timestamp: Date.now() }])
    setCurrentStep(prev => prev + 1)
  }

  const handleRunTest = async () => {
    if (!agentConfig || !agentConfig.name || !testInput.trim()) {
      return
    }

    setIsRunning(true)
    setStreamingResponse('')
    setExecutionSteps([])
    setCurrentStep(0)

    try {
      // Step 1: Create test agent
      addStep({ type: 'info', message: 'Creating test agent...' })
      await new Promise(resolve => setTimeout(resolve, 500))

      const createResponse = await fetch('/api/agents', {
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

      if (!createResponse.ok) {
        addStep({ type: 'error', message: 'Failed to create test agent' })
        setIsRunning(false)
        return
      }

      const createData = await createResponse.json()
      const agentId = createData.agent.id
      setTestAgentId(agentId)

      addStep({ type: 'info', message: 'Agent created successfully' })
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 2: Configure agent
      if (agentConfig.useMemory) {
        addStep({ type: 'info', message: 'Adding conversation memory context' })
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      if (agentConfig.skillIds.length > 0) {
        addStep({ type: 'info', message: `Auto-detected ${agentConfig.skillIds.length} relevant skill${agentConfig.skillIds.length > 1 ? 's' : ''}` })
        await new Promise(resolve => setTimeout(resolve, 200))
        addStep({ type: 'info', message: 'Adding Skills context to prompt' })
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      if (agentConfig.toolNames.length > 0) {
        addStep({ type: 'info', message: `Loading ${agentConfig.toolNames.length} tool${agentConfig.toolNames.length > 1 ? 's' : ''}...` })
        await new Promise(resolve => setTimeout(resolve, 300))
        agentConfig.toolNames.forEach((toolName, idx) => {
          setTimeout(() => {
            addStep({ type: 'tool', message: `Tool loaded: ${toolName}`, data: { toolName } })
          }, idx * 150)
        })
        await new Promise(resolve => setTimeout(resolve, agentConfig.toolNames.length * 150))
      }

      if (agentConfig.ragFolderId) {
        addStep({ type: 'info', message: 'Loading RAG knowledge base...' })
        await new Promise(resolve => setTimeout(resolve, 400))
        addStep({ type: 'info', message: 'RAG context initialized' })
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Step 3: Execute agent
      addStep({ type: 'info', message: 'Execution started' })
      addStep({ type: 'thinking', message: 'Agent is thinking...' })

      // Try streaming endpoint first
      try {
        const streamResponse = await fetch('/api/agent/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: testInput,
            agentId: agentId,
          }),
        })

        if (streamResponse.ok && streamResponse.body) {
          const reader = streamResponse.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const data = JSON.parse(line)
                  if (data.type === 'text') {
                    setStreamingResponse(prev => prev + data.content)
                  } else if (data.type === 'tool_call') {
                    addStep({ type: 'tool', message: `Calling tool: ${data.tool}`, data })
                  } else if (data.type === 'tool_result') {
                    addStep({ type: 'info', message: `Tool result received` })
                  }
                } catch (e) {
                  // Not JSON, treat as plain text
                  setStreamingResponse(prev => prev + line)
                }
              }
            }
          }

          addStep({ type: 'response', message: 'Response stream completed' })
        } else {
          throw new Error('Streaming not available')
        }
      } catch (streamError) {
        // Fallback to regular API
        const runResponse = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: testInput,
            agentId: agentId,
          }),
        })

        if (runResponse.ok) {
          const runData = await runResponse.json()
          
          // Simulate streaming response for better UX
          const responseText = runData.text || runData.output || 'No response received'
          const words = responseText.split(' ')
          
          for (let i = 0; i < words.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 20))
            setStreamingResponse(prev => prev + (i > 0 ? ' ' : '') + words[i])
          }

          addStep({ type: 'response', message: 'Response received' })
        } else {
          const errorData = await runResponse.json()
          addStep({ type: 'error', message: `Error: ${errorData.error || 'Failed to run agent'}` })
        }
        }

        // Clean up test agent
        try {
        await fetch(`/api/agents/${agentId}`, { method: 'DELETE' })
        } catch (e) {
          // Ignore cleanup errors
      }
    } catch (error) {
      console.error('Error running test:', error)
      addStep({ type: 'error', message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` })
    } finally {
      setIsRunning(false)
      setTestAgentId(null)
    }
  }

  const handleExampleClick = (example: string) => {
    setTestInput(example)
  }

  if (!agentConfig) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />

      {/* Header */}
      <div className="relative border-b border-green-400/30 p-4 flex items-center justify-between bg-black/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-2 bg-green-400/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-12 h-12 rounded-full bg-green-400/20 border-2 border-green-400 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
          </div>
        <div>
            <h2 className="text-2xl font-bold font-mono text-green-400 mb-1 flex items-center gap-2">
              Agent Test Console
              {isRunning && (
                <span className="text-sm animate-pulse">⚡</span>
              )}
          </h2>
            <p className="text-green-400/60 text-sm font-mono">
              {agentConfig.name || 'Untitled Agent'}
          </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 border-2 border-green-400/50 text-green-400 hover:bg-green-400/10 hover:border-green-400 transition-all font-mono text-sm rounded"
        >
          ✕ Close
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input & Examples */}
        <div className="w-1/3 border-r border-green-400/20 p-6 flex flex-col bg-black/50 backdrop-blur-sm">
          <div className="mb-6">
            <label className="block text-green-400 font-mono font-bold text-sm mb-3 flex items-center gap-2">
              <span className="text-lg">💬</span>
              Test Input
              </label>
            <div className="relative">
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Enter your test prompt here..."
                className="w-full px-4 py-3 bg-black/80 border-2 border-green-400/30 text-green-400 font-mono text-sm focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(0,255,0,0.2)] resize-none rounded transition-all"
                rows={6}
                disabled={isRunning}
                style={{
                  backdropFilter: 'blur(10px)',
                }}
              />
              {testInput && (
                <button
                  onClick={() => setTestInput('')}
                  className="absolute top-2 right-2 text-green-400/50 hover:text-green-400 transition-colors"
                  disabled={isRunning}
                >
                  ✕
                </button>
              )}
            </div>
            {testInput && (
              <div className="mt-2 text-green-400/50 font-mono text-xs">
                {testInput.length} characters
              </div>
            )}
            </div>

          <div className="mb-6">
            <div className="text-green-400/70 font-mono text-xs mb-3 uppercase tracking-wider flex items-center gap-2">
              <span>📋</span>
              Example Prompts:
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {examplePrompts.map((example, idx) => (
                  <button
                    key={idx}
                  onClick={() => handleExampleClick(example)}
                    disabled={isRunning}
                  className={`w-full text-left px-3 py-2.5 border transition-all font-mono text-xs rounded relative overflow-hidden group ${
                    testInput === example
                      ? 'border-green-400 bg-green-400/20 text-green-400'
                      : 'border-green-400/20 text-green-400/80 hover:border-green-400/50 hover:bg-green-400/10 hover:text-green-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="relative z-10">{example}</span>
                  {testInput === example && (
                    <div className="absolute inset-0 bg-green-400/10 animate-pulse" />
                  )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunTest}
              disabled={isRunning || !testInput.trim()}
            className={`w-full px-6 py-4 border-2 font-mono text-base font-bold transition-all rounded relative overflow-hidden group ${
                isRunning
                  ? 'border-green-400/50 text-green-400/50 cursor-not-allowed'
                : 'border-green-400 text-green-400 hover:bg-green-400 hover:text-black hover:shadow-[0_0_30px_rgba(0,255,0,0.5)]'
              }`}
            style={{
              boxShadow: isRunning ? 'none' : '0 0 20px rgba(0, 255, 0, 0.2)',
            }}
            >
              {isRunning ? (
              <span className="flex items-center justify-center gap-3">
                <span className="animate-spin text-xl">⚙</span>
                <span>Running...</span>
              </span>
            ) : (
                <span className="flex items-center justify-center gap-2">
                <span className="text-xl">▶</span>
                <span>Run Test</span>
              </span>
            )}
            {!isRunning && testInput.trim() && (
              <div className="absolute inset-0 bg-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        </div>

        {/* Right Panel - Execution & Response */}
        <div className="flex-1 flex flex-col bg-black">
          {/* Execution Trace */}
          <div className="h-1/2 border-b border-green-400/20 p-6 flex flex-col bg-black/30 backdrop-blur-sm">
            <div className="text-green-400 font-mono font-bold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">📊</span>
              Execution Trace
              {executionSteps.length > 0 && (
                <span className="text-green-400/50 text-xs normal-case">
                  ({executionSteps.length} steps)
                </span>
              )}
                  </div>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-2 font-mono text-xs"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0, 255, 0, 0.3) transparent',
              }}
            >
              {executionSteps.length === 0 && !isRunning && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-green-400/40 italic mb-2">Execution trace will appear here...</div>
                    <div className="text-green-400/20 text-[10px]">Real-time step-by-step execution log</div>
                  </div>
                </div>
              )}
              {executionSteps.map((step, idx) => {
                const isLatest = idx === executionSteps.length - 1
                const stepColors = {
                  info: { bg: 'bg-green-400/10', border: 'border-green-400/30', text: 'text-green-400', icon: 'ℹ' },
                  tool: { bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', text: 'text-yellow-400', icon: '🔧' },
                  response: { bg: 'bg-green-400/15', border: 'border-green-400/40', text: 'text-green-400', icon: '✓' },
                  thinking: { bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', text: 'text-cyan-400', icon: '💭' },
                  error: { bg: 'bg-red-400/10', border: 'border-red-400/30', text: 'text-red-400', icon: '✗' },
                }
                const colors = stepColors[step.type]
                
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all relative ${
                      isLatest 
                        ? `${colors.bg} ${colors.border} animate-fade-in shadow-lg` 
                        : `${colors.bg} ${colors.border} hover:shadow-md`
                    }`}
                    style={{
                      animation: isLatest ? 'fadeIn 0.5s ease-in' : 'none',
                      boxShadow: isLatest ? `0 0 20px ${colors.text}40` : 'none',
                    }}
                  >
                    {isLatest && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-400 rounded-full animate-pulse" />
                    )}
                    <span className={`text-xl ${colors.text}`}>
                      {colors.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold ${colors.text} break-words`}>
                        {step.message}
                      </div>
                      {step.data && step.data.toolName && (
                        <div className="mt-2 px-2 py-1 bg-yellow-400/20 border border-yellow-400/40 rounded text-yellow-400 text-[10px] font-mono inline-block">
                          🔧 Tool: {step.data.toolName}
                        </div>
                      )}
                    </div>
                    <span className="text-green-400/40 text-[10px] font-mono whitespace-nowrap">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )
              })}
              {isRunning && executionSteps.length === 0 && (
                <div className="flex items-center gap-2 text-green-400/60">
                  <span className="animate-spin">⚙</span>
                  <span>Initializing...</span>
              </div>
            )}
          </div>
        </div>

          {/* Response Area */}
          <div className="flex-1 p-6 flex flex-col bg-black/30 backdrop-blur-sm">
            <div className="text-green-400 font-mono font-bold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="text-lg">💬</span>
              Agent Response
              {streamingResponse && (
                <span className="text-green-400/50 text-xs normal-case">
                  ({streamingResponse.length} chars)
                </span>
              )}
            </div>
            <div
              ref={responseRef}
              className="flex-1 overflow-y-auto bg-black/80 border-2 border-green-400/20 rounded-lg p-6 relative backdrop-blur-sm"
              style={{
                boxShadow: streamingResponse 
                  ? '0 0 40px rgba(0, 255, 0, 0.2), inset 0 0 20px rgba(0, 255, 0, 0.05)' 
                  : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {streamingResponse ? (
                <div className="text-green-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {streamingResponse}
                  {isRunning && (
                    <span 
                      className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse"
                      style={{
                        boxShadow: '0 0 10px rgba(0, 255, 0, 1)',
                        animation: 'blink-cursor 1s infinite',
                      }}
                    >
                      |
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    {isRunning ? (
                      <>
                        <div className="flex items-center justify-center gap-3 text-green-400">
                          <div className="relative">
                            <div className="absolute inset-0 bg-green-400/30 rounded-full blur-xl animate-pulse" />
                            <span className="relative animate-spin text-3xl block">⚙</span>
                          </div>
                          <span className="font-mono text-lg">Agent is processing...</span>
                        </div>
                        <div className="text-green-400/60 font-mono text-xs">
                          Response will stream here in real-time
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-4">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                              style={{
                                animationDelay: `${i * 0.2}s`,
                              }}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-green-400/40 italic font-mono text-sm">
                          Response will appear here...
                        </div>
                        <div className="text-green-400/20 font-mono text-[10px]">
                          Agent output will stream in real-time
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
          </div>

      {/* Status Bar */}
      <div className="border-t border-green-400/20 p-4 bg-black/95 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-6 font-mono text-xs">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${
            isRunning 
              ? 'text-green-400 border-green-400/50 bg-green-400/10' 
              : 'text-green-400/70 border-green-400/20 bg-green-400/5'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.8)]' : 'bg-green-400/50'
            }`} />
            <span className="font-semibold">{isRunning ? 'Running' : 'Ready'}</span>
          </div>
          {agentConfig.toolNames.length > 0 && (
            <div className="px-3 py-1.5 rounded border border-yellow-400/30 bg-yellow-400/10 text-yellow-400/80">
              🔧 {agentConfig.toolNames.length} Tool{agentConfig.toolNames.length !== 1 ? 's' : ''}
            </div>
          )}
          {agentConfig.skillIds.length > 0 && (
            <div className="px-3 py-1.5 rounded border border-purple-400/30 bg-purple-400/10 text-purple-400/80">
              🧠 {agentConfig.skillIds.length} Skill{agentConfig.skillIds.length !== 1 ? 's' : ''}
            </div>
          )}
          {agentConfig.ragFolderId && (
            <div className="px-3 py-1.5 rounded border border-cyan-400/30 bg-cyan-400/10 text-cyan-400/80">
              📚 RAG Enabled
            </div>
          )}
          {agentConfig.useMemory && (
            <div className="px-3 py-1.5 rounded border border-blue-400/30 bg-blue-400/10 text-blue-400/80">
              💾 Memory
                  </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {executionSteps.length > 0 && (
            <div className="text-green-400/70 font-mono text-xs">
              {executionSteps.length} step{executionSteps.length !== 1 ? 's' : ''} executed
            </div>
          )}
          {streamingResponse && (
            <div className="text-green-400/70 font-mono text-xs">
              {streamingResponse.split(' ').length} words
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
