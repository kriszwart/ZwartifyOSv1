/**
 * MCP Client Tool
 *
 * Allows agents to interact with external platforms via Model Context Protocol (MCP)
 */

import { mcpClient } from '../mcp/mcpClient'
import { mcpRegistry } from '../mcp/mcpRegistry'

export const mcpClientTool = {
  name: "callMCP",
  description: "Call an MCP (Model Context Protocol) server to interact with external platforms like Slack, Discord, Twitter, etc. Provide the server name and method to call.",
  execute: async (params: {
    server: string
    method: string
    arguments?: Record<string, unknown>
  }) => {
    try {
      // Call the MCP server
      const result = await mcpClient.call(
        params.server,
        params.method,
        params.arguments
      )

      // If the call was successful, return the data
      if (result.success) {
        return {
          success: true,
          data: result.data,
          server: params.server,
          method: params.method,
          latency: result.metadata?.latency,
        }
      }

      // If the call failed, check if server needs to be configured
      const availableServers = mcpRegistry.getAllServers()
      const serverExists = mcpRegistry.getServer(params.server)

      if (!serverExists) {
        return {
          success: false,
          error: result.error,
          suggestion: `Server '${params.server}' is not configured. Set up environment variables:
MCP_${params.server.toUpperCase()}_ENDPOINT=<your-endpoint>
MCP_${params.server.toUpperCase()}_API_KEY=<your-api-key>`,
          availableServers: availableServers.map(s => s.name),
        }
      }

      return {
        success: false,
        error: result.error,
        server: params.server,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

