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
    await initializeDefaultAgents()
    
    const agent = await getAgent(id)
    
    if (!agent) {
      // Try initializing again and retry
      await initializeDefaultAgents()
      const retryAgent = await getAgent(id)
      
      if (!retryAgent) {
        console.error(`Agent not found: ${id}`)
        const allAgents = await listAgents()
        console.error('Available agents:', allAgents.map(a => ({ id: a.id, name: a.name })))
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
    const { 
      name, description, prompt, version, enabled, metadata, ragFolderId, useMemory, skillIds,
      isPublic, isExportable, exportFormats, category, tags
    } = body

    const updates: Partial<AgentConfig> = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (prompt !== undefined) updates.prompt = prompt
    if (version !== undefined) updates.version = version
    if (enabled !== undefined) updates.enabled = enabled
    if (metadata !== undefined) updates.metadata = metadata
    if (ragFolderId !== undefined) updates.ragFolderId = ragFolderId
    if (useMemory !== undefined) updates.useMemory = useMemory
    if (skillIds !== undefined) updates.skillIds = skillIds
    if (isPublic !== undefined) updates.isPublic = isPublic
    if (isExportable !== undefined) updates.isExportable = isExportable
    if (exportFormats !== undefined) updates.exportFormats = exportFormats
    if (category !== undefined) updates.category = category
    if (tags !== undefined) updates.tags = tags

    const agent = await updateAgent(id, updates)
    
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
    const deleted = await deleteAgent(id)
    
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

