import { NextResponse } from "next/server"
import { 
  getRAGFolder, 
  deleteRAGFolder, 
  getRAGFiles,
  addRAGFile,
  isFileTypeSupported,
  MAX_FILE_SIZE 
} from "../../../../../backend/rag/storage"
import { chunkText } from "../../../../../backend/rag/chunker"
import { createEmbedding } from "../../../../../backend/rag/embedder"
import { extractTextFromBuffer } from "../../../../../backend/rag/chunker"
import { indexFolderChunks } from "../../../../../backend/rag/query"

/**
 * GET /api/rag/folders/[id] - Get folder details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const folder = getRAGFolder(id)
    
    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      )
    }

    const files = getRAGFiles(id)
    return NextResponse.json({ folder, files })
  } catch (error) {
    console.error("Error getting folder:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get folder" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/rag/folders/[id] - Delete folder
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = deleteRAGFolder(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting folder:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete folder" },
      { status: 500 }
    )
  }
}

