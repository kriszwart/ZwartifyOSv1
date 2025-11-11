"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface DemoStep {
  id: number
  title: string
  description: string
  icon: string
  content: string
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCost: number
  }
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: "Introduction",
    description: "What is ZwartifyOS and G-SAC",
    icon: "🚀",
    content: `ZwartifyOS is an operating system for building intelligent products. 

At its core is G-SAC (Growth Strategy Agent Creator) - a meta-agent that creates other agents from a single natural language prompt.

This demo shows how G-SAC transforms your request into a fully functional agent.`,
  },
  {
    id: 2,
    title: "User Prompt",
    description: "You provide a simple request",
    icon: "💬",
    content: `User Request:

"Create an agent that qualifies sales leads and schedules demos"

This is all you need to provide. G-SAC handles the rest.`,
  },
  {
    id: 3,
    title: "Business Goal Translation",
    description: "G-SAC analyzes your requirements",
    icon: "🎯",
    content: `G-SAC uses its BusinessGoalTranslator skill to understand:

• Primary objective: Qualify sales leads
• Secondary objective: Schedule demos
• Key capabilities needed: Lead assessment, calendar integration
• Success criteria: Qualified leads → scheduled demos

Token Usage: 1,245 input / 892 output tokens`,
    tokenUsage: {
      inputTokens: 1245,
      outputTokens: 892,
      totalTokens: 2137,
      estimatedCost: 0.0167,
    },
  },
  {
    id: 4,
    title: "Tool Selection",
    description: "G-SAC selects appropriate tools",
    icon: "🔧",
    content: `G-SAC uses ToolIntegrator to select tools:

• callMCP - For platform integration (Slack, email, calendar)
• No createAgent needed (this agent won't create others)
• Custom logic for lead qualification scoring

Token Usage: 892 input / 567 output tokens`,
    tokenUsage: {
      inputTokens: 892,
      outputTokens: 567,
      totalTokens: 1459,
      estimatedCost: 0.0102,
    },
  },
  {
    id: 5,
    title: "Platform Integration",
    description: "G-SAC configures multi-platform support",
    icon: "🌐",
    content: `G-SAC uses PlatformIntegrator to enable:

• Slack integration for notifications
• Email integration for outreach
• Calendar API for scheduling
• CRM integration for lead tracking

All via Model Context Protocol (MCP) for platform-agnostic design.

Token Usage: 567 input / 423 output tokens`,
    tokenUsage: {
      inputTokens: 567,
      outputTokens: 423,
      totalTokens: 990,
      estimatedCost: 0.0071,
    },
  },
  {
    id: 6,
    title: "Agent Prompt Generation",
    description: "G-SAC creates comprehensive system prompt",
    icon: "📝",
    content: `G-SAC generates a detailed system prompt including:

• Agent's role and purpose
• Lead qualification criteria
• Demo scheduling workflow
• Platform interaction guidelines
• Best practices and constraints

Token Usage: 423 input / 1,234 output tokens`,
    tokenUsage: {
      inputTokens: 423,
      outputTokens: 1234,
      totalTokens: 1657,
      estimatedCost: 0.0194,
    },
  },
  {
    id: 7,
    title: "Agent Creation",
    description: "G-SAC calls createAgent tool",
    icon: "✨",
    content: `G-SAC executes the createAgent tool with:

• Name: "sales-lead-qualifier"
• Description: "Qualifies sales leads and schedules demos"
• Prompt: [Generated comprehensive prompt]
• Tools: ["callMCP"]
• Skills: ["sales-qualification", "calendar-management"]
• MCP Servers: ["slack", "email", "calendar"]

Agent created successfully!

Token Usage: 1,234 input / 456 output tokens`,
    tokenUsage: {
      inputTokens: 1234,
      outputTokens: 456,
      totalTokens: 1690,
      estimatedCost: 0.0103,
    },
  },
  {
    id: 8,
    title: "Result",
    description: "Your agent is ready to use",
    icon: "✅",
    content: `Agent Created Successfully!

Name: sales-lead-qualifier
ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Status: Enabled
Platforms: Slack, Email, Calendar
Tools: callMCP
Skills: sales-qualification, calendar-management

Your agent is now live and ready to qualify leads and schedule demos!`,
  },
]

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [displayedText, setDisplayedText] = useState("")
  const [cumulativeTokens, setCumulativeTokens] = useState({ input: 0, output: 0, total: 0, cost: 0 })

  useEffect(() => {
    if (isPlaying && currentStep < demoSteps.length) {
      const step = demoSteps[currentStep]
      setDisplayedText("")
      
      // Typewriter effect
      let charIndex = 0
      const typeInterval = setInterval(() => {
        if (charIndex < step.content.length) {
          setDisplayedText(step.content.substring(0, charIndex + 1))
          charIndex++
        } else {
          clearInterval(typeInterval)
          
          // Update cumulative tokens
          if (step.tokenUsage) {
            setCumulativeTokens(prev => ({
              input: prev.input + step.tokenUsage!.inputTokens,
              output: prev.output + step.tokenUsage!.outputTokens,
              total: prev.total + step.tokenUsage!.totalTokens,
              cost: prev.cost + step.tokenUsage!.estimatedCost,
            }))
          }
          
          // Auto-advance after 3 seconds
          setTimeout(() => {
            if (currentStep < demoSteps.length - 1) {
              setCurrentStep(prev => prev + 1)
            } else {
              setIsPlaying(false)
            }
          }, 3000)
        }
      }, 30) // 30ms per character for smooth typing

      return () => clearInterval(typeInterval)
    }
  }, [currentStep, isPlaying])

  const startDemo = () => {
    setCurrentStep(0)
    setDisplayedText("")
    setCumulativeTokens({ input: 0, output: 0, total: 0, cost: 0 })
    setIsPlaying(true)
  }

  const resetDemo = () => {
    setIsPlaying(false)
    setCurrentStep(0)
    setDisplayedText("")
    setCumulativeTokens({ input: 0, output: 0, total: 0, cost: 0 })
  }

  const currentStepData = demoSteps[currentStep]

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
            href="/"
            className="text-green-400 hover:text-green-300 transition-colors font-mono"
          >
            ← HOME
          </Link>
          <h1 className="text-2xl font-bold font-mono">System Demo</h1>
          <div className="flex gap-4">
            <Link
              href="/create-agent"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Try It Live
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Introduction */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              How G-SAC Creates Agents
            </h2>
            <p className="text-green-300/80 mb-6 max-w-2xl mx-auto">
              Watch how a single natural language prompt becomes a fully functional agent with platform integration, tools, and skills.
            </p>
            {!isPlaying && currentStep === 0 && (
              <button
                onClick={startDemo}
                className="px-8 py-4 border-2 border-purple-400 bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 transition-all font-mono font-bold text-lg"
              >
                ▶ Start Demo
              </button>
            )}
            {isPlaying && (
              <button
                onClick={resetDemo}
                className="px-8 py-4 border-2 border-red-400 bg-red-400/20 text-red-300 hover:bg-red-400/30 transition-all font-mono font-bold text-lg"
              >
                ⏹ Stop Demo
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-400/60 font-mono">
                Step {currentStep + 1} of {demoSteps.length}
              </span>
              <span className="text-sm text-green-400/60 font-mono">
                {Math.round(((currentStep + 1) / demoSteps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-black/50 border border-green-400/30 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Step Display */}
          <div className="bg-black/50 border-2 border-green-400/50 p-8 rounded-lg mb-8 min-h-[400px]">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-5xl">{currentStepData.icon}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-green-400 mb-2">{currentStepData.title}</h3>
                <p className="text-green-300/80 text-sm font-mono mb-4">{currentStepData.description}</p>
              </div>
            </div>

            {/* Content with typewriter effect */}
            <div className="bg-black/50 border border-green-400/20 p-6 rounded font-mono text-sm text-green-300 whitespace-pre-wrap min-h-[200px]">
              {displayedText}
              {isPlaying && displayedText.length < currentStepData.content.length && (
                <span className="animate-pulse text-green-400">▊</span>
              )}
            </div>

            {/* Step Token Usage */}
            {currentStepData.tokenUsage && (
              <div className="mt-4 p-4 bg-cyan-400/10 border border-cyan-400/30 rounded">
                <div className="text-xs text-cyan-400/60 mb-2 font-mono font-bold">Step Token Usage:</div>
                <div className="grid grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-cyan-400/60">Input:</span>
                    <span className="text-cyan-400 ml-2">{currentStepData.tokenUsage.inputTokens.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-cyan-400/60">Output:</span>
                    <span className="text-cyan-400 ml-2">{currentStepData.tokenUsage.outputTokens.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-cyan-400/60">Total:</span>
                    <span className="text-cyan-400 ml-2">{currentStepData.tokenUsage.totalTokens.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-purple-400/60">Cost:</span>
                    <span className="text-purple-400 ml-2">${currentStepData.tokenUsage.estimatedCost.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cumulative Token Usage */}
          {cumulativeTokens.total > 0 && (
            <div className="bg-gradient-to-r from-purple-400/10 via-cyan-400/10 to-green-400/10 border-2 border-purple-400/50 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-bold mb-4 text-purple-400">Cumulative Token Usage</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-cyan-400/60 font-mono mb-1">Total Input Tokens</div>
                  <div className="text-3xl font-bold text-cyan-400">{cumulativeTokens.input.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-cyan-400/60 font-mono mb-1">Total Output Tokens</div>
                  <div className="text-3xl font-bold text-cyan-400">{cumulativeTokens.output.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-purple-400/60 font-mono mb-1">Total Tokens</div>
                  <div className="text-3xl font-bold text-purple-400">{cumulativeTokens.total.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-purple-400/60 font-mono mb-1">Total Cost</div>
                  <div className="text-3xl font-bold text-purple-400">${cumulativeTokens.cost.toFixed(4)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Step Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 border-2 border-green-400/50 text-green-400/70 hover:bg-green-400/10 hover:text-green-400 transition-all font-mono disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <div className="flex gap-2">
              {demoSteps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentStep
                      ? 'bg-green-400 w-8'
                      : idx < currentStep
                      ? 'bg-green-400/50'
                      : 'bg-green-400/20'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentStep(Math.min(demoSteps.length - 1, currentStep + 1))}
              disabled={currentStep === demoSteps.length - 1}
              className="px-6 py-3 border-2 border-green-400/50 text-green-400/70 hover:bg-green-400/10 hover:text-green-400 transition-all font-mono disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>

          {/* Call to Action */}
          {currentStep === demoSteps.length - 1 && !isPlaying && (
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-green-400/10 to-purple-400/10 border-2 border-green-400/50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-green-400">Ready to Create Your Own Agent?</h3>
                <p className="text-green-300/80 mb-6 max-w-2xl mx-auto">
                  This demo showed how G-SAC works. Now try it yourself with your own API key!
                </p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/create-agent"
                    className="px-8 py-4 border-2 border-purple-400 bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 transition-all font-mono font-bold"
                  >
                    Create Agent Now
                  </Link>
                  <Link
                    href="/docs"
                    className="px-8 py-4 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-all font-mono"
                  >
                    Read Documentation
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

