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

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  imageUrl?: string
}

function LoadingGlyph() {
  return (
    <div className="quantum-glyph inline-block text-green-400 text-2xl">
      ⚛
    </div>
  )
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <button
        onClick={copyCode}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-green-400/10 border border-green-400/30
                   text-green-400 rounded opacity-0 group-hover:opacity-100 transition-opacity
                   hover:bg-green-400/20"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className={className}>
        <code>{children}</code>
      </pre>
    </div>
  )
}

function MessageBubble({ message, index, downloadingPDF, setDownloadingPDF }: { message: Message; index: number; downloadingPDF: string | null; setDownloadingPDF: (id: string | null) => void }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div className={`max-w-[85%] ${isUser ? "order-2" : "order-1"}`}>
        {/* Header with role and timestamp */}
        <div className={`flex items-center gap-2 mb-2 ${isUser ? "justify-end" : "justify-start"}`}>
          <span className={`text-xs font-mono uppercase tracking-wider ${isUser ? "text-cyan-400" : "text-green-300"}`}>
            {isUser ? "You" : "Assistant"}
          </span>
          <span className="text-xs text-green-400/40 font-mono">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className={`relative px-4 py-3 rounded-lg border-2 ${
            isUser
              ? "bg-cyan-400/5 border-cyan-400/30 text-cyan-300"
              : "bg-green-400/5 border-green-400/30 text-green-300"
          }`}
          style={{
            boxShadow: isUser
              ? "0 0 20px rgba(0, 255, 255, 0.1)"
              : "0 0 20px rgba(0, 255, 0, 0.1)",
          }}
        >
          {isUser ? (
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
                    downloadMarkdown(message.content, "Agent", message.timestamp)
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
                      
                      await downloadPDF(elementId, "Agent", message.timestamp, message.content)
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
  )
}

export default function AgentPage() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null)
  const [useStreaming, setUseStreaming] = useState(true) // Enable streaming by default
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    // Also scroll input into view after a short delay to ensure it's visible
    setTimeout(() => {
      const inputElement = document.querySelector('textarea')
      if (inputElement && !isLoading) {
        inputElement.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }, 100)
  }, [messages, isLoading])

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

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function send() {
    if (!input.trim() && !selectedImage) return

    const userMessage: Message = {
      role: "user",
      content: input || (selectedImage?.includes('data:application/pdf') ? "Analyse this PDF document" : "Analyse this screenshot"),
      timestamp: new Date(),
      imageUrl: selectedImage || undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    const currentImage = selectedImage
    setInput("")
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsLoading(true)

    // Create placeholder assistant message for streaming
    const assistantMessageId = `msg-${Date.now()}`
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
            input: currentInput || userMessage.content,
            image: currentImage || undefined,
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
                  // Append text chunk
                  setMessages((prev) => {
                    const updated = [...prev]
                    const lastMsg = updated[updated.length - 1]
                    if (lastMsg && lastMsg.role === "assistant") {
                      lastMsg.content += data.content
                    }
                    return updated
                  })
                } else if (data.type === "tool_start") {
                  // Show tool execution indicator
                  setMessages((prev) => {
                    const updated = [...prev]
                    const lastMsg = updated[updated.length - 1]
                    if (lastMsg && lastMsg.role === "assistant") {
                      lastMsg.content += `\n\n🔧 *Executing tool: ${data.toolName}...*\n\n`
                    }
                    return updated
                  })
                } else if (data.type === "tool_complete") {
                  // Tool completed
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
            input: currentInput || userMessage.content,
            image: currentImage || undefined,
          }),
        })
        const data = await res.json()

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

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      {/* Subtle Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

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
            <button
              onClick={() => window.history.back()}
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              ← Back
            </button>
          </div>
          <h1 className="text-2xl font-bold font-mono" style={{ animation: "glitch-slow 4s infinite" }}>
            ZwartifyOS Agent
          </h1>
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
              href="/agents"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Agents
            </Link>
            <Link
              href="/docs/guide"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Guide
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-6 max-w-2xl">
                  <div className="text-green-400/50 font-mono text-lg">
                    <LoadingGlyph /> Ready to assist
                  </div>
                  <p className="text-green-400/30 text-sm font-mono">
                    Start a conversation with the agent...
                  </p>
                  
                  {/* Helpful Info Box */}
                  <div className="mt-8 bg-black/50 border-2 border-green-400/30 p-6 rounded-lg text-left">
                    <h3 className="text-green-400 font-bold mb-3 font-mono text-sm uppercase">
                      💡 Want to create your own agent?
                    </h3>
                    <p className="text-green-300 text-sm mb-4">
                      This is the <strong>test interface</strong> for chatting with agents. 
                      To <strong>create a new agent</strong> with custom knowledge:
                    </p>
                    <ol className="text-green-300 text-sm space-y-2 ml-4 list-decimal mb-4">
                      <li>Go to <Link href="/agents" className="text-green-400 hover:underline font-mono">/agents</Link> to create your agent</li>
                      <li>Upload documents to <Link href="/rag" className="text-green-400 hover:underline font-mono">/rag</Link> for knowledge base</li>
                      <li>Assign the RAG folder to your agent</li>
                      <li>Test it here or use the API</li>
                    </ol>
                    <div className="flex gap-3">
                      <Link
                        href="/agents"
                        className="px-4 py-2 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-colors font-mono text-sm"
                      >
                        Create Agent →
                      </Link>
                      <Link
                        href="/docs/guide"
                        className="px-4 py-2 border border-green-400/50 text-green-400/80 hover:text-green-400 hover:bg-green-400/10 transition-colors font-mono text-sm"
                      >
                        View Guide
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, idx) => (
                  <MessageBubble key={idx} message={message} index={idx} downloadingPDF={downloadingPDF} setDownloadingPDF={setDownloadingPDF} />
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-6">
                    <div className="max-w-[85%]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-green-300">
                          Assistant
                        </span>
                      </div>
                      <div className="px-6 py-5 rounded-lg border-2 bg-green-400/5 border-green-400/30"
                           style={{ boxShadow: "0 0 30px rgba(0, 255, 0, 0.2)" }}>
                        <AgentThinkingQuote />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Section - Fixed at bottom */}
          <div className="border-t border-green-400/30 p-4 md:p-6 bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col gap-3">
              {/* Image Preview */}
              {selectedImage && (
                <div className="relative inline-block max-w-md">
                  <img 
                    src={selectedImage} 
                    alt="Selected screenshot" 
                    className="max-w-full rounded border-2 border-cyan-400/50"
                  />
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
              
              <div className="ripple relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder={selectedImage ? "Describe what you want analysed... (Cmd/Ctrl + Enter to send)" : "Type your message... (Cmd/Ctrl + Enter to send)"}
                  className="w-full h-24 bg-black border-2 border-green-400/50 text-green-400
                           font-mono p-4 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(0,255,0,0.3)]
                           placeholder-green-400/30 resize-none rounded-lg
                           caret-green-400"
                  style={{
                    textShadow: "0 0 5px rgba(0, 255, 0, 0.5)",
                  }}
                />
              </div>

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
                    className="px-4 py-2 border border-green-400/50 text-green-400 font-mono text-sm
                             hover:bg-green-400/10 transition-colors cursor-pointer rounded"
                    title="Upload PDF or image for analysis"
                  >
                    📄 Upload PDF/Image
                  </label>
                  <span className="text-xs text-green-400/40 font-mono">
                    {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                  </span>
                  {selectedImage && (
                    <span className="text-xs text-green-400/60 font-mono">
                      • {selectedImage.includes('data:application/pdf') ? 'PDF' : 'Image'} ready
                    </span>
                  )}
                </div>
                <button
                  onClick={send}
                  disabled={isLoading || (!input.trim() && !selectedImage)}
                  className="px-6 py-2 bg-black border-2 border-green-400 text-green-400 font-mono uppercase text-sm
                           hover:bg-green-400 hover:text-black transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:shadow-[0_0_20px_rgba(0,255,0,0.5)] rounded"
                  title="Send message (Cmd/Ctrl + Enter)"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <LoadingGlyph />
                      <span className="shimmer-text">Channeling...</span>
                    </span>
                  ) : (
                    "Send →"
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
