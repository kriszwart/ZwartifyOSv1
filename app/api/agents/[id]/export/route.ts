import { NextRequest, NextResponse } from "next/server"
import { getAgent } from "../../../../../backend/agents/agentRegistry"
import { exportAgent, ExportFormat } from "../../../../../backend/export/agentExporter"
import { canExportAgent, getAvailableFormats } from "../../../../../backend/export/agentExporter"

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/[id]/export
 * 
 * Export an agent in the specified format
 * Query params: ?format=wordpress|widget|api|npm
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const formatParam = searchParams.get('format') as ExportFormat | null
    
    if (!formatParam) {
      return NextResponse.json(
        { error: 'Format parameter is required. Use ?format=wordpress|widget|api|npm' },
        { status: 400 }
      )
    }
    
    const validFormats: ExportFormat[] = ['wordpress', 'widget', 'api', 'npm']
    if (!validFormats.includes(formatParam)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      )
    }
    
    const agent = await getAgent(id)
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }
    
    // Check if agent can be exported
    if (!canExportAgent(agent)) {
      return NextResponse.json(
        { error: 'This agent is not exportable' },
        { status: 403 }
      )
    }
    
    // Check if format is available for this agent
    const availableFormats = getAvailableFormats(agent)
    if (!availableFormats.includes(formatParam)) {
      return NextResponse.json(
        { error: `Format "${formatParam}" is not available for this agent. Available formats: ${availableFormats.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Get base URL for API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   request.headers.get('origin') || 
                   'http://localhost:3000'
    
    // Export the agent
    const exportResult = await exportAgent(agent, formatParam, baseUrl)
    
    // Return appropriate response based on format
    if (formatParam === 'wordpress') {
      // For WordPress, we return JSON with file structure (ZIP creation can be done client-side)
      return NextResponse.json({
        format: exportResult.format,
        files: typeof exportResult.content === 'string' ? JSON.parse(exportResult.content) : exportResult.content,
        embedCode: exportResult.embedCode,
        installInstructions: exportResult.installInstructions,
        filename: exportResult.filename,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
        },
      })
    } else {
      // For other formats, return the content directly
      // Convert Buffer to a format compatible with NextResponse
      let content: BodyInit
      if (typeof exportResult.content === 'string') {
        content = exportResult.content
      } else {
        // Buffer is compatible with BodyInit, but TypeScript needs explicit handling
        // Convert Buffer to Uint8Array by copying the buffer
        const buffer = Buffer.isBuffer(exportResult.content) 
          ? exportResult.content 
          : Buffer.from(exportResult.content as ArrayBuffer)
        // Create a new Uint8Array without generic type parameter
        const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        content = uint8Array as BodyInit
      }
      return new NextResponse(content, {
        headers: {
          'Content-Type': exportResult.mimeType,
          'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
        },
      })
    }
  } catch (error) {
    console.error('Error exporting agent:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export agent' },
      { status: 500 }
    )
  }
}




