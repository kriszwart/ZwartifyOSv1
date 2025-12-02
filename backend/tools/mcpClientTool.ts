/**
 * MCP Client Tool
 * 
 * Allows agents to interact with external platforms via Model Context Protocol (MCP)
 */

import { callMCP } from '../mcp/client'
import { getCurrentAgentId } from './toolContext'

export const mcpClientTool = {
  name: "callMCP",
  description: "Call an MCP (Model Context Protocol) server to interact with external platforms like Slack, Discord, Twitter, etc. Provide the server name (platform name like 'slack' or full URL) and method to call.",
  execute: async (params: {
    server: string
    method: string
    arguments?: Record<string, unknown>
  }) => {
    try {
      // Validate required parameters
      if (!params.server || !params.method) {
        return {
          success: false,
          error: "Missing required parameters: 'server' and 'method' are required",
        }
      }

      // Get current agent ID from tool context
      const agentId = getCurrentAgentId()

      // Call MCP server
      const result = await callMCP(
        params.server,
        params.method,
        params.arguments || {},
        agentId
      )

      // Return structured response
      if (result.success) {
        return {
          success: true,
          result: result.result,
          server: params.server,
          method: params.method,
        }
      } else {
        return {
          success: false,
          error: result.error || 'Unknown error occurred',
          details: result.details,
          server: params.server,
          method: params.method,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        server: params.server,
        method: params.method,
      }
    }
  },
}

