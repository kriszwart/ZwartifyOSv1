import { NextResponse } from "next/server"
import { 
  createAgent, 
  getAgent, 
  listAgents, 
  updateAgent, 
  deleteAgent, 
  setAgentEnabled,
  AgentConfig,
  initializeDefaultAgents
} from "../../../backend/agents/agentRegistry"

/**
 * GET /api/agents - List all agents
 */
export async function GET(request: Request) {
  try {
    // Ensure agents are initialized (in case they weren't on module load)
    initializeDefaultAgents()
    
    const { searchParams } = new URL(request.url)
    const enabledOnly = searchParams.get('enabled') === 'true'
    
    const agents = listAgents(enabledOnly)
    return NextResponse.json({ agents })
  } catch (error) {
    console.error("Error listing agents:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list agents" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agents - Create a new agent
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, prompt, version, enabled, metadata, ragFolderId, useMemory, skillIds, createdByAgentId, creationPrompt } = body

    if (!name || !prompt) {
      return NextResponse.json(
        { error: "Name and prompt are required" },
        { status: 400 }
      )
    }

    const config: AgentConfig = {
      name,
      description,
      prompt,
      version,
      enabled,
      metadata,
      ragFolderId,
      useMemory,
      skillIds,
      createdByAgentId: createdByAgentId ?? null,
      creationPrompt: creationPrompt ?? null,
    }

    const agent = createAgent(config)
    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error("Error creating agent:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create agent" },
      { status: 500 }
    )
  }
}

