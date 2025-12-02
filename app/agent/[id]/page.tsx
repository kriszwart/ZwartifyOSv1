"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { getApiHeaders } from "@/lib/apiKey"
import AgentThinkingQuote from "@/app/components/AgentThinkingQuote"
import { downloadMarkdown, downloadPDF } from "@/app/utils/downloadUtils"
import { enhancedMarkdownComponents } from "@/app/utils/markdownComponents"
import AgentExportTab from "@/app/components/AgentExportTab"

interface Agent {
  id: string
  name: string
  description?: string
  prompt: string
  version: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  skillIds?: string[]
  ragFolderId?: string
  useMemory?: boolean
  createdByAgentId?: string | null
  creationPrompt?: string | null
}

interface Skill {
  id: string
  name: string
  description: string
}

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  imageUrl?: string
}

export default function AgentDetailPage() {
  const params = useParams()
  const agentId = params.id as string
  
  const [agent, setAgent] = useState<Agent | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [creatorAgent, setCreatorAgent] = useState<Agent | null>(null)
  const [showCreationPrompt, setShowCreationPrompt] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null)
  const [useStreaming, setUseStreaming] = useState(true) // Enable streaming by default
  const [activeTab, setActiveTab] = useState<'chat' | 'export'>('chat')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (agentId) {
      loadAgent()
    }
  }, [agentId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    // Also scroll input into view after a short delay
    setTimeout(() => {
      if (inputRef.current && !isLoading) {
        inputRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }, 100)
  }, [messages, isLoading])

  const loadAgent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agents/${agentId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to load agent:', response.status, errorData)
        setLoading(false)
        return
      }
      
      const data = await response.json()
      
      if (data.agent) {
        setAgent(data.agent)
        
        // Load creator agent if this agent was created by another agent
        if (data.agent.createdByAgentId) {
          try {
            const creatorResponse = await fetch(`/api/agents/${data.agent.createdByAgentId}`)
            if (creatorResponse.ok) {
              const creatorData = await creatorResponse.json()
              if (creatorData.agent) {
                setCreatorAgent(creatorData.agent)
              }
            }
          } catch (creatorError) {
            console.error('Error loading creator agent:', creatorError)
          }
        }
        
        // Load skills if agent has skillIds
        if (data.agent.skillIds && data.agent.skillIds.length > 0) {
          try {
            const skillsResponse = await fetch('/api/skills')
            if (skillsResponse.ok) {
              const skillsData = await skillsResponse.json()
              const agentSkills = skillsData.skills.filter((s: Skill) => 
                data.agent.skillIds.includes(s.id)
              )
              setSkills(agentSkills)
            }
          } catch (skillsError) {
            console.error('Error loading skills:', skillsError)
          }
        }
      } else {
        console.error('No agent data in response:', data)
      }
    } catch (error) {
      console.error('Error loading agent:', error)
    } finally {
      setLoading(false)
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
      if (isImage) {
        setSelectedImage(reader.result as string)
      } else if (isPDF) {
        // For PDFs, we'll send the base64 data separately
        setSelectedImage(reader.result as string) // Store as base64
      }
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

    const userMessage: Message = {
      role: "user",
      content: input || (selectedImage?.includes('data:application/pdf') ? "Analyse this PDF document" : selectedImage ? "Analyse this screenshot" : imageUrl ? "Analyse this image from URL" : ""),
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

    // Add timeout to prevent stuck loading state
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
      const errorMessage: Message = {
        role: "assistant",
        content: "**Error:** Request timed out. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }, 60000) // 60 second timeout

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
            input: currentInput || (currentImage?.includes('data:application/pdf') ? "Analyse this PDF document" : currentImage ? "Analyse this screenshot" : currentImageUrl ? "Analyse this image from URL" : ""),
            agentId: agentId,
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
                  clearTimeout(timeoutId)
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
            input: currentInput || (currentImage?.includes('data:application/pdf') ? "Analyse this PDF document" : currentImage ? "Analyse this screenshot" : currentImageUrl ? "Analyse this image from URL" : ""),
            agentId: agentId,
            image: currentImage || undefined,
            imageUrl: currentImageUrl || undefined,
          }),
        })

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }

        const data = await res.json()
        clearTimeout(timeoutId)

        setMessages((prev) => {
          const updated = [...prev]
          const lastMsg = updated[updated.length - 1]
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content = data.text || data.error || "No response"
          }
          return updated
        })
      }
    } catch (error) {
      clearTimeout(timeoutId)
      const errorMsg = error instanceof Error ? error.message : "Network error"
      setMessages((prev) => {
        const updated = [...prev]
        const lastMsg = updated[updated.length - 1]
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.content = `**Error:** ${errorMsg}`
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-green-400/60 font-mono">Loading agent...</div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-400/60 font-mono mb-4">Agent not found</div>
          <div className="text-green-400/40 font-mono text-sm mb-4">Agent ID: {agentId}</div>
          <Link href="/agents" className="text-green-400 hover:text-green-300 font-mono">
            ← Back to Agents
          </Link>
        </div>
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
              href="/agents"
              className="text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              ← AGENTS
            </Link>
            <span className="text-green-400/50">|</span>
            <button
              onClick={() => window.history.back()}
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              ← Back
            </button>
          </div>
          <h1 className="text-2xl font-bold font-mono">{agent.name}</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={(e) => setUseStreaming(e.target.checked)}
                className="w-4 h-4 border-green-400/50 bg-black text-green-400 focus:ring-green-400"
              />
              <span className="text-green-400/70 font-mono text-xs">Streaming</span>
            </label>
            <Link
              href="/agent"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Test All →
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          {/* Agent Info */}
          <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h2 className="text-2xl font-bold text-green-400">{agent.name}</h2>
              <span
                className={`px-2 py-1 text-xs font-mono border ${
                  agent.enabled
                    ? 'border-green-400/50 bg-green-400/10 text-green-400'
                    : 'border-red-400/50 bg-red-400/10 text-red-400'
                }`}
              >
                {agent.enabled ? 'Enabled' : 'Disabled'}
              </span>
              {agent.createdByAgentId && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreationPrompt(!showCreationPrompt)}
                    className="px-2 py-1 text-xs font-mono border border-purple-400/50 bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors cursor-pointer flex items-center gap-1"
                    title="Created by AI agent"
                  >
                    <span>🤖</span>
                    <span>Created by {creatorAgent?.name || 'AI Agent'}</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Creation Prompt Display */}
            {agent.createdByAgentId && showCreationPrompt && agent.creationPrompt && (
              <div className="mb-4 p-4 bg-purple-400/10 border-2 border-purple-400/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-purple-400 font-mono uppercase">Original Creation Prompt</h4>
                  <button
                    onClick={() => setShowCreationPrompt(false)}
                    className="text-purple-400/60 hover:text-purple-400 text-xs font-mono"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-purple-300/90 text-sm font-mono italic">{agent.creationPrompt}</p>
                {creatorAgent && (
                  <div className="mt-2 pt-2 border-t border-purple-400/20">
                    <Link
                      href={`/agent/${creatorAgent.id}`}
                      className="text-xs text-purple-400/70 hover:text-purple-400 font-mono"
                    >
                      View Creator Agent: {creatorAgent.name} →
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {agent.description && (
              <p className="text-green-300/80 mb-4">{agent.description}</p>
            )}

            {skills.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-green-400/60 font-mono mb-2">Skills:</div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill.id} className="px-2 py-1 text-xs bg-green-400/10 text-green-400/80 border border-green-400/30 rounded font-mono">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-black/50 border border-green-400/20 p-3 rounded font-mono text-sm text-green-400/80 mb-4">
              <div className="text-xs text-green-400/60 mb-1">Prompt:</div>
              <div className="whitespace-pre-wrap">{agent.prompt}</div>
            </div>

            <div className="text-xs text-green-400/60 font-mono">
              Version: {agent.version} • Created: {new Date(agent.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-green-400">Test Agent</h3>
            
            {/* Messages Thread */}
            <div className="mb-6 max-h-[600px] overflow-y-auto space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-8 text-green-400/60 font-mono text-sm">
                  Start a conversation with {agent.name}
                </div>
              )}
              
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                    {/* Header */}
                    <div className={`flex items-center gap-2 mb-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <span className={`text-xs font-mono uppercase tracking-wider ${message.role === "user" ? "text-cyan-400" : "text-green-300"}`}>
                        {message.role === "user" ? "You" : agent.name}
                      </span>
                      <span className="text-xs text-green-400/40 font-mono">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`relative px-4 py-3 rounded-lg border-2 ${
                        message.role === "user"
                          ? "bg-cyan-400/5 border-cyan-400/30 text-cyan-300"
                          : "bg-green-400/5 border-green-400/30 text-green-300"
                      }`}
                      style={{
                        boxShadow: message.role === "user"
                          ? "0 0 20px rgba(0, 255, 255, 0.1)"
                          : "0 0 20px rgba(0, 255, 0, 0.1)",
                      }}
                    >
                      {message.role === "user" ? (
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
                      ) : (
                        <div className="relative group">
                          {/* Download Buttons */}
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              onClick={() => {
                                downloadMarkdown(message.content, agent.name, message.timestamp)
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
                                  
                                  await downloadPDF(elementId, agent.name, message.timestamp, message.content)
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
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
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

            {/* Image/PDF Preview - Only show when no messages */}
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

            {/* Input - Always at bottom */}
            <div className="space-y-4">
              {/* Image URL Input */}
              <div>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="Or enter image URL (e.g., https://example.com/image.png)"
                  className="w-full px-4 py-2 bg-black/50 border border-cyan-400/30 rounded text-green-400 placeholder-green-400/40 font-mono text-sm focus:outline-none focus:border-cyan-400/60"
                />
              </div>
              
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={selectedImage ? (selectedImage.includes('data:application/pdf') ? "Describe what you want analysed from the PDF... (Cmd/Ctrl + Enter to send)" : "Describe what you want analysed... (Cmd/Ctrl + Enter to send)") : "Type your message... (Cmd/Ctrl + Enter to send)"}
                className="w-full h-32 bg-black border-2 border-green-400/50 text-green-400 font-mono p-4 focus:outline-none focus:border-green-400 resize-none rounded-lg"
                disabled={isLoading || !agent.enabled}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,application/pdf"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-4 py-2 border border-green-400/50 text-green-400 font-mono text-sm hover:bg-green-400/10 transition-colors cursor-pointer rounded"
                  >
                    📄 Upload PDF/Image
                  </label>
                </div>
                <button
                  onClick={handleSend}
                  disabled={isLoading || (!input.trim() && !selectedImage && !imageUrl.trim()) || !agent.enabled}
                  className="px-6 py-2 bg-black border-2 border-green-400 text-green-400 font-mono uppercase text-sm hover:bg-green-400 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  {isLoading ? "Sending..." : "Send →"}
                </button>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'export' && agent && (
            <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
              <AgentExportTab agent={agent} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
