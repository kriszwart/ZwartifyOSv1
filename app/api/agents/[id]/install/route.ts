import { NextRequest, NextResponse } from "next/server"
import { getAgent, updateAgent } from "../../../../../backend/agents/agentRegistry"

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/[id]/install
 * 
 * Track an installation of an agent
 * Body: { platform?: string, version?: string, metadata?: Record<string, unknown> }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { platform, version, metadata } = body
    
    const agent = await getAgent(id)
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }
    
    // Increment install count
    const currentInstallCount = agent.installCount || 0
    await updateAgent(id, {
      installCount: currentInstallCount + 1,
    })
    
    // Return installation status
    return NextResponse.json({
      success: true,
      agentId: id,
      agentName: agent.name,
      installCount: currentInstallCount + 1,
      platform,
      version,
      installedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error tracking installation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to track installation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agents/[id]/install
 * 
 * Get installation statistics for an agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agent = await getAgent(id)
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      agentId: id,
      agentName: agent.name,
      installCount: agent.installCount || 0,
      isPublic: agent.isPublic || false,
      isExportable: agent.isExportable !== false,
      exportFormats: agent.exportFormats || ['wordpress', 'widget', 'api', 'npm'],
    })
  } catch (error) {
    console.error('Error getting installation stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get installation stats' },
      { status: 500 }
    )
  }
}



