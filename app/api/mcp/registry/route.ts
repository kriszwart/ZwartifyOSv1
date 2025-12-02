import { NextResponse } from 'next/server'
import { mcpRegistry } from '@/backend/mcp/registry'

/**
 * GET /api/mcp/registry
 * Returns the current MCP registry status
 */
export async function GET() {
  try {
    const servers = mcpRegistry.getAllServers()
    
    return NextResponse.json({
      success: true,
      servers: servers.map(s => ({
        platform: s.platform,
        name: s.name,
        serverUrl: s.serverUrl,
        description: s.description,
        enabled: s.enabled,
      })),
      total: servers.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

