"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ExecutionLog {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  data?: unknown
}

interface Agent {
  id: string
  name: string
  description?: string
  createdAt?: string
  createdByAgentId?: string | null
}

export default function CreateAgentPage() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [gsacAgentId, setGsacAgentId] = useState<string | null>(null)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [reasoningLogs, setReasoningLogs] = useState<ExecutionLog[]>([])
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null)
  const [showReasoningDetails, setShowReasoningDetails] = useState(true)
  const [tokenUsage, setTokenUsage] = useState<{
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCost: number
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load G-SAC agent ID
    const loadGSAC = async () => {
      try {
        const response = await fetch('/api/agents/by-name/g-sac')
        if (response.ok) {
          const data = await response.json()
          setGsacAgentId(data.agent.id)
        }
      } catch (error) {
        console.error('Error loading G-SAC agent:', error)
      }
    }
    loadGSAC()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, reasoningLogs])

  useEffect(() => {
    // Poll for execution logs if we have an execution ID
    if (executionId && gsacAgentId) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/agents/${gsacAgentId}/executions/${executionId}/logs`)
          if (response.ok) {
            const data = await response.json()
            setReasoningLogs(data.logs || [])
            
            // Extract token usage from execution
            if (data.execution?.tokenUsage) {
              setTokenUsage(data.execution.tokenUsage)
            }
          }
        } catch (error) {
          console.error('Error loading logs:', error)
        }
      }, 1000) // Poll every second

      return () => clearInterval(interval)
    }
  }, [executionId, gsacAgentId])

  async function createAgent() {
    if (!prompt.trim() || !gsacAgentId) return

    const userMessage: Message = {
      role: "user",
      content: prompt,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setPrompt("")
    setIsLoading(true)
    setReasoningLogs([])
    setCreatedAgent(null)
    setExecutionId(null)
    setTokenUsage(null)

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input: `Create an agent with the following requirements:\n\n${userMessage.content}`,
          agentId: gsacAgentId,
        }),
      })
      const data = await res.json()

      if (data.executionId) {
        setExecutionId(data.executionId)
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.text || data.error || "Agent creation in progress...",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Handle errors from the API
      if (data.error) {
        const errorMessage: Message = {
          role: "assistant",
          content: `**Error Creating Agent:** ${data.error}\n\n**Troubleshooting:**\n- Ensure the G-SAC agent is properly configured\n- Check that all required tools are available\n- Verify your API key is valid\n- Try simplifying your request`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setIsLoading(false)
        return
      }

      // Check if agent was created by parsing the response
      // Look for agent ID in the response or success indicators
      const agentIdMatch = data.text?.match(/agent.*?ID[:\s]+([a-f0-9-]+)/i)
      const successIndicators = [
        /created successfully/i,
        /agent.*created/i,
        /successfully created/i,
        /agent.*is now active/i
      ]
      const hasSuccessIndicator = successIndicators.some(pattern => pattern.test(data.text || ''))
      
      if (agentIdMatch || hasSuccessIndicator) {
        // Poll for newly created agent
        let attempts = 0
        const maxAttempts = 10
        const pollAgent = async () => {
          try {
            const agentsRes = await fetch('/api/agents')
            if (agentsRes.ok) {
              const agentsData = await agentsRes.json()
              // Try to find by ID first, then by name matching
              let newAgent = null
              if (agentIdMatch) {
                newAgent = agentsData.agents?.find((a: Agent) => a.id === agentIdMatch[1])
              }
              if (!newAgent) {
                // Try to find by name mentioned in response
                const nameMatch = data.text?.match(/agent.*?["']([^"']+)["']/i)
                if (nameMatch) {
                  newAgent = agentsData.agents?.find((a: Agent) => 
                    a.name.toLowerCase().includes(nameMatch[1].toLowerCase()) ||
                    nameMatch[1].toLowerCase().includes(a.name.toLowerCase())
                  )
                }
              }
              // If still not found, get the most recently created agent
              if (!newAgent && agentsData.agents?.length > 0) {
                const recentAgents = agentsData.agents
                  .filter((a: Agent) => a.createdByAgentId === gsacAgentId)
                  .sort((a: Agent, b: Agent) => {
                    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
                    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
                    return bTime - aTime
                  })
                newAgent = recentAgents[0]
              }
              
              if (newAgent) {
                setCreatedAgent(newAgent)
                return true
              }
            }
            return false
          } catch (error) {
            console.error('Error fetching created agent:', error)
            return false
          }
        }
        
        // Poll with exponential backoff
        const pollInterval = setInterval(async () => {
          attempts++
          const found = await pollAgent()
          if (found || attempts >= maxAttempts) {
            clearInterval(pollInterval)
            if (!found && attempts >= maxAttempts) {
              console.warn('Could not find created agent after', maxAttempts, 'attempts')
            }
          }
        }, 500 * attempts) // Exponential backoff: 500ms, 1000ms, 1500ms...
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error"
      const errorMessage: Message = {
        role: "assistant",
        content: `**Error:** ${errorMsg}\n\nPlease try again or check your connection. If the problem persists, the G-SAC agent may need to be restarted.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col">
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
            <Link
              href="/agents"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Agents
            </Link>
          </div>
          <h1 className="text-2xl font-bold font-mono" style={{ animation: "glitch-slow 4s infinite" }}>
            Create Agent
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-green-400/60 font-mono text-xs">
              G-SAC Powered
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
          {/* Info Banner */}
          <div className="bg-green-400/10 border-b border-green-400/30 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div className="flex-1">
                <h2 className="text-green-400 font-bold mb-1">Single-Prompt Agent Creation</h2>
                <p className="text-green-300/80 text-sm">
                  Describe what you want your agent to do in plain language. The Growth Strategy Agent Creator (G-SAC) will autonomously create a fully configured agent for you.
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-6 max-w-2xl">
                  <div className="text-green-400/50 font-mono text-lg">
                    ⚛ Ready to create agents
                  </div>
                  <p className="text-green-400/30 text-sm font-mono mb-8">
                    Examples:
                  </p>
                  <div className="space-y-3 text-left">
                    {[
                      "Create an agent that qualifies sales leads and schedules demos",
                      "Build a customer support agent for Slack and Discord",
                      "Create a content creator agent that posts to Twitter and LinkedIn",
                      "Build an agent that analyses competitor data and generates insights",
                    ].map((example, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPrompt(example)}
                        className="bg-black/50 border border-green-400/30 p-4 rounded-lg cursor-pointer hover:border-green-400/50 hover:bg-green-400/5 transition-all"
                      >
                        <p className="text-green-300 text-sm">{example}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, idx) => (
                  <div key={idx} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-6`}>
                    <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                      <div className={`flex items-center gap-2 mb-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <span className={`text-xs font-mono uppercase tracking-wider ${message.role === "user" ? "text-cyan-400" : "text-green-300"}`}>
                          {message.role === "user" ? "You" : "G-SAC"}
                        </span>
                        <span className="text-xs text-green-400/40 font-mono">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div
                        className={`relative px-4 py-3 rounded-lg border-2 ${
                          message.role === "user"
                            ? "bg-cyan-400/5 border-cyan-400/30 text-cyan-300"
                            : "bg-green-400/5 border-green-400/30 text-green-300"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="font-mono text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Reasoning Steps - Enhanced Display */}
                {reasoningLogs.length > 0 && (
                  <div className="bg-gradient-to-r from-green-400/10 to-green-400/5 border-2 border-green-400/50 p-6 rounded-lg shadow-lg shadow-green-400/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="quantum-glyph text-green-400 text-2xl">⚛</div>
                        <h3 className="text-green-400 font-bold font-mono text-lg uppercase tracking-wider">
                          G-SAC Reasoning Process
                        </h3>
                        <span className="px-2 py-1 text-xs font-mono bg-green-400/20 text-green-300 border border-green-400/30 rounded">
                          {reasoningLogs.filter(log => log.level === 'info' || log.level === 'debug').length} steps
                        </span>
                      </div>
                      <button
                        onClick={() => setShowReasoningDetails(!showReasoningDetails)}
                        className="text-green-400/60 hover:text-green-400 text-xs font-mono uppercase tracking-wider transition-colors"
                      >
                        {showReasoningDetails ? 'Hide' : 'Show'} Details
                      </button>
                    </div>
                    
                    {showReasoningDetails && (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {/* Token Usage Display */}
                        {tokenUsage && (
                          <div className="mb-4 p-3 bg-cyan-400/10 border border-cyan-400/30 rounded">
                            <div className="text-xs text-cyan-400/60 mb-2 font-mono font-bold">Token Usage:</div>
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              <div>
                                <span className="text-cyan-400/60">Input:</span>
                                <span className="text-cyan-400 ml-2">{tokenUsage.inputTokens.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-cyan-400/60">Output:</span>
                                <span className="text-cyan-400 ml-2">{tokenUsage.outputTokens.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-cyan-400/60">Total:</span>
                                <span className="text-cyan-400 ml-2">{tokenUsage.totalTokens.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-purple-400/60">Cost:</span>
                                <span className="text-purple-400 ml-2">${tokenUsage.estimatedCost.toFixed(4)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {reasoningLogs
                          .filter(log => log.level === 'info' || log.level === 'debug')
                          .map((log, idx) => {
                            // Categorize logs by keywords
                            const isGoalAnalysis = log.message.toLowerCase().includes('goal') || log.message.toLowerCase().includes('analyse')
                            const isToolSelection = log.message.toLowerCase().includes('tool') || log.message.toLowerCase().includes('select')
                            const isPlatformConfig = log.message.toLowerCase().includes('platform') || log.message.toLowerCase().includes('mcp')
                            const isAgentCreation = log.message.toLowerCase().includes('create') || log.message.toLowerCase().includes('agent')
                            const isSkill = log.message.toLowerCase().includes('skill')
                            
                            let stageIcon = '→'
                            let stageColor = 'text-green-400/60'
                            if (isGoalAnalysis) {
                              stageIcon = '🎯'
                              stageColor = 'text-cyan-400'
                            } else if (isToolSelection) {
                              stageIcon = '🔧'
                              stageColor = 'text-yellow-400'
                            } else if (isPlatformConfig) {
                              stageIcon = '🌐'
                              stageColor = 'text-purple-400'
                            } else if (isAgentCreation) {
                              stageIcon = '✨'
                              stageColor = 'text-green-400'
                            } else if (isSkill) {
                              stageIcon = '🧠'
                              stageColor = 'text-blue-400'
                            }
                            
                            return (
                              <div 
                                key={idx} 
                                className={`flex items-start gap-3 p-3 rounded-lg border-l-4 transition-all ${
                                  isGoalAnalysis ? 'bg-cyan-400/5 border-cyan-400/50' :
                                  isToolSelection ? 'bg-yellow-400/5 border-yellow-400/50' :
                                  isPlatformConfig ? 'bg-purple-400/5 border-purple-400/50' :
                                  isAgentCreation ? 'bg-green-400/10 border-green-400/70' :
                                  isSkill ? 'bg-blue-400/5 border-blue-400/50' :
                                  'bg-green-400/5 border-green-400/30'
                                }`}
                              >
                                <span className={`text-lg ${stageColor} flex-shrink-0 mt-0.5`}>{stageIcon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-mono ${stageColor} font-semibold`}>
                                      Step {idx + 1}
                                    </span>
                                    <span className="text-xs text-green-400/40 font-mono">
                                      {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <p className={`text-sm font-mono ${isAgentCreation ? 'text-green-300 font-semibold' : 'text-green-300/80'}`}>
                                    {log.message}
                                  </p>
                                  {log.data && typeof log.data === 'object' && log.data !== null && Object.keys(log.data).length > 0 ? (
                                    <details className="mt-2">
                                      <summary className="text-xs text-green-400/50 font-mono cursor-pointer hover:text-green-400/70">
                                        View details
                                      </summary>
                                      <pre className="mt-1 text-xs text-green-400/60 font-mono bg-black/30 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(log.data, null, 2)}
                                      </pre>
                                    </details>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* Created Agent Info - Enhanced Success Display */}
                {createdAgent && (
                  <div className="bg-gradient-to-r from-green-400/20 to-green-400/10 border-2 border-green-400 p-6 rounded-lg shadow-lg shadow-green-400/30 animate-pulse-once">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="text-3xl">🎉</div>
                      <div className="flex-1">
                        <h3 className="text-green-400 font-bold mb-2 font-mono text-lg uppercase tracking-wider">
                          ✅ Agent Created Successfully!
                        </h3>
                        <p className="text-green-300/80 text-sm mb-4">
                          Your agent has been deployed and is ready to use.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="bg-black/50 p-3 rounded border border-green-400/30">
                        <p className="text-green-300 text-sm mb-1">
                          <strong className="text-green-400">Name:</strong> {createdAgent.name}
                        </p>
                        {createdAgent.description && (
                          <p className="text-green-300/80 text-sm">
                            <strong className="text-green-400">Description:</strong> {createdAgent.description}
                          </p>
                        )}
                      </div>
                      {tokenUsage && (
                        <div className="bg-cyan-400/10 p-3 rounded border border-cyan-400/30">
                          <p className="text-cyan-400/60 text-xs font-mono mb-2 font-bold">Creation Cost Summary:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div>
                              <span className="text-cyan-400/60">Tokens Used:</span>
                              <span className="text-cyan-400 ml-2">{tokenUsage.totalTokens.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-purple-400/60">Total Cost:</span>
                              <span className="text-purple-400 ml-2">${tokenUsage.estimatedCost.toFixed(4)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <Link
                        href={`/agent/${createdAgent.id}`}
                        className="inline-flex items-center gap-2 px-6 py-3 border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-mono text-sm font-bold"
                      >
                        <span>View Agent</span>
                        <span>→</span>
                      </Link>
                      <button
                        onClick={() => {
                          setPrompt("")
                          setMessages([])
                          setCreatedAgent(null)
                          setReasoningLogs([])
                          setExecutionId(null)
                        }}
                        className="px-6 py-3 border-2 border-green-400/50 text-green-400/70 hover:bg-green-400/10 hover:text-green-400 transition-all font-mono text-sm"
                      >
                        Create Another
                      </button>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex justify-start mb-6">
                    <div className="max-w-[85%]">
                      <div className="px-6 py-5 rounded-lg border-2 bg-green-400/5 border-green-400/30">
                        <div className="flex items-center gap-3">
                          <div className="quantum-glyph text-green-400 text-2xl">⚛</div>
                          <span className="shimmer-text font-mono text-lg font-bold text-green-400">
                            G-SAC is creating your agent...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Section */}
          <div className="border-t border-green-400/30 p-4 md:p-6 bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    createAgent()
                  }
                }}
                placeholder="Describe what you want your agent to do... (e.g., 'Create an agent that qualifies sales leads and schedules demos')"
                className="w-full h-32 bg-black border-2 border-green-400/50 text-green-400
                         font-mono p-4 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(0,255,0,0.3)]
                         placeholder-green-400/30 resize-none rounded-lg"
                disabled={isLoading || !gsacAgentId}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-400/40 font-mono">
                  {!gsacAgentId ? "Loading G-SAC..." : "Powered by G-SAC"}
                </span>
                <button
                  onClick={createAgent}
                  disabled={isLoading || !prompt.trim() || !gsacAgentId}
                  className="px-6 py-2 bg-black border-2 border-green-400 text-green-400 font-mono uppercase text-sm
                           hover:bg-green-400 hover:text-black transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  {isLoading ? "Creating..." : "Create Agent →"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

