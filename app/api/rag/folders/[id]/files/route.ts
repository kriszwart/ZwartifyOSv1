import { NextResponse } from "next/server"
import { 
  getRAGFolder, 
  addRAGFile,
  getRAGFiles,
  isFileTypeSupported,
  MAX_FILE_SIZE,
  updateRAGFile,
  storeChunks,
  RAGChunk
} from "../../../../../../backend/rag/storage"
import { chunkText, extractTextFromBuffer } from "../../../../../../backend/rag/chunker"
import { createEmbedding } from "../../../../../../backend/rag/embedder"
import { indexFolderChunks, folderChunks } from "../../../../../../backend/rag/query"
import { randomUUID } from "crypto"

/**
 * GET /api/rag/folders/[id]/files - List files in folder
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const files = getRAGFiles(id)
    return NextResponse.json({ files })
  } catch (error) {
    console.error("Error listing files:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list files" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rag/folders/[id]/files - Upload file to folder
 */
export async function POST(
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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }

    // Check file type
    if (!isFileTypeSupported(file.name, file.type)) {
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 }
      )
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Add file to storage
    const ragFile = await addRAGFile(id, file.name, buffer, file.type)

    // Process file: extract text, chunk, and create embeddings
    try {
      const text = await extractTextFromBuffer(buffer, file.type, file.name)
      
      if (text) {
        const chunks = chunkText(text, { type: 'fixed-size', chunkSize: 1000, overlap: 200 })
        
        // Create embeddings for chunks
        const ragChunks: RAGChunk[] = []
        for (let i = 0; i < chunks.length; i++) {
          const embedding = await createEmbedding(chunks[i].content)
          ragChunks.push({
            id: randomUUID(),
            fileId: ragFile.id,
            chunkIndex: i,
            content: chunks[i].content,
            embedding,
            createdAt: new Date(),
          })
        }

        // Store chunks
        storeChunks(ragChunks)

        // Index chunks for the folder
        const existingChunks = folderChunks.get(id) || []
        indexFolderChunks(id, [...existingChunks, ...ragChunks])

        // Update file as processed
        updateRAGFile(ragFile.id, {
          processed: true,
          chunkCount: ragChunks.length,
        })
      }
    } catch (processError) {
      console.error('Error processing file:', processError)
      // File is still added, just not processed
    }

    return NextResponse.json({ file: ragFile }, { status: 201 })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    )
  }
}

