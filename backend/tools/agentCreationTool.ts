/**
 * Agent Creation Tool
 * 
 * Allows agents to create new agents programmatically.
 * Automatically sets the createdByAgentId based on the calling agent's ID.
 */

import { createAgent, AgentConfig } from '../agents/agentRegistry'
import { AgentConfigSchema } from '../agents/schema'
import { getCurrentAgentId, getOriginalPrompt } from './toolContext'
import { randomUUID } from 'crypto'

export interface CreateAgentInput {
  config: {
    name: string
    description?: string
    prompt: string
    version?: string
    enabled?: boolean
    metadata?: Record<string, unknown>
    ragFolderId?: string
    useMemory?: boolean
    skillIds?: string[]
    tools?: string[]
    mcpServers?: string[]
  }
}

export const agentCreationTool = {
  name: "createAgent",
  description: `Create a new agent with the specified configuration. 
  
Required fields:
- name: Unique name for the agent (e.g., "sales-assistant")
- prompt: System prompt for the agent

Optional fields:
- description: Human-readable description
- version: Version string (default: "1.0.0")
- enabled: Whether agent is enabled (default: true)
- metadata: Additional metadata object
- ragFolderId: ID of RAG folder to use
- useMemory: Whether to use conversation memory (default: true)
- skillIds: Array of skill IDs to assign
- tools: Array of tool names to enable
- mcpServers: Array of MCP server URLs

The agent will automatically track that it was created by the calling agent.`,
  execute: async (input: CreateAgentInput | { config: CreateAgentInput['config'] }) => {
    try {
      // Handle both direct config object and wrapped input
      const config = 'config' in input && input.config ? input.config : input as any
      
      // Validate input structure
      if (!config) {
        throw new Error('Invalid input: config object is required')
      }

      // Validate required fields
      if (!config.name || typeof config.name !== 'string') {
        throw new Error('Invalid input: name is required and must be a string')
      }

      if (!config.prompt || typeof config.prompt !== 'string') {
        throw new Error('Invalid input: prompt is required and must be a string')
      }

      // Get the calling agent's ID from context
      const createdByAgentId = getCurrentAgentId() || null
      
      // Get the original user prompt from context
      const originalPrompt = getOriginalPrompt() || null

      // Build agent config for registry
      const agentConfig: AgentConfig = {
        name: config.name,
        description: config.description,
        prompt: config.prompt,
        version: config.version || '1.0.0',
        enabled: config.enabled !== false, // Default to true
        metadata: {
          ...config.metadata,
          // Store tools and MCP servers in metadata
          tools: config.tools,
          mcpServers: config.mcpServers,
        },
        ragFolderId: config.ragFolderId,
        useMemory: config.useMemory !== false, // Default to true
        skillIds: config.skillIds || [],
        createdByAgentId,
        creationPrompt: originalPrompt,
      }

      // Create the agent
      const agent = createAgent(agentConfig)

      return {
        success: true,
        agentId: agent.id,
        name: agent.name,
        message: `Agent "${agent.name}" created successfully with ID: ${agent.id}`,
        createdByAgentId,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        error: errorMessage,
      }
    }
  },
}

