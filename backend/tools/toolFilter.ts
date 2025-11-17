/**
 * Tool Filtering
 *
 * Filters tools based on agent configuration
 * Ensures agents only get the tools they need
 */

import type { ToolDefinition } from './index'
import { mcpRegistry } from '../mcp/mcpRegistry'

export interface ToolFilterOptions {
  enabledTools?: string[]
  mcpServers?: string[]
  autoDetectMCP?: boolean
  userInput?: string
}

/**
 * Filter tools based on agent configuration
 *
 * @param allTools - All available tools
 * @param options - Filtering options
 * @returns Filtered tool array
 */
export async function filterTools(
  allTools: ToolDefinition[],
  options?: ToolFilterOptions
): Promise<ToolDefinition[]> {
  // If no filter options provided, return all tools (backward compatibility)
  if (!options) {
    return allTools
  }

  const { enabledTools, mcpServers, autoDetectMCP, userInput } = options

  // If enabledTools is explicitly set, filter by it
  if (enabledTools && enabledTools.length > 0) {
    const toolSet = new Set(enabledTools)
    const filtered = allTools.filter(tool => toolSet.has(tool.name))

    console.log(
      `[Tool Filter] Filtered ${allTools.length} tools to ${filtered.length} enabled tools`
    )

    return filtered
  }

  // If mcpServers is specified, ensure MCP client is available
  if (mcpServers && mcpServers.length > 0) {
    console.log(`[Tool Filter] Agent configured with ${mcpServers.length} MCP server(s)`)

    // Ensure registry is initialized
    if (!mcpRegistry.isInitialized()) {
      await mcpRegistry.initialize()
    }

    // Register any missing servers from config
    for (const serverName of mcpServers) {
      const existing = mcpRegistry.getServer(serverName)
      if (!existing) {
        console.log(
          `[Tool Filter] Server ${serverName} not in registry. Needs environment configuration.`
        )
      }
    }
  }

  // Auto-detect MCP servers from user input
  if (autoDetectMCP && userInput) {
    const detectedServers = await mcpRegistry.autoConfigureServers(userInput)
    if (detectedServers.length > 0) {
      console.log(
        `[Tool Filter] Auto-detected ${detectedServers.length} potential MCP server(s): ${detectedServers.join(', ')}`
      )
    }
  }

  // Return all tools if no specific filtering applied
  return allTools
}

/**
 * Check if a tool should be enabled for an agent
 */
export function isToolEnabled(
  toolName: string,
  enabledTools?: string[]
): boolean {
  // If no enabled tools list, all tools are enabled
  if (!enabledTools || enabledTools.length === 0) {
    return true
  }

  return enabledTools.includes(toolName)
}

/**
 * Get tool names from tool definitions
 */
export function getToolNames(tools: ToolDefinition[]): string[] {
  return tools.map(tool => tool.name)
}
