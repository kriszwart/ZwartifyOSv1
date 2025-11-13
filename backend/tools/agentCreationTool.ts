/**
 * Agent Creation Tool
 * 
 * Allows agents (like G-SAC) to create new agents programmatically
 */

import { createAgent } from '../agents/agentRegistry'
import { getCurrentAgentId, getCurrentUserPrompt } from './toolContext'

export const agentCreationTool = {
  name: "createAgent",
  description: "Create a new agent with specified configuration. Use this to create specialized agents from natural language requirements.",
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

      // Create the agent
      const agent = createAgent({
        ...config,
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
        message: `Agent "${agent.name}" created successfully with ID: ${agent.id}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

