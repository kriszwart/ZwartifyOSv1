import React from "react"
import dynamic from "next/dynamic"

// Dynamically import components to avoid SSR issues
const SkillsComparison = dynamic(() => import("../components/SkillsComparison"), { ssr: false })
const PlatformOverview = dynamic(() => import("../components/PlatformOverview"), { ssr: false })
const VisualBuilderPreview = dynamic(() => import("../components/VisualBuilderPreview"), { ssr: false })
const OuroborosVisualization = dynamic(() => import("../components/OuroborosVisualization"), { ssr: false })
const ToolBrowser = dynamic(() => import("../../components/ToolBrowser"), { ssr: false })

// Full variant Ouroboros with real data
const OuroborosFull = () => <OuroborosVisualization variant="full" useRealData={true} />
const ToolBrowserCompact = () => <ToolBrowser compact={true} />

export type DemoAction = 
  | { type: "navigate", path: string }
  | { type: "createAgent", prompt: string; name?: string }
  | { type: "runQuery", agentName?: string; input: string }
  | { type: "loadVisualBuilder", agentId?: string }
  | { type: "wait", duration: number }
  | { type: "none" }

export interface EnhancedDemoStep {
  id: number
  title: string
  description: string
  icon: string
  content: string | React.ReactNode
  duration: number // seconds for auto-demo
  action?: DemoAction // Action to execute for this step
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCost: number
  }
  visualComponent?: React.ComponentType
  scriptTimestamp: string // e.g., "0:00-0:25"
}

export const enhancedDemoSteps: EnhancedDemoStep[] = [
  {
    id: 1,
    title: "What is ZwartifyOS?",
    description: "The operating system for AI agents",
    icon: "🔥",
    scriptTimestamp: "0:00-0:15",
    duration: 15,
    content: `ZwartifyOS: the open-source operating system for AI agents.

We're at a Promethean moment.

Multi-agents are yesterday's news.
The breakthrough is agents with skills.

Real tools. Real reasoning. Real execution.`,
  },
  {
    id: 2,
    title: "Agents Create Agents",
    description: "G-SAC: Natural language → fully configured agent",
    icon: "✨",
    scriptTimestamp: "0:15-0:30",
    duration: 15,
    content: `G-SAC: the Growth Strategy Agent Creator.

Describe what you need in plain English.
G-SAC creates a fully configured agent instantly.

With the right skills. Ready to execute.

Natural language → Fully functional agent.

This is the future: agents creating agents.`,
  },
  {
    id: 3,
    title: "Skills: The Difference",
    description: "Built-in capabilities, not just prompts",
    icon: "🎯",
    scriptTimestamp: "0:30-0:42",
    duration: 12,
    content: `What makes ZwartifyOS different? Skills.

7 built-in skills: PDF Processing, Data Analysis, Code Review,
Content Writing, Email Management, Research, API Integration.

Skills provide domain expertise and enable real execution.

Not just prompts. Actual capabilities that work.

This is AI-native SaaS.`,
    visualComponent: SkillsComparison,
  },
  {
    id: 4,
    title: "Dynamic Tool Discovery",
    description: "85% token savings with searchTools",
    icon: "🔍",
    scriptTimestamp: "0:42-0:52",
    duration: 10,
    content: `Advanced Tool Use patterns from Anthropic.

Instead of loading all tools upfront (50K+ tokens),
agents discover tools on-demand via searchTools.

85% reduction in token usage.
90% accuracy with Tool Use Examples.

This is how production AI systems scale.`,
    visualComponent: ToolBrowserCompact,
  },
  {
    id: 5,
    title: "Token Transparency",
    description: "See every token, every cost",
    icon: "💰",
    scriptTimestamp: "0:52-1:00",
    duration: 8,
    content: `Complete transparency.

Every token used. Every cost calculated.
Real-time tracking. No hidden fees.

You own your API keys. You control your costs.

Open source means open books.`,
  },
  {
    id: 6,
    title: "Visual Builder",
    description: "Test visually, deploy with code",
    icon: "🎨",
    scriptTimestamp: "1:00-1:10",
    duration: 10,
    content: `The Visual Builder is a testing tool.

See the architecture. See the skills. See the flow.

Then export the code and deploy.

Code-first. Visual-assisted.

The builder helps you test, not replace code.`,
    visualComponent: VisualBuilderPreview,
  },
  {
    id: 7,
    title: "Production Ready",
    description: "Everything you need, built-in",
    icon: "🛠️",
    scriptTimestamp: "1:10-1:18",
    duration: 8,
    content: `Production-ready out of the box.

RAG knowledge bases. Memory. Scheduling.
Token tracking. Cost monitoring.

The dashboard. The builder. The whole system.

One person can build the entire platform.

All open source. All yours.`,
    visualComponent: PlatformOverview,
  },
  {
    id: 8,
    title: "The Ouroboros Pattern",
    description: "Agents creating agents, infinitely recursive",
    icon: "🐍",
    scriptTimestamp: "1:18-1:28",
    duration: 10,
    content: `The Ouroboros pattern: agents creating agents.

With Tool Search, agents discover capabilities on-demand.
With Tool Examples, they achieve 90% accuracy.
With Deferred Loading, they save 85% tokens.

Each generation more capable than the last.
Infinite recursion. Self-improvement.

This is how AI systems evolve.`,
    visualComponent: OuroborosFull,
  },
  {
    id: 9,
    title: "Get Started",
    description: "Build your first agent",
    icon: "🚀",
    scriptTimestamp: "1:28-1:35",
    duration: 7,
    content: `Ready to build?

Start with the Visual Builder.
Create your first agent with G-SAC.
Or dive into the code.

Everything is open source. Everything is yours.

Let's build the future of AI-native SaaS.`,
  },
]

