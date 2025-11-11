import { NextResponse } from "next/server"
import { 
  getSchedule, 
  updateSchedule, 
  deleteSchedule, 
  setScheduleEnabled 
} from "../../../../backend/scheduler/manager"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const schedule = getSchedule(id)
    
    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error getting schedule:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get schedule" },
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
    const { cronExpression, enabled, metadata } = body

    const updates: any = {}
    if (cronExpression !== undefined) updates.cronExpression = cronExpression
    if (enabled !== undefined) updates.enabled = enabled
    if (metadata !== undefined) updates.metadata = metadata

    const schedule = updateSchedule(id, updates)
    
    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error updating schedule:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update schedule" },
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
    const deleted = deleteSchedule(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting schedule:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete schedule" },
      { status: 500 }
    )
  }
}

