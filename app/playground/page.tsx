"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { getApiHeaders } from "@/lib/apiKey"
import AgentThinkingQuote from "@/app/components/AgentThinkingQuote"
import { downloadMarkdown, downloadPDF } from "@/app/utils/downloadUtils"
import { enhancedMarkdownComponents } from "@/app/utils/markdownComponents"

interface Agent {
  id: string
  name: string
  description?: string
  prompt: string
  version: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  ragFolderId?: string
  skillIds?: string[]
  createdByAgentId?: string | null
  creationPrompt?: string | null
}

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  imageUrl?: string
}

interface Skill {
  id: string
  name: string
  description: string
}

export default function PlaygroundPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [creatorAgent, setCreatorAgent] = useState<Agent | null>(null)
  const [showExamples, setShowExamples] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null)
  const [useStreaming, setUseStreaming] = useState(true) // Enable streaming by default
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAgents()
    loadSkills()
  }, [])

  useEffect(() => {
    if (selectedAgent?.createdByAgentId) {
      loadCreatorAgent(selectedAgent.createdByAgentId)
    }
  }, [selectedAgent])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      const data = await response.json()
      const enabledAgents = (data.agents || []).filter((a: Agent) => a.enabled)
      setAgents(enabledAgents)
      if (enabledAgents.length > 0 && !selectedAgent) {
        setSelectedAgent(enabledAgents[0])
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSkills = async () => {
    try {
      const response = await fetch('/api/skills?enabled=true')
      const data = await response.json()
      setSkills(data.skills || [])
    } catch (error) {
      console.error('Error loading skills:', error)
    }
  }

  const loadCreatorAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.agent) {
          setCreatorAgent(data.agent)
        }
      }
    } catch (error) {
      console.error('Error loading creator agent:', error)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's an image or PDF
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    if (!isImage && !isPDF) {
      alert('Please select an image or PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
      setImageUrl("") // Clear URL when file is selected
    }
    reader.readAsDataURL(file)
  }

  const handleImageUrlChange = async (url: string) => {
    setImageUrl(url)
    setSelectedImage(null) // Clear file when URL is entered
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async () => {
    if (!input.trim() && !selectedImage && !imageUrl.trim()) return
    if (!selectedAgent) return

    const userMessage: Message = {
      role: "user",
      content: input || (selectedImage?.includes('data:application/pdf') ? "Analyse this PDF document" : selectedImage ? "Analyse this image" : imageUrl ? "Analyse this image from URL" : ""),
      timestamp: new Date(),
      imageUrl: selectedImage || undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    const currentImage = selectedImage
    const currentImageUrl = imageUrl
    setInput("")
    setSelectedImage(null)
    setImageUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsLoading(true)
    setShowExamples(false)

    // Create placeholder assistant message for streaming
    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      if (useStreaming) {
        // Use streaming endpoint
        const res = await fetch("/api/agent/stream", {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            input: currentInput || (currentImage?.includes('data:application/pdf') ? "Analyse this PDF document" : currentImage ? "Analyse this image" : currentImageUrl ? "Analyse this image from URL" : ""),
            agentId: selectedAgent.id,
            image: currentImage || undefined,
            imageUrl: currentImageUrl || undefined,
          }),
        })

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        if (!reader) {
          throw new Error("Stream reader not available")
        }

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === "text" && data.content) {
                  setMessages((prev) => {
                    const updated = [...prev]
                    const lastMsg = updated[updated.length - 1]
                    if (lastMsg && lastMsg.role === "assistant") {
                      lastMsg.content += data.content
                    }
                    return updated
                  })
                } else if (data.type === "tool_start") {
                  setMessages((prev) => {
                    const updated = [...prev]
                    const lastMsg = updated[updated.length - 1]
                    if (lastMsg && lastMsg.role === "assistant") {
                      lastMsg.content += `\n\n🔧 *Executing tool: ${data.toolName}...*\n\n`
                    }
                    return updated
                  })
                } else if (data.type === "tool_complete") {
                  setMessages((prev) => {
                    const updated = [...prev]
                    const lastMsg = updated[updated.length - 1]
                    if (lastMsg && lastMsg.role === "assistant") {
                      lastMsg.content = lastMsg.content.replace(
                        new RegExp(`🔧 \\*Executing tool: ${data.toolName}\\.\\.\\.\\*`),
                        `✅ *Tool ${data.toolName} completed*\n\n`
                      )
                    }
                    return updated
                  })
                } else if (data.type === "error") {
                  throw new Error(data.error || "Unknown error")
                } else if (data.type === "done") {
                  // Streaming complete
                }
              } catch (parseError) {
                console.error("Error parsing SSE data:", parseError)
              }
            }
          }
        }
      } else {
        // Use non-streaming endpoint
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            input: currentInput || (currentImage?.includes('data:application/pdf') ? "Analyse this PDF document" : currentImage ? "Analyse this image" : currentImageUrl ? "Analyse this image from URL" : ""),
            agentId: selectedAgent.id,
            image: currentImage || undefined,
            imageUrl: currentImageUrl || undefined,
          }),
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
          throw new Error(errorData.error || `HTTP ${res.status}`)
        }

        const data = await res.json()

        setMessages((prev) => {
          const updated = [...prev]
          const lastMsg = updated[updated.length - 1]
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content = data.text || data.error || "No response generated"
          }
          return updated
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error"
      console.error('Playground error:', error)
      setMessages((prev) => {
        const updated = [...prev]
        const lastMsg = updated[updated.length - 1]
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.content = `**Error:** ${errorMsg}\n\n**Troubleshooting:**\n- Check that the agent is enabled\n- Verify your API key is configured\n- Check browser console for details`
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (example: string) => {
    setInput(example)
    setShowExamples(false)
  }

  const getAgentSkills = (agent: Agent) => {
    if (!agent.skillIds || agent.skillIds.length === 0) return []
    return skills.filter(s => agent.skillIds?.includes(s.id))
  }

  const examplePrompts: Record<string, string[]> = {
    'pdf-processor': [
      "Extract all text from this PDF",
      "What are the key points in this document?",
      "Summarize this PDF in 3 bullet points",
    ],
    'data-analyst': [
      "Analyse this dataset and find trends",
      "What insights can you provide from this data?",
      "Create a summary of key metrics",
    ],
    'code-reviewer': [
      "Review this code for bugs and security issues",
      "Suggest improvements for this function",
      "Check this code for best practices",
    ],
    'content-writer': [
      "Write a blog post about AI agents",
      "Create social media content for a product launch",
      "Draft an email newsletter",
    ],
    'email-assistant': [
      "Draft a professional follow-up email",
      "Create an email template for customer support",
      "Help me write a sales email",
    ],
    'research-assistant': [
      "Research the latest trends in AI",
      "What are the best practices for lead generation?",
      "Find information about competitor analysis",
    ],
    'customer-support': [
      "Help me respond to a customer complaint",
      "Draft a response to a support ticket",
      "Create a friendly customer service message",
    ],
    'sales-lead-qualifier': [
      "How do I qualify a sales lead?",
      "What questions should I ask a prospect?",
      "Help me understand if this lead is ready for a demo",
    ],
  }

  const getExamples = () => {
    if (!selectedAgent) return []
    const examples = examplePrompts[selectedAgent.name] || [
      "How can you help me?",
      "What are your capabilities?",
      "Tell me about yourself",
    ]
    return examples
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-green-400/60 font-mono">Loading playground...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold font-mono">Agent Playground</h1>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                className="w-4 h-4 border-green-400/50 bg-black text-green-400 focus:ring-green-400"
              />
              <span className="text-green-400/70 font-mono text-xs">Streaming</span>
            </label>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/create-agent-visual"
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-sm"
            >
              🎨 Visual Builder
            </Link>
            <Link
              href="/create-agent"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Create Agent
            </Link>
            <Link
              href="/roadmap"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Roadmap
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
          {/* Agent Selector Sidebar */}
          <div className="lg:w-80 border-r border-green-400/30 p-4 overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-green-400">Available Agents</h2>
            <div className="space-y-2">
              {agents.map((agent) => {
                const agentSkills = getAgentSkills(agent)
                const isSelected = selectedAgent?.id === agent.id
                
                return (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent)
                      setMessages([])
                      setShowExamples(true)
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-purple-400 bg-purple-400/10'
                        : 'border-green-400/30 hover:border-green-400/50 bg-black/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-green-400">{agent.name}</span>
                      {agent.createdByAgentId && (
                        <span className="text-xs text-purple-400">🤖</span>
                      )}
                    </div>
                    {agent.description && (
                      <p className="text-xs text-green-300/70 mb-2 line-clamp-2">
                        {agent.description}
                      </p>
                    )}
                    {agentSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {agentSkills.slice(0, 2).map((skill) => (
                          <span
                            key={skill.id}
                            className="text-xs px-1.5 py-0.5 bg-green-400/10 text-green-400/80 border border-green-400/30 rounded font-mono"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {agentSkills.length > 2 && (
                          <span className="text-xs text-green-400/60 font-mono">
                            +{agentSkills.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
            {selectedAgent ? (
              <>
                {/* Agent Header */}
                <div className="border-b border-green-400/30 p-4 bg-black/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl font-bold text-green-400">{selectedAgent.name}</h2>
                      {selectedAgent.createdByAgentId && (
                        <div className="flex items-center gap-1 px-2 py-1 text-xs font-mono border border-purple-400/50 bg-purple-400/10 text-purple-300">
                          <span>🤖</span>
                          <span>Created by {creatorAgent?.name || 'AI Agent'}</span>
                        </div>
                      )}
                      {getAgentSkills(selectedAgent).length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {getAgentSkills(selectedAgent).slice(0, 3).map((skill) => (
                            <span
                              key={skill.id}
                              className="px-2 py-1 text-xs bg-green-400/10 text-green-400/80 border border-green-400/30 rounded font-mono"
                            >
                              {skill.name}
                            </span>
                          ))}
                          {getAgentSkills(selectedAgent).length > 3 && (
                            <span className="text-xs text-green-400/60 font-mono">
                              +{getAgentSkills(selectedAgent).length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {messages.length > 0 && (
                        <button
                          onClick={() => {
                            setMessages([])
                            setShowExamples(true)
                          }}
                          className="px-3 py-1 text-xs font-mono border border-green-400/50 text-green-400/70 hover:bg-green-400/10 hover:text-green-400 transition-colors rounded"
                        >
                          Clear Chat
                        </button>
                      )}
                      <Link
                        href={`/agent/${selectedAgent.id}`}
                        className="text-xs text-green-400/60 hover:text-green-400 font-mono px-3 py-1 border border-green-400/30 rounded hover:border-green-400/50 transition-colors"
                      >
                        Full View →
                      </Link>
                    </div>
                  </div>
                  {selectedAgent.description && (
                    <p className="text-sm text-green-300/80">{selectedAgent.description}</p>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && showExamples && (
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        <div className="text-green-400/60 font-mono mb-4">
                          Try {selectedAgent.name} with these examples:
                        </div>
                        <div className="space-y-2 max-w-2xl mx-auto">
                          {getExamples().map((example, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleExampleClick(example)}
                              className="w-full text-left p-3 bg-black/50 border border-green-400/30 rounded-lg hover:border-green-400/50 hover:bg-green-400/5 transition-all"
                            >
                              <p className="text-green-300 text-sm">{example}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                        <div className={`flex items-center gap-2 mb-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                          <span className={`text-xs font-mono uppercase tracking-wider ${message.role === "user" ? "text-cyan-400" : "text-green-300"}`}>
                            {message.role === "user" ? "You" : selectedAgent.name}
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
                          <div className="relative group">
                            {/* Download Buttons */}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                onClick={() => {
                                  downloadMarkdown(message.content, selectedAgent?.name || "Agent", message.timestamp)
                                }}
                                className="px-2 py-1 bg-black/90 border border-green-400/50 text-green-400 hover:bg-green-400/10 transition-all rounded text-xs font-mono flex items-center gap-1"
                                title="Download as Markdown"
                              >
                                📄 MD
                              </button>
                              <button
                                onClick={async () => {
                                  const elementId = `message-${index}`
                                  setDownloadingPDF(elementId)
                                  try {
                                    // Use the existing rendered markdown element
                                    const existingElement = document.getElementById(elementId)
                                    if (!existingElement) {
                                      throw new Error('Message element not found. Please ensure the message is visible.')
                                    }
                                    
                                    await downloadPDF(elementId, selectedAgent?.name || "Agent", message.timestamp, message.content)
                                  } catch (error) {
                                    console.error('Error downloading PDF:', error)
                                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                                    alert(`Failed to generate PDF: ${errorMessage}`)
                                  } finally {
                                    setDownloadingPDF(null)
                                  }
                                }}
                                disabled={downloadingPDF === `message-${index}`}
                                className="px-2 py-1 bg-black/90 border border-green-400/50 text-green-400 hover:bg-green-400/10 transition-all rounded text-xs font-mono flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Download as PDF"
                              >
                                {downloadingPDF === `message-${index}` ? '⏳' : '📋'} PDF
                              </button>
                            </div>
                            
                            {/* Markdown Content */}
                            <div 
                              id={`message-${index}`}
                              className="prose prose-invert prose-sm max-w-none"
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={enhancedMarkdownComponents}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                            <div className="space-y-2">
                              {message.imageUrl && (
                                message.imageUrl.includes('data:application/pdf') ? (
                                  <div className="border-2 border-cyan-400/50 rounded p-4 bg-black/50">
                                    <div className="text-cyan-400 font-mono text-sm mb-2">📄 PDF Document</div>
                                    <div className="text-cyan-400/60 font-mono text-xs">Ready to analyse</div>
                                  </div>
                                ) : (
                                  <img 
                                    src={message.imageUrl} 
                                    alt="Uploaded file" 
                                    className="max-w-full rounded border border-cyan-400/30"
                                  />
                                )
                              )}
                              {message.content && (
                                <p className="font-mono text-sm whitespace-pre-wrap">{message.content}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start mb-6">
                      <div className="max-w-[85%]">
                        <div className="px-6 py-5 rounded-lg border-2 bg-green-400/5 border-green-400/30"
                             style={{ boxShadow: "0 0 30px rgba(0, 255, 0, 0.2)" }}>
                          <AgentThinkingQuote variant="compact" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-green-400/30 p-4 bg-black/80">
                  {/* Image URL Input */}
                  <div className="mb-3">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder="Or enter image URL (e.g., https://example.com/image.png)"
                      className="w-full px-4 py-2 bg-black/50 border border-cyan-400/30 rounded text-green-400 placeholder-green-400/40 font-mono text-sm focus:outline-none focus:border-cyan-400/60"
                    />
                  </div>
                  
                  {/* Image Preview */}
                  {selectedImage && messages.length === 0 && (
                    <div className="relative inline-block max-w-md mb-4">
                      {selectedImage.includes('data:application/pdf') ? (
                        <div className="border-2 border-cyan-400/50 rounded p-4 bg-black/50">
                          <div className="text-green-400 font-mono text-sm mb-2">📄 PDF Document</div>
                          <div className="text-green-400/60 font-mono text-xs">Ready to analyse</div>
                        </div>
                      ) : (
                        <img 
                          src={selectedImage} 
                          alt="Selected file" 
                          className="max-w-full rounded border-2 border-cyan-400/50"
                        />
                      )}
                      <button
                        onClick={() => {
                          setSelectedImage(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="absolute top-2 right-2 px-2 py-1 bg-red-500/80 text-white text-xs rounded hover:bg-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault()
                            handleSend()
                          }
                        }}
                        placeholder={selectedImage ? (selectedImage.includes('data:application/pdf') ? "Describe what you want analysed from the PDF... (Cmd/Ctrl + Enter to send)" : "Describe what you want analysed... (Cmd/Ctrl + Enter to send)") : "Type your message... (Cmd/Ctrl + Enter to send)"}
                        className="flex-1 h-24 bg-black border-2 border-green-400/50 text-green-400 font-mono p-3 focus:outline-none focus:border-green-400 resize-none rounded-lg"
                        disabled={isLoading}
                      />
                      <button
                        onClick={handleSend}
                        disabled={isLoading || (!input.trim() && !selectedImage)}
                        className="px-6 py-3 bg-black border-2 border-green-400 text-green-400 font-mono uppercase text-sm hover:bg-green-400 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                      >
                        {isLoading ? "..." : "Send"}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*,application/pdf"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="file-upload-playground"
                        />
                        <label
                          htmlFor="file-upload-playground"
                          className="px-4 py-2 border border-green-400/50 text-green-400 font-mono text-sm hover:bg-green-400/10 transition-colors cursor-pointer rounded"
                        >
                          📄 Upload PDF/Image
                        </label>
                      </div>
                      <div className="text-xs text-green-400/40 font-mono">
                        {selectedAgent && getAgentSkills(selectedAgent).length > 0 && (
                          <span className="mr-3">
                            Skills: {getAgentSkills(selectedAgent).map(s => s.name).join(', ')}
                          </span>
                        )}
                        {selectedAgent?.ragFolderId && (
                          <span>📚 RAG Enabled</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-green-400/60 font-mono">
                  No agents available. Create your first agent!
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

