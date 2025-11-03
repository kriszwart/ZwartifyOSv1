import { NextResponse } from "next/server"
import { 
  createSchedule,
  getSchedule,
  getAgentSchedules,
  listSchedules,
  updateSchedule,
  deleteSchedule,
  setScheduleEnabled 
} from "../../../backend/scheduler/manager"

/**
 * GET /api/schedules - List all schedules
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    
    let schedules
    if (agentId) {
      schedules = getAgentSchedules(agentId)
    } else {
      schedules = listSchedules()
    }
    
    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Error listing schedules:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list schedules" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/schedules - Create a new schedule
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { agentId, cronExpression, enabled, metadata } = body

    if (!agentId || !cronExpression) {
      return NextResponse.json(
        { error: "agentId and cronExpression are required" },
        { status: 400 }
      )
    }

    const schedule = createSchedule(agentId, cronExpression, enabled !== false, metadata)
    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create schedule" },
      { status: 500 }
    )
  }
}
