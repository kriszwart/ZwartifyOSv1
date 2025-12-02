import { NextResponse } from "next/server"
import { getTools } from "../../../backend/tools"

/**
 * GET /api/tools - List all available tools
 */
export async function GET() {
  try {
    const tools = await getTools()
    
    // Return only name and description for the visual builder
    const toolList = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
    }))
    
    return NextResponse.json({ tools: toolList })
  } catch (error) {
    console.error("Error listing tools:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list tools" },
      { status: 500 }
    )
  }
}

