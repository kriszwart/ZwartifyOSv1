/**
 * Agent Creation Tool
 * 
 * Allows agents (like G-SAC) to create new agents programmatically
 * 
 * Implements Anthropic's Tool Use Examples pattern for improved accuracy:
 * https://www.anthropic.com/engineering/advanced-tool-use
 */

import { createAgent } from '../agents/agentRegistry'
import { getCurrentAgentId, getCurrentUserPrompt } from './toolContext'
import { autoConfigureMCP } from '../mcp/platformDetector'

/**
 * Tool Use Examples - Following Anthropic's advanced tool use pattern
 * These examples teach Claude the correct patterns for agent creation,
 * improving accuracy from ~72% to ~90% in complex configurations.
 * 
 * Examples progress from minimal to full-featured to demonstrate:
 * - Required vs optional fields
 * - When to use memory, RAG, skills
 * - How to configure MCP servers
 * - The Ouroboros pattern (agents creating agents)
 */
export const agentCreationExamples = [
  {
    // Minimal agent - just the essentials
    description: "Create a simple Slack notification agent",
    input: {
      name: "slack-notifier",
      description: "Sends important notifications to Slack channels",
      prompt: "You are a Slack notification agent. When given a message and channel, send the notification. Keep messages concise and actionable."
    }
  },
  {
    // Agent with memory for context retention
    description: "Create a customer support agent that remembers conversations",
    input: {
      name: "support-agent",
      description: "Handles customer support queries with conversation memory",
      prompt: "You are a helpful customer support agent. Be empathetic, solution-focused, and remember previous context in conversations.",
      useMemory: true,
      metadata: {
        domain: "customer-support",
        escalationThreshold: 3
      }
    }
  },
  {
    // Agent with RAG for knowledge base access
    description: "Create a documentation assistant with knowledge base",
    input: {
      name: "docs-assistant",
      description: "Answers questions using product documentation",
      prompt: "You are a documentation assistant. Answer questions by referencing the knowledge base. Always cite your sources.",
      ragFolderId: "product-docs",
      useMemory: true
    }
  },
  {
    // Full-featured agent with all options
    description: "Create a growth advisor with full capabilities",
    input: {
      name: "growth-advisor",
      description: "Analyzes business metrics and suggests growth strategies using playbooks and multi-platform integration",
      prompt: "You are a growth advisor. Analyze data from multiple platforms, apply growth playbook strategies, and provide actionable insights. Track metrics over time.",
      useMemory: true,
      ragFolderId: "growth-playbooks",
      skillIds: ["business-goal-translator", "tool-integrator"],
      metadata: {
        mcpServers: ["slack", "notion"],
        domain: "growth-hacking",
        tier: "premium"
      }
    }
  },
  {
    // Meta-agent - The Ouroboros pattern
    description: "Create an agent factory that creates other agents",
    input: {
      name: "agent-factory",
      description: "Creates specialized agents based on user requirements. The Ouroboros pattern - agents creating agents.",
      prompt: "You are an agent factory. When given a business requirement, analyze the need and create an appropriate specialized agent. Consider what tools, skills, memory, and knowledge bases the new agent needs. You can create agents that themselves create agents.",
      skillIds: ["business-goal-translator", "tool-integrator", "platform-integrator"],
      metadata: {
        isMetaAgent: true,
        canCreateAgents: true
      }
    }
  }
]

export const agentCreationTool = {
  name: "createAgent",
  description: `Create a new agent with specified configuration. Use this to create specialized agents from natural language requirements. MCP servers are automatically configured based on platform requirements detected in the agent description and prompt.

EXAMPLES:
${agentCreationExamples.map(ex => `• ${ex.description}: ${JSON.stringify(ex.input, null, 0).substring(0, 100)}...`).join('\n')}

For the Ouroboros pattern (agents creating agents), include skillIds: ["business-goal-translator", "tool-integrator", "platform-integrator"].`,
  
  // Tool Use Examples for Claude to learn patterns
  input_examples: agentCreationExamples.map(ex => ex.input),
  
  execute: async (config: {
    name: string
    description?: string
    prompt: string
    version?: string
    enabled?: boolean
    metadata?: Record<string, unknown>
    ragFolderId?: string
    useMemory?: boolean
    skillIds?: string[]
  }) => {
    try {
      // Get context from tool context
      const createdByAgentId = getCurrentAgentId() || null
      const creationPrompt = getCurrentUserPrompt() || null

      // Auto-configure MCP servers if not explicitly provided
      let mcpServers: string[] = []
      if (config.metadata?.mcpServers && Array.isArray(config.metadata.mcpServers)) {
        // Use explicitly provided MCP servers
        mcpServers = config.metadata.mcpServers as string[]
      } else {
        // Auto-detect and configure MCP servers based on agent description/prompt
        const agentDescription = config.description || config.name
        mcpServers = autoConfigureMCP(agentDescription, config.prompt)
      }

      // Merge MCP servers into metadata
      const metadata = {
        ...config.metadata,
        mcpServers,
      }

      // Create the agent
      const agent = await createAgent({
        ...config,
        metadata,
        createdByAgentId,
        creationPrompt,
      })

      return {
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          version: agent.version,
          enabled: agent.enabled,
        },
        mcpServers: mcpServers.length > 0 ? mcpServers : undefined,
        message: `Agent "${agent.name}" created successfully with ID: ${agent.id}${mcpServers.length > 0 ? `. Auto-configured ${mcpServers.length} MCP server(s).` : ''}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

