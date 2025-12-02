import { NextRequest } from "next/server"
import { extractTextFromBuffer } from "../../../../backend/rag/chunker"
import { applyMiddleware } from "../../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../../backend/utils/errorLogger"
import { agentClient, StreamingChunk } from "../../../../backend/agents/agentClient"
import { getAgent } from "../../../../backend/agents/agentRegistry"
import { getTools } from "../../../../backend/tools"

// Route segment configuration
export const dynamic = 'force-dynamic'

/**
 * POST /api/agent/stream - Execute an agent with streaming responses (SSE)
 * 
 * Returns Server-Sent Events stream with real-time agent responses
 */
export async function POST(request: NextRequest) {
  // Apply middleware (auth, rate limit, size check)
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) {
    return middlewareResponse
  }
  
  // Check for user-provided API key in header
  const userApiKey = request.headers.get('x-user-api-key')
  
  let body: { 
    input?: string
    agentId?: string
    metadata?: Record<string, unknown>
    image?: string
    imageUrl?: string
  }
  
  try {
    body = await request.json()
  } catch (parseError) {
    return new Response(
      JSON.stringify({ 
        type: 'error',
        error: 'Invalid JSON in request body' 
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
  
  let { input, agentId, metadata, image, imageUrl } = body
  
  // If imageUrl is provided, fetch and convert to base64
  if (imageUrl && !image) {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ZwartifyOS/1.0)',
        },
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/png'
        
        if (contentType.startsWith('image/')) {
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const base64 = buffer.toString('base64')
          image = `data:${contentType};base64,${base64}`
        }
      }
    } catch (urlError) {
      console.error('Error fetching image from URL:', urlError)
    }
  }

  if (!input || typeof input !== "string") {
    return new Response(
      JSON.stringify({ 
        type: 'error',
        error: "Invalid input: 'input' must be a non-empty string" 
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  // If a PDF is uploaded, extract text from it
  if (image && image.includes('data:application/pdf')) {
    try {
      const base64Data = image.includes(',') ? image.split(',')[1] : image
      const buffer = Buffer.from(base64Data, 'base64')
      const extractedText = await extractTextFromBuffer(buffer, 'application/pdf')
      
      if (extractedText && extractedText.trim().length > 0) {
        input = `${input}\n\n---\n\nPDF Content:\n${extractedText}`
        image = undefined
      } else {
        input = `${input}\n\nNote: A PDF file was uploaded but text extraction returned empty.`
      }
    } catch (pdfError) {
      input = `${input}\n\nNote: A PDF file was uploaded but could not be processed.`
    }
  }

  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: StreamingChunk | Record<string, unknown>) => {
        const json = JSON.stringify(data)
        controller.enqueue(encoder.encode(`data: ${json}\n\n`))
      }

      try {
        // Get agent configuration
        let agentPrompt: string | undefined
        let agentName = 'Main Agent'
        let ragFolderId: string | undefined
        let useMemory = true
        let skillIds: string[] | undefined

        if (agentId) {
          const agent = await getAgent(agentId)
          if (agent) {
            agentPrompt = agent.prompt
            agentName = agent.name
            ragFolderId = agent.ragFolderId
            useMemory = agent.useMemory !== false
            skillIds = agent.skillIds
          }
        }

        // Get tools
        const tools = await getTools()

        // Start streaming (context building happens inside runStreaming)
        const streamingGenerator = agentClient.runStreaming(input, {
          agentId: agentId || 'main',
          agentName,
          agentPrompt,
          tools,
          metadata,
          image: image && !image.includes('data:application/pdf') ? image : undefined,
          userApiKey: userApiKey || undefined,
          ragFolderId,
          useMemory,
          skillIds,
          autoDetectSkills: true,
        })

        // Stream chunks
        for await (const chunk of streamingGenerator) {
          sendEvent(chunk)
        }

        // Completion event is sent by runStreaming

        controller.close()
      } catch (error) {
        const errorResult = handleApiError(
          error,
          ErrorCategory.SYSTEM_ERROR,
          { 
            agentId,
            operation: 'streaming_agent_execution'
          }
        )
        
        sendEvent({
          type: 'error',
          error: errorResult.message,
        })
        
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

