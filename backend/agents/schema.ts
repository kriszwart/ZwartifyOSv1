/**
 * Agent Configuration Schema
 * 
 * Defines the YAML/JSON format for agent definitions, similar to Toolhouse's `th` files
 */

import { z } from 'zod'

/**
 * Agent configuration schema (Zod validation)
 */
export const AgentConfigSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  prompt: z.string(),
  public: z.boolean().default(false),
  enabled: z.boolean().default(true),
  version: z.string().default('1.0.0'),
  description: z.string().optional(),
  tools: z.array(z.string()).optional(), // Tool names to enable
  rag: z.string().optional(), // RAG folder name
  mcpServers: z.array(z.string()).optional(), // MCP server URLs
  metadata: z.record(z.unknown()).optional(),
  createdByAgentId: z.string().nullable().optional(), // ID of agent that created this agent
  creationPrompt: z.string().nullable().optional(), // Original prompt used to create this agent
})

export type AgentConfigFile = z.infer<typeof AgentConfigSchema>

/**
 * Example agent configuration (YAML format)
 */
export const EXAMPLE_AGENT_CONFIG = `id: 69ba3e7e-xxxx-xxxx-xxxx-dc8cb0f86c7b
title: HR Employee Handbook Assistant
description: Answers questions about company policies using internal knowledge

prompt: |
  You are an HR assistant. Your job is to answer questions about company policies 
  using the internal knowledge base. Be helpful, accurate, and professional.
  
  When answering questions:
  1. First, search the knowledge base for relevant information
  2. Provide clear, accurate answers based on the found information
  3. If information is not found, let the user know
  4. Always cite which document you used for your answer

public: false
enabled: true
version: 1.0.0
rag: employee_policy_documents
tools:
  - markdownFormatter
  - screenshotDescription
metadata:
  department: HR
  category: internal
`

/**
 * Parse agent configuration from YAML string
 */
export function parseAgentConfigYAML(yamlString: string): AgentConfigFile {
  // For now, we'll use a simple JSON approach
  // In production, use a YAML parser like `js-yaml`
  try {
    // Try parsing as JSON first (simpler for templates)
    const json = JSON.parse(yamlString)
    return AgentConfigSchema.parse(json)
  } catch {
    // If not JSON, assume it's a simplified format
    // TODO: Implement proper YAML parsing
    throw new Error('YAML parsing not yet implemented. Use JSON format for now.')
  }
}

/**
 * Parse agent configuration from JSON string
 */
export function parseAgentConfigJSON(jsonString: string): AgentConfigFile {
  const json = JSON.parse(jsonString)
  return AgentConfigSchema.parse(json)
}

/**
 * Serialize agent configuration to JSON
 */
export function serializeAgentConfig(config: AgentConfigFile): string {
  return JSON.stringify(config, null, 2)
}

/**
 * Convert agent config file to registry format
 */
export function configToRegistryFormat(config: AgentConfigFile) {
  return {
    name: config.title.toLowerCase().replace(/\s+/g, '-'),
    description: config.description || config.title,
    prompt: config.prompt,
    version: config.version,
    enabled: config.enabled,
    metadata: {
      ...config.metadata,
      public: config.public,
      tools: config.tools,
      rag: config.rag,
      mcpServers: config.mcpServers,
    },
  }
}

