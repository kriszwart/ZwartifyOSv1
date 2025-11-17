/**
 * MCP Server Auto-Detection API
 *
 * POST /api/mcp/auto-detect
 * Auto-detects which MCP servers are needed based on user input
 */

import { NextResponse } from 'next/server'
import { mcpRegistry } from '@/backend/mcp/mcpRegistry'
import { detectRequiredServers, suggestServerConfig, generateEnvTemplate } from '@/backend/config/mcpConfig'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { input } = body

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Input is required',
        },
        { status: 400 }
      )
    }

    // Ensure registry is initialized
    if (!mcpRegistry.isInitialized()) {
      await mcpRegistry.initialize()
    }

    // Detect required servers
    const detectedServers = detectRequiredServers(input)

    // Check which servers are already configured
    const serversStatus = detectedServers.map(serverName => {
      const server = mcpRegistry.getServer(serverName)
      const health = mcpRegistry.getServerHealth(serverName)
      const suggestedConfig = suggestServerConfig(serverName)

      return {
        name: serverName,
        configured: !!server,
        healthy: health?.healthy || false,
        suggestion: suggestedConfig,
        envTemplate: server ? undefined : generateEnvTemplate(serverName),
      }
    })

    return NextResponse.json({
      success: true,
      input,
      detectedServers: serversStatus,
      summary: {
        total: detectedServers.length,
        configured: serversStatus.filter(s => s.configured).length,
        needsConfiguration: serversStatus.filter(s => !s.configured).length,
      },
    })
  } catch (error) {
    console.error('[MCP Auto-Detect API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
