import { NextResponse } from "next/server"
import { getAgentByName, initializeDefaultAgents } from "../../../backend/agents/agentRegistry"

/**
 * GET /api/agents/by-name/[name] - Get agent by name
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    initializeDefaultAgents()
    
    const agent = getAgentByName(name)
    
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error("Error getting agent by name:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get agent" },
      { status: 500 }
    )
  }
}

