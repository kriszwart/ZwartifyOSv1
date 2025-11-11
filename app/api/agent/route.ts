import { mainAgent } from "../../../backend/agents/mainAgent"
import { NextRequest, NextResponse } from "next/server"
import { extractTextFromBuffer } from "../../../backend/rag/chunker"
import { applyMiddleware, getRateLimitHeaders } from "../../../backend/middleware"
import { handleApiError, ErrorCategory } from "@/lib/logging/errorLogger"

export async function POST(request: NextRequest) {
  // Apply middleware (auth, rate limit, size check)
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) {
    return middlewareResponse
  }
  
  let body: { input?: string; agentId?: string; metadata?: Record<string, unknown>; image?: string }
  
  try {
    body = await request.json()
  } catch (parseError) {
    const errorResult = handleApiError(
      parseError,
      ErrorCategory.USER_ERROR,
      { operation: 'json_parse' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
  
  let { input, agentId, metadata, image } = body

  if (!input || typeof input !== "string") {
    const errorResult = handleApiError(
      new Error("Invalid input: 'input' must be a non-empty string"),
      ErrorCategory.USER_ERROR,
      { agentId, hasImage: !!image }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }

  // If a PDF is uploaded, extract text from it and include in the prompt
  if (image && image.includes('data:application/pdf')) {
    try {
      // Extract base64 data
      const base64Data = image.includes(',') ? image.split(',')[1] : image
      const buffer = Buffer.from(base64Data, 'base64')
      
      // Extract text from PDF
      const extractedText = await extractTextFromBuffer(buffer, 'application/pdf')
      
      if (extractedText && extractedText.trim().length > 0) {
        // Add extracted text to the input so the agent can actually work with it
        input = `${input}\n\n---\n\nPDF Content:\n${extractedText}`
        // Remove the image since we've extracted the text
        image = undefined
      } else {
        // If extraction fails, add guidance note
        input = `${input}\n\nNote: A PDF file was uploaded but text extraction returned empty. The PDF may be image-based, encrypted, or require specialised processing. Please provide guidance on how to handle this PDF.`
      }
    } catch (pdfError) {
      const errorResult = handleApiError(
        pdfError,
        ErrorCategory.SYSTEM_ERROR,
        { agentId, operation: 'pdf_extraction' }
      )
      // Continue with error note instead of failing
      input = `${input}\n\nNote: A PDF file was uploaded but could not be processed: ${errorResult.message}. Please provide guidance on PDF processing.`
    }
  }

  try {
    const result = await mainAgent(input, { agentId, metadata, image })
    
    // Add rate limit headers to response
    const response = NextResponse.json(result)
    const rateLimitHeaders = getRateLimitHeaders(request)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  } catch (err) {
    const errorResult = handleApiError(
      err,
      ErrorCategory.SYSTEM_ERROR,
      { 
        agentId,
        operation: 'agent_execution'
      }
    )
    
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}

