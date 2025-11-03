import { NextResponse } from "next/server"
import { getAgent, updateAgent, deleteAgent, setAgentEnabled, AgentConfig, initializeDefaultAgents, listAgents } from "../../../../backend/agents/agentRegistry"
import { getAgentExecutions, getExecution } from "../../../../backend/db/logger"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Ensure agents are initialized (in case they weren't on module load)
    initializeDefaultAgents()
    
    const agent = getAgent(id)
    
    if (!agent) {
      // Try initializing again and retry
      initializeDefaultAgents()
      const retryAgent = getAgent(id)
      
      if (!retryAgent) {
        console.error(`Agent not found: ${id}`)
        console.error('Available agents:', listAgents().map(a => ({ id: a.id, name: a.name })))
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 404 }
        )
      }
      
      const response: any = { agent: retryAgent }
      const { searchParams } = new URL(request.url)
      const includeExecutions = searchParams.get('includeExecutions') === 'true'
      
      if (includeExecutions) {
        const executions = getAgentExecutions(id, 10)
        response.executions = executions
      }
      
      return NextResponse.json(response)
    }

    // Optionally include recent executions
    const { searchParams } = new URL(request.url)
    const includeExecutions = searchParams.get('includeExecutions') === 'true'
    
    const response: any = { agent }
    
    if (includeExecutions) {
      const executions = getAgentExecutions(id, 10)
      response.executions = executions
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error getting agent:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get agent" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, prompt, version, enabled, metadata } = body

    const updates: Partial<AgentConfig> = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (prompt !== undefined) updates.prompt = prompt
    if (version !== undefined) updates.version = version
    if (enabled !== undefined) updates.enabled = enabled
    if (metadata !== undefined) updates.metadata = metadata

    const agent = updateAgent(id, updates)
    
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error("Error updating agent:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update agent" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = deleteAgent(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting agent:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete agent" },
      { status: 500 }
    )
  }
}

