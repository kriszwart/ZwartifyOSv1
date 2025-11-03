import { NextResponse } from "next/server"
import {
  getSkill,
  updateSkill,
  deleteSkill,
  setSkillEnabled,
} from "../../../../backend/skills/store"

/**
 * GET /api/skills/[id] - Get skill details
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const skill = getSkill(params.id)
    
    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ skill })
  } catch (error) {
    console.error("Error getting skill:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get skill" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/skills/[id] - Update skill
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const skill = updateSkill(params.id, body)
    
    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ skill })
  } catch (error) {
    console.error("Error updating skill:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update skill" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/skills/[id] - Delete skill
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = deleteSkill(params.id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting skill:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete skill" },
      { status: 500 }
    )
  }
}

