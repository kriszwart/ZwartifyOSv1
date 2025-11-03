import { NextResponse } from "next/server"
import { getAgentExecutions, getExecution } from "../../../../../backend/db/logger"

/**
 * GET /api/agents/[id]/executions - Get execution history for an agent
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | null

    let executions = getAgentExecutions(params.id, limit)

    if (status) {
      executions = executions.filter(ex => ex.status === status)
    }

    return NextResponse.json({ executions })
  } catch (error) {
    console.error("Error getting executions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get executions" },
      { status: 500 }
    )
  }
}

