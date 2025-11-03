import { NextResponse } from "next/server"
import { getExecution, getExecutionLogs } from "../../../../../../../backend/db/logger"

/**
 * GET /api/agents/[id]/executions/[executionId]/logs - Get detailed logs for an execution
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string; executionId: string } }
) {
  try {
    const execution = getExecution(params.executionId)
    
    if (!execution) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      )
    }

    // Verify execution belongs to agent
    if (execution.agentId !== params.id) {
      return NextResponse.json(
        { error: "Execution does not belong to this agent" },
        { status: 403 }
      )
    }

    const logs = getExecutionLogs(params.executionId)

    return NextResponse.json({
      execution,
      logs,
    })
  } catch (error) {
    console.error("Error getting execution logs:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get execution logs" },
      { status: 500 }
    )
  }
}

