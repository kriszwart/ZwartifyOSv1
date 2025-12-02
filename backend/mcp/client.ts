/**
 * MCP Client
 * 
 * Handles communication with MCP (Model Context Protocol) servers
 * Supports HTTP POST requests with JSON-RPC style protocol
 */

import { mcpRegistry } from './registry'
import { getAgent } from '../agents/agentRegistry'

export interface MCPCallResult {
  success: boolean
  result?: unknown
  error?: string
  details?: Record<string, unknown>
}

/**
 * Resolve server URL from platform name or use provided URL
 * @param server - Platform name (e.g., "slack") or full URL
 * @param agentId - Optional agent ID to check agent's configured MCP servers
 * @returns Resolved server URL
 */
export async function resolveServerUrl(
  server: string,
  agentId?: string
): Promise<string> {
  // If it's already a URL (starts with http:// or https://), use it directly
  if (server.startsWith('http://') || server.startsWith('https://')) {
    return server
  }

  // Try to find server by platform name in registry
  const platformServer = mcpRegistry.getServerByPlatform(server.toLowerCase())
  if (platformServer) {
    return platformServer.serverUrl
  }

  // If agent ID is provided, check agent's configured MCP servers
  if (agentId) {
    const agent = getAgent(agentId)
    if (agent?.metadata?.mcpServers) {
      const mcpServers = agent.metadata.mcpServers as string[]
      
      // Try to find matching server by platform name
      for (const url of mcpServers) {
        const serverConfig = mcpRegistry.getServerByUrl(url)
        if (serverConfig?.platform.toLowerCase() === server.toLowerCase()) {
          return url
        }
      }
      
      // If no platform match, try fuzzy matching
      const fuzzyMatch = mcpRegistry.findServersByKeyword(server)
      if (fuzzyMatch.length > 0) {
        // Check if any fuzzy match is in agent's configured servers
        const matchingUrl = mcpServers.find(url => 
          fuzzyMatch.some(s => s.serverUrl === url)
        )
        if (matchingUrl) {
          return matchingUrl
        }
      }
      
      // If still no match and only one server configured, use it
      if (mcpServers.length === 1) {
        return mcpServers[0]
      }
    }
  }

  // If we still haven't found a match, throw error
  throw new Error(
    `MCP server not found: "${server}". ` +
    `Available platforms: ${Array.from(new Set(
      mcpRegistry.getAllServers().map(s => s.platform)
    )).join(', ') || 'none'}`
  )
}

/**
 * Call an MCP server with a method and arguments
 * @param url - MCP server URL
 * @param method - Method name to call
 * @param args - Method arguments
 * @param timeout - Request timeout in milliseconds (default: 30000)
 * @returns MCP call result
 */
export async function callMCPServer(
  url: string,
  method: string,
  args: Record<string, unknown> = {},
  timeout: number = 30000
): Promise<MCPCallResult> {
  try {
    // Validate URL
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return {
        success: false,
        error: `Invalid MCP server URL: ${url}`,
      }
    }

    // Prepare JSON-RPC style request
    const requestBody = {
      jsonrpc: '2.0',
      method,
      params: args,
      id: Date.now().toString(),
    }

    // Make HTTP POST request to MCP server
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check if response is OK
      if (!response.ok) {
        return {
          success: false,
          error: `MCP server returned error status: ${response.status} ${response.statusText}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            url,
          },
        }
      }

      // Parse JSON response
      const data = await response.json()

      // Handle JSON-RPC response format
      if (data.error) {
        return {
          success: false,
          error: data.error.message || String(data.error),
          details: {
            code: data.error.code,
            data: data.error.data,
          },
        }
      }

      // Return successful result
      return {
        success: true,
        result: data.result !== undefined ? data.result : data,
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return {
          success: false,
          error: `Request timeout after ${timeout}ms`,
          details: { url, method },
        }
      }
      
      throw fetchError
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: {
        url,
        method,
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
    }
  }
}

/**
 * Call MCP server by resolving server name/URL first
 * @param server - Platform name or server URL
 * @param method - Method to call
 * @param args - Method arguments
 * @param agentId - Optional agent ID for context
 * @returns MCP call result
 */
export async function callMCP(
  server: string,
  method: string,
  args: Record<string, unknown> = {},
  agentId?: string
): Promise<MCPCallResult> {
  try {
    // Resolve server URL
    const serverUrl = await resolveServerUrl(server, agentId)
    
    // Call the server
    return await callMCPServer(serverUrl, method, args)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: {
        server,
        method,
      },
    }
  }
}


