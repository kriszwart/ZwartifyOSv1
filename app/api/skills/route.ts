import { NextResponse } from "next/server"
import {
  createSkill,
  getSkill,
  listSkills,
  searchSkills,
  getSkillsByTags,
  updateSkill,
  deleteSkill,
  setSkillEnabled,
  Skill,
} from "../../../backend/skills/store"

/**
 * GET /api/skills - List all skills
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const enabledOnly = searchParams.get('enabled') === 'true'
    const query = searchParams.get('query')
    const tags = searchParams.get('tags')?.split(',')
    
    let skills: Skill[]
    
    if (tags && tags.length > 0) {
      skills = getSkillsByTags(tags)
    } else if (query) {
      skills = searchSkills(query, enabledOnly)
    } else {
      skills = listSkills(enabledOnly)
    }
    
    return NextResponse.json({ skills })
  } catch (error) {
    console.error("Error listing skills:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list skills" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/skills - Create a new skill
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, instructions, examples, tags, version, enabled, metadata, resourceFolderId } = body

    if (!name || !description || !instructions) {
      return NextResponse.json(
        { error: "Name, description, and instructions are required" },
        { status: 400 }
      )
    }

    const skill = createSkill(name, description, instructions, {
      examples,
      tags,
      version,
      enabled,
      metadata,
      resourceFolderId,
    })

    return NextResponse.json({ skill }, { status: 201 })
  } catch (error) {
    console.error("Error creating skill:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create skill" },
      { status: 500 }
    )
  }
}

