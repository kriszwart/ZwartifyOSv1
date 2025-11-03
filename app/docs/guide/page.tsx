"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

export default function UserGuidePage() {
  const [activeTab, setActiveTab] = useState("getting-started")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const tabs = [
    { id: "getting-started", label: "Getting Started", icon: "🚀" },
    { id: "using-agents", label: "Using Agents", icon: "🤖" },
    { id: "agent-management", label: "Agent Management", icon: "📊" },
    { id: "skills", label: "Agent Skills", icon: "🎯" },
    { id: "rag", label: "RAG System", icon: "🧠" },
    { id: "memory", label: "Memory & Context", icon: "💾" },
    { id: "scheduling", label: "Scheduling", icon: "🕐" },
    { id: "observability", label: "Observability", icon: "📈" },
    { id: "export", label: "Export & Deploy", icon: "📦" },
    { id: "workflow", label: "ACCV Workflow", icon: "🔁" },
    { id: "sync", label: "Auto-Sync", icon: "🔄" },
    { id: "examples", label: "Examples", icon: "💡" },
    { id: "troubleshooting", label: "Troubleshooting", icon: "🔧" },
  ]

  // Group tabs for better organization
  const tabGroups = {
    "Getting Started": ["getting-started"],
    "Core Features": ["using-agents", "agent-management", "skills", "rag", "memory", "scheduling", "observability"],
    "Deployment": ["export"],
    "Workflow": ["workflow", "sync"],
    "Resources": ["examples", "troubleshooting"],
  }

  useEffect(() => {
    // Close sidebar on mobile when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none" />

      <div className="relative z-10 min-h-screen flex">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 bg-black/90 border-r border-green-400/30 z-20
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-mono text-green-400">Guide</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-green-400 hover:text-green-300"
              >
                ✕
              </button>
            </div>
            
            <nav className="space-y-6">
              {Object.entries(tabGroups).map(([groupName, groupTabs]) => (
                <div key={groupName}>
                  <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider mb-3 px-2">
                    {groupName}
                  </h3>
                  <ul className="space-y-1">
                    {groupTabs.map((tabId) => {
                      const tab = tabs.find(t => t.id === tabId)
                      if (!tab) return null
                      return (
                        <li key={tab.id}>
                          <button
                            onClick={() => {
                              setActiveTab(tab.id)
                              if (window.innerWidth < 1024) setSidebarOpen(false)
                            }}
                            className={`
                              w-full text-left px-3 py-2 rounded text-sm font-mono
                              transition-colors flex items-center gap-2
                              ${activeTab === tab.id
                                ? 'bg-green-400/20 text-green-400 border-l-2 border-green-400'
                                : 'text-green-500 hover:text-green-300 hover:bg-green-400/10'
                              }
                            `}
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Quick Links */}
            <div className="mt-8 pt-8 border-t border-green-400/30">
              <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider mb-3 px-2">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/agents" className="block px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded font-mono">
                    → Agents
                  </Link>
                </li>
                <li>
                  <Link href="/rag" className="block px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded font-mono">
                    → RAG
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="block px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded font-mono">
                    → Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/agent" className="block px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded font-mono">
                    → Test Agent
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* Header */}
          <header className="border-b border-green-400/30 p-4 flex items-center justify-between bg-black/50 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-green-400 hover:text-green-300 font-mono"
              >
                ☰
              </button>
              <Link
                href="/docs"
                className="text-green-400 hover:text-green-300 transition-colors font-mono"
              >
                ← DOCS
              </Link>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold font-mono" style={{ animation: "glitch-slow 4s infinite" }}>
              User Guide
            </h1>
            <Link
              href="/agent"
              className="text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              AGENT →
            </Link>
          </header>

          {/* Content */}
          <main className="flex-1 max-w-4xl mx-auto px-4 py-8 md:py-12 w-full">
            {/* Intro */}
            <section className="mb-8">
              <h2 className="text-4xl font-bold mb-4 text-green-400">
                LeadnamicOS User Guide
              </h2>
              <p className="text-lg text-green-300 leading-relaxed mb-4">
                Complete guide to building, deploying, and using AI agents with LeadnamicOS. 
                Learn how to create agents, use RAG, schedule tasks, and export your agents for any use case.
              </p>
            </section>

            {/* Tab Content */}
            <div className="space-y-8">
            {activeTab === "getting-started" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Quick Start</h3>
                  <ol className="list-decimal list-inside space-y-3 text-green-300 ml-4">
                    <li>
                      <strong className="text-green-400">Test Example Agents</strong>
                      <p className="ml-6 mt-1 text-sm">Go to <Link href="/agents" className="text-green-400 hover:underline font-mono">/agents</Link> to see 4 pre-built agents with skills</p>
                    </li>
                    <li>
                      <strong className="text-green-400">Visit the Agent Interface</strong>
                      <p className="ml-6 mt-1 text-sm">Click "Launch Agent" or go to <code className="bg-black/50 px-2 py-1 rounded border border-green-400/30">/agent</code></p>
                    </li>
                    <li>
                      <strong className="text-green-400">Test the Agent</strong>
                      <p className="ml-6 mt-1 text-sm">Type a message and click "Send" to interact</p>
                    </li>
                    <li>
                      <strong className="text-green-400">Review Documentation</strong>
                      <p className="ml-6 mt-1 text-sm">Explore the Docs tab for detailed information</p>
                    </li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Example Agents</h3>
                  <p className="text-green-300 mb-4">
                    LeadnamicOS includes <strong className="text-green-400">4 pre-built example agents</strong> with skills ready to test:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">📄 PDF Processor</p>
                      <p className="text-green-300 text-xs mb-1">Skill: PDF Processing</p>
                      <p className="text-green-400/60 text-xs">Go to <Link href="/agents" className="text-green-400 hover:underline">/agents</Link> → "pdf-processor"</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">📊 Data Analyst</p>
                      <p className="text-green-300 text-xs mb-1">Skill: Data Analysis</p>
                      <p className="text-green-400/60 text-xs">Go to <Link href="/agents" className="text-green-400 hover:underline">/agents</Link> → "data-analyst"</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">🔍 Code Reviewer</p>
                      <p className="text-green-300 text-xs mb-1">Skill: Code Review</p>
                      <p className="text-green-400/60 text-xs">Go to <Link href="/agents" className="text-green-400 hover:underline">/agents</Link> → "code-reviewer"</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">💬 Customer Support</p>
                      <p className="text-green-300 text-xs mb-1">Skills: PDF + Data Analysis</p>
                      <p className="text-green-400/60 text-xs">Go to <Link href="/agents" className="text-green-400 hover:underline">/agents</Link> → "customer-support"</p>
                    </div>
                  </div>
                  <div className="bg-green-400/10 border border-green-400/30 p-3 rounded">
                    <p className="text-green-400 font-bold text-sm mb-2">How to Test:</p>
                    <ol className="text-green-300 text-xs ml-4 list-decimal space-y-1">
                      <li>Go to <Link href="/agents" className="text-green-400 hover:underline font-mono">/agents</Link></li>
                      <li>Click <strong>"View"</strong> on any agent card</li>
                      <li>Use the test interface on the agent detail page</li>
                    </ol>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">What You Can Do</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <p className="text-green-300">
                      <strong className="text-green-400">🤖 Interact with Agents</strong> - Ask questions, give instructions, receive intelligent responses
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">📊 Manage Agents</strong> - Create multiple agents, configure prompts, enable/disable
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">🧠 Use RAG</strong> - Upload documents, create knowledge bases, enhance agent context
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">🎯 Use Skills</strong> - Assign specialized capabilities to agents (PDF Processing, Data Analysis, Code Review)
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">💾 Memory & Context</strong> - Agents remember conversations across sessions
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">🕐 Schedule Agents</strong> - Automatically run agents on cron schedules
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">📈 Monitor & Observe</strong> - View execution logs, tool calls, and dashboard statistics
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">🔧 Use Tools</strong> - Agents can use registered tools (markdown formatting, screenshot analysis, etc.)
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">📝 Build Custom Tools</strong> - Add your own tools to extend agent capabilities
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">🎭 Create Personas</strong> - Build expert agents with specialized knowledge
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">🔁 Integrate Workflow</strong> - Connect Cursor, Claude Code for Web, and Vercel for full ACCV stack
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Interface Overview</h3>
                  <div className="space-y-4 text-green-300">
                    <div>
                      <strong className="text-green-400">Homepage (/):</strong>
                      <p className="ml-4 mt-1">Landing page with links to Agent, Docs, Dashboard, and GitHub</p>
                    </div>
                    <div>
                      <strong className="text-green-400">Agent Interface (/agent):</strong>
                      <p className="ml-4 mt-1">Interactive terminal for agent communication</p>
                      <ul className="ml-8 mt-2 list-disc space-y-1 text-sm">
                        <li>Input textarea for your messages</li>
                        <li>Output terminal showing agent responses</li>
                        <li>Command/Ctrl + Enter to send</li>
                        <li>History of all interactions</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-green-400">Agent Management (/agents):</strong>
                      <p className="ml-4 mt-1">Create, manage, and configure multiple agents</p>
                      <ul className="ml-8 mt-2 list-disc space-y-1 text-sm">
                        <li>View all agents (including 4 example agents)</li>
                        <li>Create new agents</li>
                        <li>Enable/disable agents</li>
                        <li>View execution logs</li>
                        <li>Assign Skills to agents</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-green-400">Agent Skills (/skills):</strong>
                      <p className="ml-4 mt-1">Manage specialized capabilities for agents</p>
                      <ul className="ml-8 mt-2 list-disc space-y-1 text-sm">
                        <li>View available skills</li>
                        <li>Create custom skills</li>
                        <li>Assign skills to agents</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-green-400">RAG Management (/rag):</strong>
                      <p className="ml-4 mt-1">Manage knowledge bases and document uploads</p>
                      <ul className="ml-8 mt-2 list-disc space-y-1 text-sm">
                        <li>Create RAG folders</li>
                        <li>Upload documents</li>
                        <li>View processed files</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-green-400">Dashboard (/dashboard):</strong>
                      <p className="ml-4 mt-1">System-wide statistics and monitoring</p>
                      <ul className="ml-8 mt-2 list-disc space-y-1 text-sm">
                        <li>Execution statistics</li>
                        <li>Agent performance</li>
                        <li>Recent executions</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-green-400">Documentation (/docs):</strong>
                      <p className="ml-4 mt-1">Comprehensive documentation with tabs for different topics</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "agent-management" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Agent Management System</h3>
                  <p className="text-green-300 mb-4">
                    LeadnamicOS includes a comprehensive agent management system where you can create, configure, and manage multiple agents.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Creating Agents</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-4">
                    <div>
                      <p className="text-green-400 font-bold mb-2">Via UI:</p>
                      <ol className="text-green-300 text-sm ml-6 list-decimal space-y-2">
                        <li>Navigate to <code className="bg-black/70 px-2 py-1 rounded border border-green-400/30">/agents</code></li>
                        <li>Click "+ Create Agent"</li>
                        <li>Fill in agent details:
                          <ul className="ml-6 mt-2 list-disc space-y-1">
                            <li><strong>Name:</strong> Unique identifier (e.g., "customer-support")</li>
                            <li><strong>Description:</strong> What the agent does</li>
                            <li><strong>Prompt:</strong> Instructions for the agent</li>
                            <li><strong>Enabled:</strong> Whether agent is active</li>
                          </ul>
                        </li>
                        <li>Click "Create Agent"</li>
                      </ol>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Via API:</p>
                      <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`curl -X POST http://localhost:3000/api/agents \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "my-agent",
    "description": "A helpful assistant",
    "prompt": "You are helpful...",
    "enabled": true
  }'`}
                      </pre>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Agent Configuration</h3>
                  <p className="text-green-300 mb-4">
                    Agents can be configured with:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">Basic Settings</p>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li><strong>Name:</strong> Unique identifier</li>
                        <li><strong>Description:</strong> Human-readable description</li>
                        <li><strong>Prompt:</strong> System instructions for the agent</li>
                        <li><strong>Version:</strong> Track agent versions</li>
                        <li><strong>Enabled/Disabled:</strong> Control availability</li>
                      </ul>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">Advanced Options</p>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li><strong>RAG Folder:</strong> Assign knowledge base</li>
                        <li><strong>Tools:</strong> Select available tools</li>
                        <li><strong>Memory:</strong> Enable conversation history</li>
                        <li><strong>Metadata:</strong> Custom configuration data</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Managing Agents</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div>
                      <p className="text-green-400 font-bold mb-2">View All Agents:</p>
                      <p className="text-green-300 text-sm ml-4">Visit <code className="bg-black/70 px-2 py-1 rounded border border-green-400/30">/agents</code> to see all your agents</p>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Enable/Disable:</p>
                      <p className="text-green-300 text-sm ml-4">Toggle agent availability without deleting</p>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Edit Agent:</p>
                      <p className="text-green-300 text-sm ml-4">Update prompt, description, or configuration</p>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">View Logs:</p>
                      <p className="text-green-300 text-sm ml-4">Click "View" to see execution history and logs</p>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Delete Agent:</p>
                      <p className="text-green-300 text-sm ml-4">Remove agent (logs are preserved)</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Agent Configuration Format</h3>
                  <p className="text-green-300 mb-4">
                    Agents can be defined in YAML/JSON format (similar to Toolhouse):
                  </p>
                  <pre className="bg-black/70 border border-green-400/30 p-4 rounded font-mono text-xs">
{`title: Customer Support Agent
description: Handles customer inquiries

prompt: |
  You are a customer support agent.
  Be helpful, professional, and empathetic.

public: false
enabled: true
version: 1.0.0
rag: customer_knowledge_base
tools:
  - markdownFormatter
metadata:
  department: Support
  priority: high`}
                  </pre>
                </section>
              </div>
            )}

            {activeTab === "skills" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Agent Skills</h3>
                  <p className="text-green-300 mb-4">
                    Skills are modular capabilities that extend agent functionality with domain-specific expertise, workflows, and best practices. Unlike tools (executable functions), Skills provide instructions and guidance that agents use automatically when relevant.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Understanding Skills</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-4">
                    <div>
                      <p className="text-green-400 font-bold mb-2">Skills vs Tools:</p>
                      <div className="grid md:grid-cols-2 gap-4 mt-2">
                        <div className="bg-black/50 border border-green-400/20 p-3 rounded">
                          <p className="text-green-400 font-bold mb-2">Skills</p>
                          <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                            <li>Domain expertise & workflows</li>
                            <li>Instructions & guidance</li>
                            <li>Loaded on-demand</li>
                            <li>Composable (multiple per agent)</li>
                          </ul>
                        </div>
                        <div className="bg-black/50 border border-green-400/20 p-3 rounded">
                          <p className="text-green-400 font-bold mb-2">Tools</p>
                          <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                            <li>Executable functions</li>
                            <li>Code-based</li>
                            <li>Always available</li>
                            <li>Multiple per agent</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Creating Skills</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-4">
                    <div>
                      <p className="text-green-400 font-bold mb-2">Via UI:</p>
                      <ol className="text-green-300 text-sm ml-6 list-decimal space-y-2">
                        <li>Navigate to <code className="bg-black/70 px-2 py-1 rounded border border-green-400/30">/skills</code></li>
                        <li>Click "+ Create Skill"</li>
                        <li>Fill in skill details:
                          <ul className="ml-6 mt-2 list-disc space-y-1">
                            <li><strong>Name:</strong> Unique identifier (lowercase, hyphens)</li>
                            <li><strong>Description:</strong> What the skill does and when to use it</li>
                            <li><strong>Instructions:</strong> Step-by-step guidance and workflows</li>
                            <li><strong>Examples:</strong> Concrete use cases (optional)</li>
                            <li><strong>Tags:</strong> Categories for discovery (optional)</li>
                            <li><strong>Resource Folder:</strong> RAG folder with additional resources (optional)</li>
                          </ul>
                        </li>
                        <li>Click "Create Skill"</li>
                      </ol>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Via API:</p>
                      <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`curl -X POST http://localhost:3000/api/skills \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "pdf-processing",
    "description": "Extract text and tables from PDF files",
    "instructions": "# PDF Processing\\n\\nUse pdfplumber...",
    "examples": ["Extract text from PDF", "Find tables in PDF"],
    "tags": ["pdf", "document", "extraction"],
    "enabled": true
  }'`}
                      </pre>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Using Skills</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div>
                      <p className="text-green-400 font-bold mb-2">Assign to Agents:</p>
                      <p className="text-green-300 text-sm ml-4">
                        When creating or editing an agent, select Skills from the Skills dropdown. Agents automatically use assigned Skills when relevant.
                      </p>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Auto-Detection:</p>
                      <p className="text-green-300 text-sm ml-4">
                        Agents can automatically detect relevant Skills from user input, even if not explicitly assigned. This works by matching Skill descriptions, tags, and keywords.
                      </p>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Skill Composition:</p>
                      <p className="text-green-300 text-sm ml-4">
                        Agents can have multiple Skills assigned, allowing you to combine capabilities (e.g., PDF Processing + Data Analysis).
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Default Skills</h3>
                  <p className="text-green-300 mb-4">
                    LeadnamicOS includes several default Skills:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">PDF Processing</p>
                      <p className="text-green-300 text-sm">Extract text, tables, fill forms, merge documents</p>
                      <p className="text-green-400/60 text-xs mt-1">Tags: pdf, document, extraction</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Data Analysis</p>
                      <p className="text-green-300 text-sm">Analyse datasets, generate insights, create visualisations</p>
                      <p className="text-green-400/60 text-xs mt-1">Tags: data, analysis, statistics</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Code Review</p>
                      <p className="text-green-300 text-sm">Review code for bugs, security, performance, best practices</p>
                      <p className="text-green-400/60 text-xs mt-1">Tags: code, review, security</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Example: PDF Processing Skill</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div>
                      <p className="text-green-400 font-bold mb-2">Skill Definition:</p>
                      <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`Name: pdf-processing
Description: Extract text and tables from PDF files
Instructions: |
  # PDF Processing
  
  Use pdfplumber to extract text from PDFs.
  For tables, use extract_table() method.
  
Examples:
  - Extract all text from this PDF
  - Find tables in this PDF
Tags: pdf, document, extraction`}
                      </pre>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Usage:</p>
                      <p className="text-green-300 text-sm ml-4">
                        When a user asks "Extract text from this PDF", the agent automatically uses the PDF Processing Skill to provide domain-specific guidance.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "rag" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">RAG (Retrieval Augmented Generation)</h3>
                  <p className="text-green-300 mb-4">
                    RAG allows agents to use your own documents as knowledge sources. Upload files, and agents can reference them when answering questions.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Setting Up RAG</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-4">
                    <div>
                      <p className="text-green-400 font-bold mb-2">Step 1: Create a RAG Folder</p>
                      <ol className="text-green-300 text-sm ml-6 list-decimal space-y-2">
                        <li>Go to <code className="bg-black/70 px-2 py-1 rounded border border-green-400/30">/rag</code></li>
                        <li>Click "+ Create Folder"</li>
                        <li>Name your folder (e.g., "company-docs")</li>
                        <li>Click "Create Folder"</li>
                      </ol>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Step 2: Upload Files</p>
                      <ul className="text-green-300 text-sm ml-6 list-disc space-y-1">
                        <li>Select your folder</li>
                        <li>Click "+ Upload File"</li>
                        <li>Choose files (.txt, .md, .pdf, .html, .json, etc.)</li>
                        <li>Files are automatically processed and chunked</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Step 3: Assign to Agent</p>
                      <p className="text-green-300 text-sm ml-4">
                        When creating or editing an agent, specify the RAG folder ID to automatically enhance its context.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Supported File Types</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Text Files</p>
                      <p className="text-green-300 text-sm">.txt, .md, .log</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Documents</p>
                      <p className="text-green-300 text-sm">.pdf, .html, .htm</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Data Files</p>
                      <p className="text-green-300 text-sm">.json, .csv, .xml</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Code Files</p>
                      <p className="text-green-300 text-sm">.py, .js, .ts, .css</p>
                    </div>
                  </div>
                  <p className="text-green-300 text-sm mt-4">
                    <strong className="text-green-400">File Size Limit:</strong> 10 MB per file
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">How RAG Works</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold">1.</span>
                      <div>
                        <p className="text-green-400 font-bold">Upload</p>
                        <p className="text-green-300 text-sm">Files are uploaded and stored</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold">2.</span>
                      <div>
                        <p className="text-green-400 font-bold">Chunking</p>
                        <p className="text-green-300 text-sm">Text is split into manageable chunks (default: 1000 chars)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold">3.</span>
                      <div>
                        <p className="text-green-400 font-bold">Embedding</p>
                        <p className="text-green-300 text-sm">Each chunk is converted to a vector embedding</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold">4.</span>
                      <div>
                        <p className="text-green-400 font-bold">Query</p>
                        <p className="text-green-300 text-sm">When agent needs context, relevant chunks are retrieved via semantic search</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold">5.</span>
                      <div>
                        <p className="text-green-400 font-bold">Enhancement</p>
                        <p className="text-green-300 text-sm">Retrieved chunks are added to the agent's prompt automatically</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Example: Customer Support with RAG</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div>
                      <p className="text-green-400 font-bold mb-2">1. Create RAG Folder:</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs">
                        Name: "customer-faq"
                      </pre>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">2. Upload FAQ Documents:</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs">
                        • refund-policy.txt
                        • shipping-info.md
                        • product-guide.pdf
                      </pre>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">3. Create Agent with RAG:</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs">
{`{
  "name": "support-agent",
  "prompt": "Answer customer questions using the knowledge base",
  "ragFolderId": "customer-faq-id"
}`}
                      </pre>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">4. Agent Now Has Access:</p>
                      <p className="text-green-300 text-sm ml-4">
                        When users ask "What's your refund policy?", the agent automatically searches the RAG folder and uses relevant documents to answer accurately.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "memory" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Conversation Memory</h3>
                  <p className="text-green-300 mb-4">
                    Agents can maintain conversation history, allowing them to remember previous messages and provide context-aware responses.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">How Memory Works</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div>
                      <p className="text-green-400 font-bold mb-2">Automatic Memory:</p>
                      <p className="text-green-300 text-sm ml-4">
                        When <code className="bg-black/70 px-2 py-1 rounded border border-green-400/30">useMemory</code> is enabled (default), each agent maintains conversation history.
                      </p>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Context Inclusion:</p>
                      <p className="text-green-300 text-sm ml-4">
                        Previous messages are automatically included in the agent's context window.
                      </p>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Persistent:</p>
                      <p className="text-green-300 text-sm ml-4">
                        Memory persists across sessions - conversations continue where they left off.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Example Conversation</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded font-mono text-sm space-y-3">
                    <div>
                      <p className="text-green-400 mb-1">User:</p>
                      <p className="text-green-300">"My name is Alice"</p>
                    </div>
                    <div>
                      <p className="text-green-400 mb-1">Agent:</p>
                      <p className="text-green-300">"Nice to meet you, Alice! How can I help you today?"</p>
                    </div>
                    <div className="border-t border-green-400/30 pt-3">
                      <p className="text-green-400 mb-1">User:</p>
                      <p className="text-green-300">"What's my name?"</p>
                    </div>
                    <div>
                      <p className="text-green-400 mb-1">Agent:</p>
                      <p className="text-green-300">"Your name is Alice"</p>
                      <p className="text-green-500 text-xs mt-1">✓ Agent remembers from previous message</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Memory Configuration</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div>
                      <p className="text-green-400 font-bold mb-2">Enable Memory:</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs">
{`{
  "input": "Hello",
  "agentId": "my-agent",
  "useMemory": true  // Default: true
}`}
                      </pre>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Memory Limits:</p>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>Default: Last 10 messages included in context</li>
                        <li>Configurable via API</li>
                        <li>Older conversations automatically pruned</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Conversation ID:</p>
                      <p className="text-green-300 text-sm ml-4">
                        You can specify a conversation ID to continue a specific conversation thread.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "scheduling" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Agent Scheduling</h3>
                  <p className="text-green-300 mb-4">
                    Schedule agents to run automatically at specified times using cron expressions.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Creating Schedules</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                    <p className="text-green-400 font-bold mb-2">Via API:</p>
                    <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`curl -X POST http://localhost:3000/api/schedules \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "report-generator",
    "cronExpression": "0 9 * * *",
    "enabled": true,
    "metadata": {
      "input": "Generate daily report"
    }
  }'`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Cron Expression Format</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded font-mono text-xs">
                    <p className="text-green-400 mb-3">Format: minute hour day month dayOfWeek</p>
                    <pre className="bg-black/70 border border-green-400/30 p-3 rounded mt-2">
{`┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6)
│ │ │ │ │
* * * * *`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Common Examples</h3>
                  <div className="space-y-2">
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-mono text-sm mb-1">Every day at 9 AM:</p>
                      <p className="text-green-300 font-mono text-xs">0 9 * * *</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-mono text-sm mb-1">Every 6 hours:</p>
                      <p className="text-green-300 font-mono text-xs">0 */6 * * *</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-mono text-sm mb-1">Every Monday at midnight:</p>
                      <p className="text-green-300 font-mono text-xs">0 0 * * 1</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-mono text-sm mb-1">Every 30 minutes:</p>
                      <p className="text-green-300 font-mono text-xs">*/30 * * * *</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-mono text-sm mb-1">Weekdays at 9 AM:</p>
                      <p className="text-green-300 font-mono text-xs">0 9 * * 1-5</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Use Cases</h3>
                  <div className="space-y-3">
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">Daily Reports</p>
                      <p className="text-green-300 text-sm">Generate and email daily summaries</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">Data Updates</p>
                      <p className="text-green-300 text-sm">Periodically refresh data from APIs</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">Monitoring</p>
                      <p className="text-green-300 text-sm">Check system health and send alerts</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">Content Generation</p>
                      <p className="text-green-300 text-sm">Auto-generate blog posts or social content</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "observability" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Execution Logs & Observability</h3>
                  <p className="text-green-300 mb-4">
                    Every agent execution is logged with detailed information for debugging, monitoring, and optimization.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">What's Logged</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div>
                      <p className="text-green-400 font-bold mb-2">Execution Details:</p>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>Execution ID (unique identifier)</li>
                        <li>Agent ID and name</li>
                        <li>Input text</li>
                        <li>Output text</li>
                        <li>Status (pending/running/completed/failed)</li>
                        <li>Start and completion timestamps</li>
                        <li>Execution duration (milliseconds)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Tool Calls:</p>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>Which tools were called</li>
                        <li>Tool arguments</li>
                        <li>Tool results</li>
                        <li>Tool execution time</li>
                        <li>Any tool errors</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Log Messages:</p>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>Info logs: Normal operations</li>
                        <li>Warn logs: Potential issues</li>
                        <li>Error logs: Errors with stack traces</li>
                        <li>Debug logs: Detailed debugging info</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Viewing Logs</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div>
                      <p className="text-green-400 font-bold mb-2">Via UI:</p>
                      <ol className="text-green-300 text-sm ml-6 list-decimal space-y-2">
                        <li>Go to <code className="bg-black/70 px-2 py-1 rounded border border-green-400/30">/agents</code></li>
                        <li>Click "View" on any agent</li>
                        <li>Or go directly to <code className="bg-black/70 px-2 py-1 rounded border border-green-400/30">/agents/[id]/logs</code></li>
                        <li>See execution timeline, tool calls, and detailed logs</li>
                      </ol>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-2">Via API:</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs">
{`# Get execution history
GET /api/agents/{id}/executions

# Get detailed logs for execution
GET /api/agents/{id}/executions/{executionId}/logs`}
                      </pre>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Dashboard</h3>
                  <p className="text-green-300 mb-4">
                    Visit <code className="bg-black/50 px-2 py-1 rounded border border-green-400/30">/dashboard</code> for system-wide statistics:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Execution Stats</p>
                      <ul className="text-green-300 text-sm list-disc ml-4 space-y-1">
                        <li>Total executions</li>
                        <li>Completed vs failed</li>
                        <li>Success rate</li>
                        <li>Average duration</li>
                      </ul>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Agent Stats</p>
                      <ul className="text-green-300 text-sm list-disc ml-4 space-y-1">
                        <li>Total agents</li>
                        <li>Enabled agents</li>
                        <li>Recent executions</li>
                        <li>Performance metrics</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Using Logs for Debugging</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div>
                      <p className="text-green-400 font-bold mb-1">Check Errors:</p>
                      <p className="text-green-300 text-sm ml-4">Look for ERROR level logs to identify issues</p>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-1">Review Tool Calls:</p>
                      <p className="text-green-300 text-sm ml-4">See which tools were used and their results</p>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-1">Performance:</p>
                      <p className="text-green-300 text-sm ml-4">Check execution duration to identify slow operations</p>
                    </div>
                    <div>
                      <p className="text-green-400 font-bold mb-1">Context:</p>
                      <p className="text-green-300 text-sm ml-4">Review input/output to understand agent behavior</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "using-agents" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Basic Agent Interaction</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-4">
                    <div>
                      <p className="text-green-300 mb-2"><strong className="text-green-400">1. Enter Your Input</strong></p>
                      <p className="text-green-300 text-sm ml-4">Type your question or instruction in the textarea</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-sm mt-2">
                        "Help me format this markdown text..."
                      </pre>
                    </div>
                    <div>
                      <p className="text-green-300 mb-2"><strong className="text-green-400">2. Send Your Message</strong></p>
                      <p className="text-green-300 text-sm ml-4">Click "Send" or press Cmd/Ctrl + Enter</p>
                    </div>
                    <div>
                      <p className="text-green-300 mb-2"><strong className="text-green-400">3. View Response</strong></p>
                      <p className="text-green-300 text-sm ml-4">Agent processes your request and displays the response with typewriter animation</p>
                    </div>
                    <div>
                      <p className="text-green-300 mb-2"><strong className="text-green-400">4. Continue Conversation</strong></p>
                      <p className="text-green-300 text-sm ml-4">All messages are logged in the output terminal for context</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Example Queries</h3>
                  <div className="space-y-3">
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-mono text-sm mb-2">Simple Question:</p>
                      <p className="text-green-300 font-mono text-xs">"What can you help me with?"</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-mono text-sm mb-2">Tool Usage:</p>
                      <p className="text-green-300 font-mono text-xs">"Format this markdown: # Hello World"</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-mono text-sm mb-2">Complex Task:</p>
                      <p className="text-green-300 font-mono text-xs">"Help me plan a WordPress portfolio site with filtering"</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-mono text-sm mb-2">Expert Consultation:</p>
                      <p className="text-green-300 font-mono text-xs">"I need advice on building a SaaS product"</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Available Tools</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <p className="text-green-400 font-bold mb-2">helloTool</p>
                      <p className="text-green-300 text-sm">Simple greeting tool for testing</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <p className="text-green-400 font-bold mb-2">markdownFormatter</p>
                      <p className="text-green-300 text-sm">Formats and cleans markdown text</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <p className="text-green-400 font-bold mb-2">screenshotDescription</p>
                      <p className="text-green-300 text-sm">Analyses screenshots (demo)</p>
                    </div>
                  </div>
                  <p className="text-green-300 text-sm mt-4">
                    Agents automatically use these tools when appropriate. You can add more tools by creating files in <code className="bg-black/50 px-2 py-1 rounded border border-green-400/30">/backend/tools/</code>
                  </p>
                </section>
              </div>
            )}

            {activeTab === "workflow" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">The ACCV Workflow</h3>
                  <p className="text-green-300 mb-4">
                    LeadnamicOS enables the full <strong className="text-green-400">ACCV</strong> (Agents, Cursor, Claude, Vercel) workflow:
                  </p>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold">1.</span>
                      <div>
                        <p className="text-green-400 font-bold">Cursor (Local)</p>
                        <p className="text-green-300 text-sm">Generate and refactor code locally with AI assistance</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold">2.</span>
                      <div>
                        <p className="text-green-400 font-bold">GitHub (Storage)</p>
                        <p className="text-green-300 text-sm">Push your code to version control</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold">3.</span>
                      <div>
                        <p className="text-green-400 font-bold">Claude Code for Web (Review)</p>
                        <p className="text-green-300 text-sm">Open PR in Claude Code for Web, get AI code review and auto-commits</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-green-400 font-bold">4.</span>
                      <div>
                        <p className="text-green-400 font-bold">Vercel (Deploy)</p>
                        <p className="text-green-300 text-sm">Automatic deployment on every push</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Setting Up Claude Code for Web</h3>
                  <ol className="list-decimal list-inside space-y-3 text-green-300 ml-4">
                    <li>
                      <strong className="text-green-400">Install Extension</strong>
                      <p className="ml-6 mt-1 text-sm">Get Claude Code for Web browser extension</p>
                    </li>
                    <li>
                      <strong className="text-green-400">Connect Repository</strong>
                      <p className="ml-6 mt-1 text-sm">Link your GitHub repository to Claude Code for Web</p>
                    </li>
                    <li>
                      <strong className="text-green-400">Create Pull Request</strong>
                      <p className="ml-6 mt-1 text-sm">Open a PR from Cursor changes</p>
                    </li>
                    <li>
                      <strong className="text-green-400">Review with Claude</strong>
                      <p className="ml-6 mt-1 text-sm">Claude analyses, suggests improvements, and can commit patches</p>
                    </li>
                    <li>
                      <strong className="text-green-400">Merge & Deploy</strong>
                      <p className="ml-6 mt-1 text-sm">Merge PR → Vercel automatically deploys</p>
                    </li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Complete Development Cycle</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded font-mono text-sm">
                    <p className="text-green-400 mb-2"># 1. Local Development</p>
                    <p className="text-green-300">Cursor → Write code locally</p>
                    
                    <p className="text-green-400 mb-2 mt-4"># 2. Version Control</p>
                    <p className="text-green-300">git add . && git commit -m "feature"</p>
                    <p className="text-green-300">git push origin main</p>
                    
                    <p className="text-green-400 mb-2 mt-4"># 3. AI Code Review</p>
                    <p className="text-green-300">Open PR in Claude Code for Web</p>
                    <p className="text-green-300">Claude reviews → suggests → commits</p>
                    
                    <p className="text-green-400 mb-2 mt-4"># 4. Auto-Sync (New!)</p>
                    <p className="text-green-300">npm run sync:watch → Auto-pulls Claude's changes</p>
                    <p className="text-green-300">Changes appear in your local codebase automatically</p>
                    
                    <p className="text-green-400 mb-2 mt-4"># 5. Auto-Deploy</p>
                    <p className="text-green-300">Vercel detects push → builds → deploys</p>
                    <p className="text-green-300">Your site updates instantly</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Auto-Sync Claude's Changes</h3>
                  <p className="text-green-300 mb-4">
                    When Claude Code for Web makes changes via GitHub, automatically sync them back to your local codebase.
                  </p>
                  
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div>
                      <p className="text-green-400 font-bold mb-2">Automatic Sync (Recommended):</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs mt-2">
                        npm run sync:watch
                      </pre>
                      <p className="text-green-300 text-sm mt-2 ml-4">Runs in background, checks every 30 seconds</p>
                    </div>
                    
                    <div>
                      <p className="text-green-400 font-bold mb-2">Manual Check:</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs mt-2">
                        npm run sync:check
                      </pre>
                      <p className="text-green-300 text-sm mt-2 ml-4">One-time check for pending changes</p>
                    </div>
                    
                    <div>
                      <p className="text-green-400 font-bold mb-2">Pull All Claude Branches:</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs mt-2">
                        npm run sync:pull
                      </pre>
                      <p className="text-green-300 text-sm mt-2 ml-4">Manually sync all claude/* branches</p>
                    </div>
                  </div>

                  <p className="text-green-300 mt-4 text-sm">
                    <strong className="text-green-400">API Endpoint:</strong> Visit <code className="bg-black/50 px-2 py-1 rounded border border-green-400/30">/api/sync</code> to check sync status
                  </p>
                </section>
              </div>
            )}

            {activeTab === "sync" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Auto-Sync Claude Code for Web Changes</h3>
                  <p className="text-green-300 mb-4">
                    When Claude Code for Web makes changes via GitHub, automatically sync them back to your local codebase. 
                    No manual git commands needed.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Quick Start</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <div>
                      <p className="text-green-400 font-bold mb-2">1. Start Automatic Sync (Recommended):</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs mt-2">
npm run sync:watch
                      </pre>
                      <p className="text-green-300 text-sm mt-2 ml-4">
                        Runs continuously in background. Checks every 30 seconds for new Claude changes. 
                        Press Ctrl+C to stop.
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-green-400 font-bold mb-2">2. Keep it running:</p>
                      <p className="text-green-300 text-sm ml-4">
                        Leave this terminal open during development. When Claude Code for Web makes changes, 
                        they'll automatically appear in your local codebase.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Usage Modes</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <p className="text-green-400 font-bold mb-2">Watch Mode (Automatic):</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs mt-2">
npm run sync:watch
                      </pre>
                      <p className="text-green-300 text-sm mt-2">
                        <strong className="text-green-400">Best for:</strong> Active development when expecting Claude changes
                      </p>
                      <ul className="text-green-300 text-sm ml-6 mt-2 list-disc space-y-1">
                        <li>Runs continuously until stopped</li>
                        <li>Checks every 30 seconds (configurable)</li>
                        <li>Automatically pulls when changes detected</li>
                        <li>Colored console output shows activity</li>
                      </ul>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <p className="text-green-400 font-bold mb-2">Check Mode (Manual):</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs mt-2">
npm run sync:check
                      </pre>
                      <p className="text-green-300 text-sm mt-2">
                        <strong className="text-green-400">Best for:</strong> Quick status check, one-time verification
                      </p>
                      <ul className="text-green-300 text-sm ml-6 mt-2 list-disc space-y-1">
                        <li>Single check operation</li>
                        <li>Reports pending changes</li>
                        <li>Does not pull automatically</li>
                        <li>Quick way to see sync status</li>
                      </ul>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <p className="text-green-400 font-bold mb-2">Pull Mode (Force Sync):</p>
                      <pre className="bg-black/70 border border-green-400/30 p-2 rounded font-mono text-xs mt-2">
npm run sync:pull
                      </pre>
                      <p className="text-green-300 text-sm mt-2">
                        <strong className="text-green-400">Best for:</strong> Force sync all branches, after being offline
                      </p>
                      <ul className="text-green-300 text-sm ml-6 mt-2 list-disc space-y-1">
                        <li>Pulls all claude/* branches</li>
                        <li>Creates local branches if missing</li>
                        <li>Updates existing branches</li>
                        <li>Useful for manual refresh</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Configuration</h3>
                  <p className="text-green-300 mb-4">
                    Add these to your <code className="bg-black/50 px-2 py-1 rounded border border-green-400/30">.env.local</code> file:
                  </p>
                  <pre className="bg-black/50 border border-green-400/30 p-4 rounded font-mono text-sm">
{`SYNC_ENABLED=true          # Enable/disable auto-sync (default: true)
SYNC_INTERVAL=30000        # Polling interval in milliseconds (default: 30s)`}
                  </pre>
                  <p className="text-green-300 text-sm mt-4">
                    <strong className="text-green-400">Note:</strong> The sync script only pulls when your working directory is clean 
                    (no uncommitted changes). This prevents overwriting your work.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Complete Workflow</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded font-mono text-sm space-y-3">
                    <div>
                      <p className="text-green-400 mb-1"># Terminal 1: Start dev server</p>
                      <p className="text-green-300">npm run dev</p>
                    </div>
                    <div>
                      <p className="text-green-400 mb-1"># Terminal 2: Start sync watcher</p>
                      <p className="text-green-300">npm run sync:watch</p>
                    </div>
                    <div>
                      <p className="text-green-400 mb-1"># Code in Cursor, push to GitHub</p>
                      <p className="text-green-300">git add . && git commit -m "feature"</p>
                      <p className="text-green-300">git push origin feature-branch</p>
                    </div>
                    <div>
                      <p className="text-green-400 mb-1"># Create PR, Claude Code for Web reviews</p>
                      <p className="text-green-300"># Claude commits to claude/improve-feature-XXXXX</p>
                    </div>
                    <div>
                      <p className="text-green-400 mb-1"># Sync script detects changes automatically</p>
                      <p className="text-green-300"># Changes appear in your local codebase</p>
                    </div>
                    <div>
                      <p className="text-green-400 mb-1"># Review and merge when ready</p>
                      <p className="text-green-300">git checkout claude/improve-feature-XXXXX</p>
                      <p className="text-green-300"># Review in Cursor, test locally</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">API Endpoint</h3>
                  <p className="text-green-300 mb-4">
                    Check sync status programmatically:
                  </p>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-2">
                    <p className="text-green-400 font-mono text-sm">GET /api/sync</p>
                    <p className="text-green-300 text-sm ml-4">Returns sync status and pending changes</p>
                    <p className="text-green-400 font-mono text-sm mt-3">POST /api/sync</p>
                    <p className="text-green-300 text-sm ml-4">Triggers sync check, returns recommended command</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Safety Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-green-300 ml-4">
                    <li><strong className="text-green-400">Working directory protection:</strong> Only syncs when no uncommitted changes</li>
                    <li><strong className="text-green-400">No force pushes:</strong> Never overwrites local work</li>
                    <li><strong className="text-green-400">Branch preservation:</strong> Returns you to original branch after sync</li>
                    <li><strong className="text-green-400">Error handling:</strong> Gracefully handles git errors</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Troubleshooting</h3>
                  <div className="space-y-3">
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">Sync not working?</p>
                      <ul className="text-green-300 text-sm ml-4 mt-2 list-disc space-y-1">
                        <li>Check <code className="bg-black/70 px-1 rounded">SYNC_ENABLED=true</code> in .env.local</li>
                        <li>Verify git remote: <code className="bg-black/70 px-1 rounded">git remote -v</code></li>
                        <li>Check for claude/* branches: <code className="bg-black/70 px-1 rounded">git branch -r | grep claude</code></li>
                      </ul>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">Working directory not clean?</p>
                      <p className="text-green-300 text-sm ml-4 mt-2">
                        Commit or stash your changes first. Sync only works when working directory is clean for safety.
                      </p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-1">No Claude branches found?</p>
                      <p className="text-green-300 text-sm ml-4 mt-2">
                        Ensure Claude Code for Web has created a PR with commits. Branch names must match <code className="bg-black/70 px-1 rounded">claude/*</code> pattern.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Learn More</h3>
                  <p className="text-green-300">
                    For detailed information, see the <Link href="/docs/sync-workflow" className="text-green-400 hover:underline">complete sync workflow guide</Link>.
                  </p>
                </section>
              </div>
            )}

            {activeTab === "examples" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Pre-Built Example Agents</h3>
                  <p className="text-green-300 mb-4">
                    LeadnamicOS comes with <strong className="text-green-400">4 example agents with skills</strong> ready to test immediately:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <p className="text-green-400 font-bold mb-2">📄 PDF Processor</p>
                      <p className="text-green-300 text-sm mb-2">Specialized for PDF document processing, extraction, and manipulation</p>
                      <p className="text-green-400/60 text-xs mb-2">Skill: PDF Processing</p>
                      <p className="text-green-400/60 text-xs mb-2">Location: <Link href="/agents" className="text-green-400 hover:underline">/agents</Link> → "pdf-processor"</p>
                      <p className="text-green-300 text-xs font-mono bg-black/50 p-2 rounded border border-green-400/20">Try: "Extract text from this PDF"</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <p className="text-green-400 font-bold mb-2">📊 Data Analyst</p>
                      <p className="text-green-300 text-sm mb-2">Expert data analysis, statistics, and visualizations</p>
                      <p className="text-green-400/60 text-xs mb-2">Skill: Data Analysis</p>
                      <p className="text-green-400/60 text-xs mb-2">Location: <Link href="/agents" className="text-green-400 hover:underline">/agents</Link> → "data-analyst"</p>
                      <p className="text-green-300 text-xs font-mono bg-black/50 p-2 rounded border border-green-400/20">Try: "Analyse this dataset"</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <p className="text-green-400 font-bold mb-2">🔍 Code Reviewer</p>
                      <p className="text-green-300 text-sm mb-2">Professional code review for bugs, security, and best practices</p>
                      <p className="text-green-400/60 text-xs mb-2">Skill: Code Review</p>
                      <p className="text-green-400/60 text-xs mb-2">Location: <Link href="/agents" className="text-green-400 hover:underline">/agents</Link> → "code-reviewer"</p>
                      <p className="text-green-300 text-xs font-mono bg-black/50 p-2 rounded border border-green-400/20">Try: "Review this code for bugs"</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <p className="text-green-400 font-bold mb-2">💬 Customer Support</p>
                      <p className="text-green-300 text-sm mb-2">Customer service with document and data analysis capabilities</p>
                      <p className="text-green-400/60 text-xs mb-2">Skills: PDF Processing + Data Analysis</p>
                      <p className="text-green-400/60 text-xs mb-2">Location: <Link href="/agents" className="text-green-400 hover:underline">/agents</Link> → "customer-support"</p>
                      <p className="text-green-300 text-xs font-mono bg-black/50 p-2 rounded border border-green-400/20">Try: "Help with my order"</p>
                    </div>
                  </div>
                  <div className="bg-green-400/10 border border-green-400/30 p-4 rounded mb-6">
                    <p className="text-green-400 font-bold mb-2">🚀 How to Test:</p>
                    <ol className="text-green-300 text-sm ml-4 list-decimal space-y-2">
                      <li>Go to <Link href="/agents" className="text-green-400 hover:underline font-mono">/agents</Link> - you'll see all 4 example agents</li>
                      <li>Click <strong>"View"</strong> on any agent card to see details and test interface</li>
                      <li>Or test via <Link href="/agent" className="text-green-400 hover:underline font-mono">/agent</Link> - agents auto-detect relevant skills</li>
                      <li>Each agent has specialized prompts and skills assigned automatically</li>
                    </ol>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Knowledge Base Assistant (RAG)</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                    <p className="text-green-300 text-sm mb-3">
                      Create an agent that uses your documents as a knowledge base.
                    </p>
                    <div className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs space-y-2">
                      <p className="text-green-400">Step 1: Create RAG Folder</p>
                      <p className="text-green-300">Go to <Link href="/rag" className="text-green-400 hover:underline">/rag</Link>, create folder "company-docs"</p>
                      
                      <p className="text-green-400 mt-3">Step 2: Upload Documents</p>
                      <p className="text-green-300">Upload FAQ, policies, product docs to the folder</p>
                      
                      <p className="text-green-400 mt-3">Step 3: Create Agent</p>
                      <p className="text-green-300">Create agent with RAG folder assigned</p>
                      
                      <p className="text-green-400 mt-3">Step 4: Test</p>
                      <p className="text-green-300">Ask: "What's your refund policy?" - Agent uses uploaded docs</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Scheduled Daily Report</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                    <p className="text-green-300 text-sm mb-3">
                      Create an agent that runs automatically on a schedule.
                    </p>
                    <div className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs space-y-2">
                      <p className="text-green-400">Agent Setup:</p>
                      <p className="text-green-300">Create "daily-report" agent with Data Analysis skill</p>
                      
                      <p className="text-green-400 mt-3">Schedule:</p>
                      <p className="text-green-300">POST to /api/schedules with cron: "0 9 * * *" (daily at 9 AM)</p>
                      
                      <p className="text-green-400 mt-3">Agent Action:</p>
                      <p className="text-green-300">Agent analyses data, generates report, sends via email/webhook</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Real-World Use Cases</h3>
                  
                  <div className="space-y-6">
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Example 1: WordPress Portfolio Builder</h4>
                      <p className="text-green-300 text-sm mb-3">
                        Build a complete portfolio system with custom post types and filtering.
                      </p>
                      <div className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs space-y-2">
                        <p className="text-green-400">User Input:</p>
                        <p className="text-green-300">"Build a kitchen portfolio section. Filter by colour and style."</p>
                        <p className="text-green-400 mt-3">Agent Action:</p>
                        <ul className="text-green-300 ml-4 list-disc space-y-1">
                          <li>Generates CPT schema</li>
                          <li>Creates REST endpoints</li>
                          <li>Builds grid React components</li>
                          <li>Suggests SEO metadata</li>
                        </ul>
                        <p className="text-green-400 mt-3">Result:</p>
                        <p className="text-green-300">Complete portfolio system ready for deployment</p>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Example 2: SaaS Admin Generator</h4>
                      <p className="text-green-300 text-sm mb-3">
                        Generate a complete subscription product with admin dashboard.
                      </p>
                      <div className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs space-y-2">
                        <p className="text-green-400">User Input:</p>
                        <p className="text-green-300">"Make a subscription product with admin dashboard and event logs."</p>
                        <p className="text-green-400 mt-3">Agent Action:</p>
                        <ul className="text-green-300 ml-4 list-disc space-y-1">
                          <li>Generates DB schema</li>
                          <li>Writes API handlers</li>
                          <li>Creates dashboard UI</li>
                          <li>Integrates Stripe</li>
                        </ul>
                        <p className="text-green-400 mt-3">Result:</p>
                        <p className="text-green-300">Full SaaS product ready to deploy</p>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Example 3: Expert Persona Builder</h4>
                      <p className="text-green-300 text-sm mb-3">
                        Create a domain-specific expert assistant.
                      </p>
                      <div className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs space-y-2">
                        <p className="text-green-400">User Input:</p>
                        <p className="text-green-300">"Make me an expert on UK probate. Provide templates and calculators."</p>
                        <p className="text-green-400 mt-3">Agent Action:</p>
                        <ul className="text-green-300 ml-4 list-disc space-y-1">
                          <li>Pulls primary source rules</li>
                          <li>Creates calculators</li>
                          <li>Wraps persona</li>
                          <li>Creates docs route</li>
                        </ul>
                        <p className="text-green-400 mt-3">Result:</p>
                        <p className="text-green-300">Complete expert system in a box</p>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Example 4: Migration Assistant</h4>
                      <p className="text-green-300 text-sm mb-3">
                        Migrate content between platforms with transformations.
                      </p>
                      <div className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs space-y-2">
                        <p className="text-green-400">User Input:</p>
                        <p className="text-green-300">"Migrate blog posts from WP to a static Next front end and transform images to WebP."</p>
                        <p className="text-green-400 mt-3">Agent Action:</p>
                        <ul className="text-green-300 ml-4 list-disc space-y-1">
                          <li>Reads WP JSON</li>
                          <li>Transforms to MDX</li>
                          <li>Creates blog route</li>
                          <li>Converts images</li>
                          <li>Builds RSS</li>
                        </ul>
                        <p className="text-green-400 mt-3">Result:</p>
                        <p className="text-green-300">Complete migration with optimised assets</p>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Example 5: Knowledge Base Assistant (RAG)</h4>
                      <p className="text-green-300 text-sm mb-3">
                        Create an agent that uses your own documents for accurate answers.
                      </p>
                      <div className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs space-y-2">
                        <p className="text-green-400">Setup:</p>
                        <ol className="text-green-300 ml-4 list-decimal space-y-1">
                          <li>Create RAG folder: "company-policies"</li>
                          <li>Upload: employee-handbook.pdf, hr-policies.txt</li>
                          <li>Create agent with RAG folder assigned</li>
                        </ol>
                        <p className="text-green-400 mt-3">User Input:</p>
                        <p className="text-green-300">"What's the vacation policy?"</p>
                        <p className="text-green-400 mt-3">Agent Action:</p>
                        <ul className="text-green-300 ml-4 list-disc space-y-1">
                          <li>Searches RAG folder semantically</li>
                          <li>Retrieves relevant chunks from handbook</li>
                          <li>Uses retrieved context to answer</li>
                        </ul>
                        <p className="text-green-400 mt-3">Result:</p>
                        <p className="text-green-300">Accurate answer based on company documents</p>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Example 6: Scheduled Daily Report</h4>
                      <p className="text-green-300 text-sm mb-3">
                        Automatically generate and send daily reports.
                      </p>
                      <div className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs space-y-2">
                        <p className="text-green-400">Setup:</p>
                        <ol className="text-green-300 ml-4 list-decimal space-y-1">
                          <li>Create agent: "daily-reporter"</li>
                          <li>Create schedule: cron "0 9 * * *" (9 AM daily)</li>
                          <li>Configure with report generation prompt</li>
                        </ol>
                        <p className="text-green-400 mt-3">Schedule Trigger:</p>
                        <p className="text-green-300">Every day at 9 AM automatically</p>
                        <p className="text-green-400 mt-3">Agent Action:</p>
                        <ul className="text-green-300 ml-4 list-disc space-y-1">
                          <li>Collects data from APIs</li>
                          <li>Generates formatted report</li>
                          <li>Emails to team (via tool)</li>
                        </ul>
                        <p className="text-green-400 mt-3">Result:</p>
                        <p className="text-green-300">Daily reports sent automatically, no manual work</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Building Your Own Examples</h3>
                  <p className="text-green-300 mb-4">
                    To create custom use cases:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-green-300 ml-4">
                    <li>Identify the problem you want to solve</li>
                    <li>Determine which tools you need</li>
                    <li>Create or modify tools in <code className="bg-black/50 px-2 py-1 rounded border border-green-400/30">/backend/tools/</code></li>
                    <li>Build agents that use those tools</li>
                    <li>Test via the Agent interface</li>
                    <li>Deploy and iterate</li>
                  </ol>
                </section>
              </div>
            )}

            {activeTab === "export" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Export & Deploy Agents</h3>
                  <p className="text-green-300 mb-4">
                    LeadnamicOS agents can be exported and deployed in multiple ways. Your agents are already available as APIs, 
                    but you can also package them for various platforms and use cases.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Export Options</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">1. API Integration (Ready to Use)</h4>
                      <p className="text-green-300 text-sm mb-3">
                        Your agents are already available as REST API endpoints. No additional setup needed!
                      </p>
                      <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`POST /api/agent
Content-Type: application/json

{
  "input": "user query",
  "agentId": "your-agent-id",
  "metadata": { "userId": "123" }
}`}
                      </pre>
                      <p className="text-green-300 text-sm mt-3">
                        <strong className="text-green-400">Use Cases:</strong> Integrate into web apps, mobile apps, 
                        chatbots, or any application that can make HTTP requests.
                      </p>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">2. Embeddable Widget</h4>
                      <p className="text-green-300 text-sm mb-3">
                        Build a chat widget that can be embedded in any website.
                      </p>
                      <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`<!-- Add to your website -->
<script src="https://your-site.com/widget.js"></script>
<div id="leadnamic-agent"></div>
<script>
  LeadnamicAgent.init({
    agentId: 'your-agent-id',
    apiUrl: 'https://your-site.com/api/agent'
  })
</script>`}
                      </pre>
                      <p className="text-green-300 text-sm mt-3">
                        <strong className="text-green-400">Use Cases:</strong> Customer support chat, 
                        documentation assistant, product Q&A on websites.
                      </p>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">3. Standalone Application</h4>
                      <p className="text-green-300 text-sm mb-3">
                        Deploy the entire LeadnamicOS platform as a standalone application.
                      </p>
                      <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`# Deploy to Vercel (already configured)
vercel deploy

# Or deploy to any Node.js host
npm run build
npm start`}
                      </pre>
                      <p className="text-green-300 text-sm mt-3">
                        <strong className="text-green-400">Use Cases:</strong> White-label platform, 
                        internal company tool, SaaS product, client-facing application.
                      </p>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">4. Docker Container</h4>
                      <p className="text-green-300 text-sm mb-3">
                        Containerize your agents for cloud deployment.
                      </p>
                      <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`# Build Docker image
docker build -t my-agent:latest .

# Run container
docker run -p 3000:3000 my-agent

# Deploy to Kubernetes, AWS ECS, etc.`}
                      </pre>
                      <p className="text-green-300 text-sm mt-3">
                        <strong className="text-green-400">Use Cases:</strong> Kubernetes deployment, 
                        cloud container services, scalable microservices.
                      </p>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">5. Serverless Functions</h4>
                      <p className="text-green-300 text-sm mb-3">
                        Package agents as serverless functions for auto-scaling.
                      </p>
                      <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`# Vercel Functions (already configured)
vercel deploy

# AWS Lambda
zip -r agent.zip . -x node_modules/\\*
aws lambda update-function-code --zip-file fileb://agent.zip

# Google Cloud Functions
gcloud functions deploy agent --runtime nodejs18`}
                      </pre>
                      <p className="text-green-300 text-sm mt-3">
                        <strong className="text-green-400">Use Cases:</strong> Cost-effective scaling, 
                        pay-per-use, edge deployment, high-traffic applications.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Use Cases & Applications</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Customer Support</h4>
                      <p className="text-green-300 text-sm mb-2">
                        Deploy support agents with RAG knowledge base for 24/7 customer assistance.
                      </p>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>Website chat widget</li>
                        <li>Email support integration</li>
                        <li>Support ticket system</li>
                      </ul>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Internal Knowledge Base</h4>
                      <p className="text-green-300 text-sm mb-2">
                        Company-wide knowledge management with instant answers to employee questions.
                      </p>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>Slack/Discord bot integration</li>
                        <li>Internal portal</li>
                        <li>Email-based queries</li>
                      </ul>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Content Generation</h4>
                      <p className="text-green-300 text-sm mb-2">
                        Automatically generate blog posts, reports, summaries on schedule.
                      </p>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>WordPress plugin</li>
                        <li>CMS integration</li>
                        <li>Scheduled content service</li>
                      </ul>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Data Analysis & Reporting</h4>
                      <p className="text-green-300 text-sm mb-2">
                        Automated data analysis with scheduled report generation.
                      </p>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>Dashboard application</li>
                        <li>Email reports</li>
                        <li>API for custom reports</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Integration Examples</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">React/Next.js Integration</h4>
                      <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`const response = await fetch('/api/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    input: userInput, 
    agentId: 'my-agent' 
  })
})
const data = await response.json()`}
                      </pre>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Python Integration</h4>
                      <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`import requests

response = requests.post(
  'https://your-site.com/api/agent',
  json={
    'input': user_input,
    'agentId': 'my-agent'
  }
)
data = response.json()`}
                      </pre>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Node.js Integration</h4>
                      <pre className="bg-black/70 border border-green-400/30 p-3 rounded font-mono text-xs">
{`const response = await fetch('https://your-site.com/api/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    input: userInput, 
    agentId: 'my-agent' 
  })
})
const data = await response.json()`}
                      </pre>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Export Agent Configuration</h3>
                  <p className="text-green-300 mb-4">
                    Export agent definitions as JSON/YAML for version control, sharing, or backup.
                  </p>
                  <pre className="bg-black/70 border border-green-400/30 p-4 rounded font-mono text-xs">
{`{
  "id": "agent-uuid",
  "name": "customer-support",
  "description": "Customer support agent",
  "prompt": "You are a helpful customer support agent...",
  "version": "1.0.0",
  "enabled": true,
  "ragFolderId": "customer-faq-folder-id",
  "useMemory": true,
  "tools": ["markdownFormatter"],
  "metadata": {
    "department": "Support",
    "priority": "high"
  }
}`}
                  </pre>
                  <p className="text-green-300 text-sm mt-4">
                    <strong className="text-green-400">Use Cases:</strong> Version control, agent templates, 
                    sharing configurations, backup/restore, team collaboration.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Deployment Targets</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Web Apps</p>
                      <p className="text-green-300 text-sm">React, Vue, Svelte, Static sites</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Mobile</p>
                      <p className="text-green-300 text-sm">React Native, iOS, Android, Flutter</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Desktop</p>
                      <p className="text-green-300 text-sm">Electron, Tauri, Native apps</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Chat Platforms</p>
                      <p className="text-green-300 text-sm">Slack, Discord, Telegram, Teams</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">Server Apps</p>
                      <p className="text-green-300 text-sm">Node.js, Python, Go, Ruby</p>
                    </div>
                    <div className="bg-black/50 border border-green-400/30 p-3 rounded">
                      <p className="text-green-400 font-bold mb-2">IoT & Embedded</p>
                      <p className="text-green-300 text-sm">Raspberry Pi, Arduino, Edge devices</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Getting Started with Export</h3>
                  <ol className="list-decimal list-inside space-y-3 text-green-300 ml-4">
                    <li>
                      <strong className="text-green-400">Prepare Your Agent</strong>
                      <p className="ml-6 mt-1 text-sm">Create and test your agent in LeadnamicOS, configure RAG folders, tools, and memory</p>
                    </li>
                    <li>
                      <strong className="text-green-400">Choose Export Method</strong>
                      <p className="ml-6 mt-1 text-sm">API (ready), Widget, Standalone app, Docker, or Serverless</p>
                    </li>
                    <li>
                      <strong className="text-green-400">Deploy</strong>
                      <p className="ml-6 mt-1 text-sm">Deploy to Vercel, Docker, AWS, or your preferred platform</p>
                    </li>
                    <li>
                      <strong className="text-green-400">Integrate</strong>
                      <p className="ml-6 mt-1 text-sm">Connect to your application via API or embed widget</p>
                    </li>
                    <li>
                      <strong className="text-green-400">Monitor</strong>
                      <p className="ml-6 mt-1 text-sm">Use dashboard at <code className="bg-black/50 px-2 py-1 rounded border border-green-400/30">/dashboard</code> to monitor performance</p>
                    </li>
                  </ol>
                </section>
              </div>
            )}

            {activeTab === "troubleshooting" && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Common Issues</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Agent Not Responding</h4>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>Check that <code className="bg-black/70 px-1 rounded">CLAUDE_API_KEY</code> is set in Vercel environment variables</li>
                        <li>Verify the API key is valid and has credits</li>
                        <li>Check browser console for errors</li>
                        <li>Review Vercel function logs</li>
                      </ul>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Tools Not Working</h4>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>Ensure tools are imported in <code className="bg-black/70 px-1 rounded">/backend/tools/index.ts</code></li>
                        <li>Verify tool structure (name, description, execute)</li>
                        <li>Check that tools are properly exported</li>
                        <li>Review server logs for tool errors</li>
                      </ul>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Deployment Issues</h4>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>Verify <code className="bg-black/70 px-1 rounded">vercel.json</code> build command</li>
                        <li>Check Vercel build logs for errors</li>
                        <li>Ensure all dependencies are in <code className="bg-black/70 px-1 rounded">package.json</code></li>
                        <li>Verify environment variables are set in Vercel</li>
                      </ul>
                    </div>

                    <div className="bg-black/50 border border-green-400/30 p-4 rounded">
                      <h4 className="text-green-400 font-bold mb-2">Performance</h4>
                      <ul className="text-green-300 text-sm ml-4 list-disc space-y-1">
                        <li>Agent responses may take 5-30 seconds depending on complexity</li>
                        <li>Long responses stream via typewriter effect</li>
                        <li>Check network tab for API response times</li>
                        <li>Consider optimizing tool execution time</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Getting Help</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-3">
                    <p className="text-green-300">
                      <strong className="text-green-400">Documentation:</strong> Review the <Link href="/docs" className="text-green-400 hover:underline">Docs</Link> page for detailed information
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">GitHub:</strong> Check <a href="https://github.com/kriszwart/leadnamicos" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">issues</a> or create a new one
                    </p>
                    <p className="text-green-300">
                      <strong className="text-green-400">Read the Code:</strong> LeadnamicOS is open source - inspect the implementation
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">Best Practices</h3>
                  <div className="bg-black/50 border border-green-400/30 p-4 rounded space-y-2 text-green-300 text-sm">
                    <p>• Start with simple queries to test the system</p>
                    <p>• Build tools incrementally, test each one</p>
                    <p>• Use the Agent interface to iterate quickly</p>
                    <p>• Commit working code frequently</p>
                    <p>• Let Claude Code for Web review before merging</p>
                    <p>• Monitor Vercel logs for production issues</p>
                    <p>• Keep API keys secure, never commit them</p>
                  </div>
                </section>
              </div>
            )}
            </div>

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-green-400/30 text-center text-sm text-green-500 opacity-60">
              <Link href="/docs" className="hover:text-green-400 transition-colors">
                ← Back to Docs
              </Link>
              {" • "}
              <Link href="/agent" className="hover:text-green-400 transition-colors">
                Agent
              </Link>
              {" • "}
              <Link href="/" className="hover:text-green-400 transition-colors">
                Home
              </Link>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}

