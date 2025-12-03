"use client"

import Link from "next/link"
import { useState } from "react"

export default function RoadmapPage() {
  const [expandedStep, setExpandedStep] = useState<number | null>(0)

  const steps = [
    {
      id: 1,
      title: "Start with Natural Language",
      icon: "💬",
      description: "Describe what you want in plain English",
      example: "Create an agent that qualifies sales leads and schedules demos",
      color: "cyan",
      details: [
        "No coding required - just describe your goal",
        "G-SAC understands business requirements",
        "Works with any domain or use case"
      ]
    },
    {
      id: 2,
      title: "G-SAC Analyses Your Goal",
      icon: "🎯",
      description: "The Growth Strategy Agent Creator analyses your request",
      color: "purple",
      details: [
        "Breakdown: Understands the business objective",
        "Strategy: Identifies required capabilities",
        "Design: Plans agent architecture"
      ]
    },
    {
      id: 3,
      title: "Selects Tools & Skills",
      icon: "🔧",
      description: "Automatically configures capabilities",
      color: "yellow",
      details: [
        "Tools: Executable functions (APIs, integrations)",
        "Skills: Domain expertise and workflows",
        "MCP: Platform integrations (Slack, CRM, etc.)"
      ]
    },
    {
      id: 4,
      title: "Drafts Agent Prompt",
      icon: "✍️",
      description: "Creates comprehensive system prompt",
      color: "green",
      details: [
        "Context: Incorporates business requirements",
        "Instructions: Clear behavioural guidelines",
        "Capabilities: Lists available tools and skills"
      ]
    },
    {
      id: 5,
      title: "Configures Knowledge Base",
      icon: "📚",
      description: "Sets up RAG folder if needed",
      color: "blue",
      details: [
        "RAG: Retrieval-Augmented Generation",
        "Context: Company docs, FAQs, playbooks",
        "Smart: Only added when relevant"
      ]
    },
    {
      id: 6,
      title: "Deploys Agent Instantly",
      icon: "✨",
      description: "Your agent is live and ready",
      color: "pink",
      details: [
        "Active: Immediately available in system",
        "Tracked: Full lineage and creation history",
        "Ready: Can create more agents!"
      ]
    },
    {
      id: 7,
      title: "Agent Creates More Agents",
      icon: "⚛️",
      description: "The recursive magic begins",
      color: "green",
      details: [
        "Meta: Agents can create other agents",
        "Scalable: Exponential capability growth",
        "Tracked: Full genealogy of agent creation"
      ]
    }
  ]

  const features = [
    {
      name: "Tool Search",
      icon: "🔍",
      description: "Dynamic tool discovery (85% token savings)",
      link: "/docs"
    },
    {
      name: "Tool Examples",
      icon: "📝",
      description: "Pattern examples for 90% accuracy",
      link: "/docs"
    },
    {
      name: "Skills System",
      icon: "🧠",
      description: "Modular capabilities that add domain expertise",
      link: "/skills"
    },
    {
      name: "RAG System",
      icon: "📚",
      description: "Knowledge bases for contextual agents",
      link: "/rag"
    },
    {
      name: "Memory System",
      icon: "💭",
      description: "Context-aware conversations",
      link: "/agent"
    },
    {
      name: "Scheduling",
      icon: "⏰",
      description: "Automate agent runs with cron",
      link: "/dashboard"
    },
    {
      name: "Execution Logging",
      icon: "📊",
      description: "Full observability and tracking",
      link: "/dashboard"
    },
    {
      name: "Tool System",
      icon: "🔨",
      description: "Extend agents with custom functions",
      link: "/docs"
    },
    {
      name: "MCP Integration",
      icon: "🌐",
      description: "Universal platform support",
      link: "/mcp"
    },
    {
      name: "Agent Lineage",
      icon: "🔗",
      description: "Track agent creation history",
      link: "/agents"
    },
    {
      name: "Agent Sessions",
      icon: "🔄",
      description: "Persistent multi-turn sessions",
      link: "/docs"
    },
    {
      name: "Autonomous Mode",
      icon: "🤖",
      description: "Multi-turn tool loops",
      link: "/docs"
    },
    {
      name: "Background Jobs",
      icon: "⚡",
      description: "Async job queue processing",
      link: "/dashboard"
    },
    {
      name: "Event Triggers",
      icon: "🎯",
      description: "Webhooks and agent chains",
      link: "/docs"
    },
    {
      name: "Self-Improve",
      icon: "📈",
      description: "Performance self-analysis",
      link: "/docs"
    },
    {
      name: "Error Analysis",
      icon: "🔍",
      description: "Learn from failures",
      link: "/docs"
    },
    {
      name: "Prompt Refiner",
      icon: "✨",
      description: "Auto-improve prompts",
      link: "/docs"
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      cyan: "border-cyan-400/50 bg-cyan-400/5 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-400/10",
      purple: "border-purple-400/50 bg-purple-400/5 text-purple-300 hover:border-purple-400 hover:bg-purple-400/10",
      yellow: "border-yellow-400/50 bg-yellow-400/5 text-yellow-300 hover:border-yellow-400 hover:bg-yellow-400/10",
      green: "border-green-400/50 bg-green-400/5 text-green-300 hover:border-green-400 hover:bg-green-400/10",
      blue: "border-blue-400/50 bg-blue-400/5 text-blue-300 hover:border-blue-400 hover:bg-blue-400/10",
      pink: "border-pink-400/50 bg-pink-400/5 text-pink-300 hover:border-pink-400 hover:bg-pink-400/10"
    }
    return colors[color] || colors.green
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
            <Link
              href="/create-agent"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Create Agent
            </Link>
          </div>
          <h1 className="text-2xl font-bold font-mono">The Roadmap</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/changelog"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Changelog
            </Link>
            <Link
              href="/agents"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Agents
            </Link>
            <Link
              href="/docs"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Docs
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Agents Creating Agents
            </h2>
            <p className="text-xl text-green-300/80 max-w-3xl mx-auto mb-6">
              Watch how a single prompt transforms into a fully functional AI agent—and how that agent can create more agents.
            </p>
            <Link
              href="/create-agent"
              className="inline-block px-8 py-4 border-2 border-purple-400 text-purple-400 hover:bg-purple-400/10 transition-colors font-mono text-lg font-bold"
            >
              Try It Now →
            </Link>
          </div>

          {/* Journey Steps */}
          <div className="space-y-6 mb-16">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-24 w-0.5 h-16 bg-gradient-to-b from-green-400/50 to-transparent" />
                )}
                
                <div
                  className={`border-2 rounded-lg p-6 transition-all cursor-pointer ${getColorClasses(step.color)}`}
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  <div className="flex items-start gap-6">
                    {/* Step Number & Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full border-2 border-current flex items-center justify-center text-2xl bg-black/50">
                        {step.icon}
                      </div>
                      <div className="text-xs font-mono text-center mt-2 opacity-60">
                        Step {step.id}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                      <p className="text-lg mb-3 opacity-80">{step.description}</p>
                      
                      {/* Example */}
                      <div className="bg-black/50 border border-current/30 rounded p-3 mb-3">
                        <div className="text-xs font-mono uppercase opacity-60 mb-1">Example:</div>
                        <div className="font-mono text-sm">{step.example}</div>
                      </div>

                      {/* Expandable Details */}
                      {expandedStep === step.id && (
                        <div className="mt-4 space-y-2 animate-fade-in">
                          {step.details.map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm opacity-90">
                              <span className="text-green-400 mt-1">→</span>
                              <span>{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expand Indicator */}
                    <button className="text-2xl opacity-40 hover:opacity-100 transition-opacity">
                      {expandedStep === step.id ? "−" : "+"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Platform Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => (
                <Link
                  key={feature.name}
                  href={feature.link}
                  className="bg-black/50 border-2 border-green-400/30 p-4 rounded-lg hover:border-green-400/50 hover:bg-green-400/5 transition-all group"
                >
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <h3 className="font-bold text-green-400 mb-1 group-hover:text-green-300">
                    {feature.name}
                  </h3>
                  <p className="text-sm text-green-300/70">{feature.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-green-400/10 via-purple-400/10 to-cyan-400/10 border-2 border-green-400/50 p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-lg text-green-300/80 mb-6 max-w-2xl mx-auto">
              Start creating your first agent with G-SAC. It takes just a single prompt.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/create-agent-visual"
                className="px-8 py-4 border-2 border-cyan-400 bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30 transition-colors font-mono font-bold"
              >
                🎨 Visual Builder
              </Link>
              <Link
                href="/playground"
                className="px-8 py-4 border-2 border-green-400 bg-green-400/20 text-green-300 hover:bg-green-400/30 transition-colors font-mono font-bold"
              >
                Try Playground
              </Link>
              <Link
                href="/create-agent"
                className="px-8 py-4 border-2 border-purple-400 bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 transition-colors font-mono font-bold"
              >
                Create Agent with G-SAC
              </Link>
              <Link
                href="/agents"
                className="px-8 py-4 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-colors font-mono"
              >
                View All Agents
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-green-400/30">
              <p className="text-sm text-green-400/70 mb-4">
                Interested in our long-term vision for autonomous, self-improving agents?
              </p>
              <Link
                href="/roadmap/future"
                className="inline-block px-8 py-4 border-2 border-cyan-400 bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30 transition-colors font-mono font-bold"
              >
                🐍 See Future Vision: The Ouroboros (2026+) →
              </Link>
              <p className="text-xs text-yellow-400/60 mt-2">
                Note: Future roadmap features, not yet implemented
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

