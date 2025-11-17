/**
 * MCP Client
 *
 * Handles communication with MCP servers via HTTP and SSE
 * Implements the Model Context Protocol for external platform integration
 */

import { mcpRegistry } from './mcpRegistry'
import type { MCPServerConfig } from '../config/mcpConfig'

export interface MCPRequest {
  method: string
  params?: Record<string, unknown>
}

export interface MCPResponse {
  success: boolean
  data?: unknown
  error?: string
  metadata?: {
    server: string
    latency: number
    timestamp: Date
  }
}

/**
 * MCP Client for HTTP communication
 */
class MCPClient {
  /**
   * Call an MCP server method
   */
  async call(
    serverName: string,
    method: string,
    params?: Record<string, unknown>
  ): Promise<MCPResponse> {
    const startTime = Date.now()

    // Ensure registry is initialized
    if (!mcpRegistry.isInitialized()) {
      await mcpRegistry.initialize()
    }

    // Get server configuration
    const server = mcpRegistry.getServer(serverName)
    if (!server) {
      return {
        success: false,
        error: `MCP server '${serverName}' not found. Available servers: ${mcpRegistry
          .getAllServers()
          .map(s => s.name)
          .join(', ') || 'none'}`,
        metadata: {
          server: serverName,
          latency: Date.now() - startTime,
          timestamp: new Date(),
        },
      }
    }

    // Check if server is enabled
    if (!server.enabled) {
      return {
        success: false,
        error: `MCP server '${serverName}' is disabled`,
        metadata: {
          server: serverName,
          latency: Date.now() - startTime,
          timestamp: new Date(),
        },
      }
    }

    // Check server health
    const health = mcpRegistry.getServerHealth(serverName)
    if (health && !health.healthy) {
      return {
        success: false,
        error: `MCP server '${serverName}' is unhealthy: ${health.error}`,
        metadata: {
          server: serverName,
          latency: Date.now() - startTime,
          timestamp: new Date(),
        },
      }
    }

    // Make the request based on server type
    try {
      if (server.type === 'http') {
        return await this.callHTTP(server, method, params, startTime)
      } else if (server.type === 'sse') {
        return await this.callSSE(server, method, params, startTime)
      } else {
        return {
          success: false,
          error: `Unsupported MCP server type: ${server.type}`,
          metadata: {
            server: serverName,
            latency: Date.now() - startTime,
            timestamp: new Date(),
          },
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          server: serverName,
          latency: Date.now() - startTime,
          timestamp: new Date(),
        },
      }
    }
  }

  /**
   * Call MCP server via HTTP
   */
  private async callHTTP(
    server: MCPServerConfig,
    method: string,
    params?: Record<string, unknown>,
    startTime?: number
  ): Promise<MCPResponse> {
    const start = startTime || Date.now()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (server.apiKey) {
      headers['Authorization'] = `Bearer ${server.apiKey}`
    }

    const requestBody: MCPRequest = {
      method,
      params,
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

    try {
      const response = await fetch(server.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const latency = Date.now() - start

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          metadata: {
            server: server.name,
            latency,
            timestamp: new Date(),
          },
        }
      }

      const data = await response.json()

      return {
        success: true,
        data,
        metadata: {
          server: server.name,
          latency,
          timestamp: new Date(),
        },
      }
    } catch (error) {
      clearTimeout(timeout)
      throw error
    }
  }

  /**
   * Call MCP server via Server-Sent Events (SSE)
   */
  private async callSSE(
    server: MCPServerConfig,
    method: string,
    params?: Record<string, unknown>,
    startTime?: number
  ): Promise<MCPResponse> {
    const start = startTime || Date.now()

    // SSE implementation for streaming responses
    // This is a simplified version - full implementation would use EventSource
    return {
      success: false,
      error: 'SSE support is not yet implemented. Use HTTP type servers for now.',
      metadata: {
        server: server.name,
        latency: Date.now() - start,
        timestamp: new Date(),
      },
    }
  }

  /**
   * List available methods on a server
   */
  async listMethods(serverName: string): Promise<MCPResponse> {
    return this.call(serverName, 'list_methods', {})
  }

  /**
   * Get server capabilities
   */
  async getCapabilities(serverName: string): Promise<MCPResponse> {
    const server = mcpRegistry.getServer(serverName)
    if (!server) {
      return {
        success: false,
        error: `Server ${serverName} not found`,
      }
    }

    return {
      success: true,
      data: {
        capabilities: server.capabilities || [],
        type: server.type,
        metadata: server.metadata,
      },
      metadata: {
        server: serverName,
        latency: 0,
        timestamp: new Date(),
      },
    }
  }
}

// Singleton instance
export const mcpClient = new MCPClient()
