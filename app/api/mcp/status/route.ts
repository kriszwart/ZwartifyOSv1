/**
 * MCP Server Status API
 *
 * GET /api/mcp/status
 * Returns the status of all configured MCP servers
 */

import { NextResponse } from 'next/server'
import { mcpRegistry } from '@/backend/mcp/mcpRegistry'

export async function GET() {
  try {
    // Ensure registry is initialized
    if (!mcpRegistry.isInitialized()) {
      await mcpRegistry.initialize()
    }

    // Get all servers and their health status
    const servers = mcpRegistry.getAllServers()
    const healthStatus = mcpRegistry.getHealthStatus()

    // Combine server config with health status
    const serverStatus = servers.map(server => {
      const health = healthStatus.find(h => h.serverName === server.name)
      return {
        name: server.name,
        endpoint: server.endpoint,
        type: server.type,
        enabled: server.enabled,
        capabilities: server.capabilities || [],
        health: health
          ? {
              healthy: health.healthy,
              lastChecked: health.lastChecked,
              latency: health.latency,
              error: health.error,
            }
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      servers: serverStatus,
      summary: {
        total: servers.length,
        healthy: healthStatus.filter(h => h.healthy).length,
        unhealthy: healthStatus.filter(h => !h.healthy).length,
      },
    })
  } catch (error) {
    console.error('[MCP Status API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
