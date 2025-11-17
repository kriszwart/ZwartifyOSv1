/**
 * MCP Server Health Check API
 *
 * POST /api/mcp/health-check
 * Triggers a health check for all MCP servers or a specific server
 */

import { NextResponse } from 'next/server'
import { mcpRegistry } from '@/backend/mcp/mcpRegistry'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { serverName } = body

    // Ensure registry is initialized
    if (!mcpRegistry.isInitialized()) {
      await mcpRegistry.initialize()
    }

    // Check specific server or all servers
    if (serverName) {
      const health = await mcpRegistry.checkServerHealth(serverName)
      return NextResponse.json({
        success: true,
        server: serverName,
        health,
      })
    } else {
      await mcpRegistry.checkAllServersHealth()
      const healthStatus = mcpRegistry.getHealthStatus()

      return NextResponse.json({
        success: true,
        healthStatus,
        summary: {
          total: healthStatus.length,
          healthy: healthStatus.filter(h => h.healthy).length,
          unhealthy: healthStatus.filter(h => !h.healthy).length,
        },
      })
    }
  } catch (error) {
    console.error('[MCP Health Check API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
