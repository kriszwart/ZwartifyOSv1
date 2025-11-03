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
}

export default function CreateAgentPage() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [gsacAgentId, setGsacAgentId] = useState<string | null>(null)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [reasoningLogs, setReasoningLogs] = useState<ExecutionLog[]>([])
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null)
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

      // Check if agent was created by parsing the response
      // Look for agent ID in the response
      const agentIdMatch = data.text?.match(/agent.*?ID[:\s]+([a-f0-9-]+)/i)
      if (agentIdMatch) {
        // Try to fetch the created agent
        setTimeout(async () => {
          try {
            const agentsRes = await fetch('/api/agents')
            if (agentsRes.ok) {
              const agentsData = await agentsRes.json()
              const newAgent = agentsData.agents?.find((a: Agent) => 
                a.id === agentIdMatch[1] || data.text?.includes(a.name)
              )
              if (newAgent) {
                setCreatedAgent(newAgent)
              }
            }
          } catch (error) {
            console.error('Error fetching created agent:', error)
          }
        }, 2000)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error"
      const errorMessage: Message = {
        role: "assistant",
        content: `**Error:** ${errorMsg}`,
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
                      "Build an agent that analyzes competitor data and generates insights",
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
                
                {/* Reasoning Steps */}
                {reasoningLogs.length > 0 && (
                  <div className="bg-black/50 border-2 border-green-400/30 p-4 rounded-lg">
                    <h3 className="text-green-400 font-bold mb-3 font-mono text-sm uppercase">
                      🔍 G-SAC Reasoning Steps
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {reasoningLogs
                        .filter(log => log.level === 'info' || log.level === 'debug')
                        .map((log, idx) => (
                          <div key={idx} className="text-xs font-mono text-green-300/70 border-l-2 border-green-400/30 pl-3">
                            <span className="text-green-400/50">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className="ml-2">{log.message}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Created Agent Info */}
                {createdAgent && (
                  <div className="bg-green-400/10 border-2 border-green-400 p-4 rounded-lg">
                    <h3 className="text-green-400 font-bold mb-2 font-mono text-sm uppercase">
                      ✅ Agent Created Successfully!
                    </h3>
                    <div className="space-y-2">
                      <p className="text-green-300">
                        <strong>Name:</strong> {createdAgent.name}
                      </p>
                      {createdAgent.description && (
                        <p className="text-green-300">
                          <strong>Description:</strong> {createdAgent.description}
                        </p>
                      )}
                      <Link
                        href={`/agents/${createdAgent.id}`}
                        className="inline-block px-4 py-2 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-colors font-mono text-sm mt-2"
                      >
                        View Agent →
                      </Link>
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

