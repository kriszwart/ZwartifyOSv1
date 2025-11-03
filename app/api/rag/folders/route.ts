import { NextResponse } from "next/server"
import { 
  createRAGFolder, 
  listRAGFolders, 
  getRAGFolder,
  deleteRAGFolder 
} from "../../../../backend/rag/storage"

/**
 * GET /api/rag/folders - List all RAG folders
 */
export async function GET() {
  try {
    const folders = listRAGFolders()
    return NextResponse.json({ folders })
  } catch (error) {
    console.error("Error listing RAG folders:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list folders" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rag/folders - Create a new RAG folder
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, metadata } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const folder = createRAGFolder(name, metadata)
    return NextResponse.json({ folder }, { status: 201 })
  } catch (error) {
    console.error("Error creating RAG folder:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create folder" },
      { status: 500 }
    )
  }
}

