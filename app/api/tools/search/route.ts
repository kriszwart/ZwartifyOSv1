/**
 * Tool Search API
 * 
 * Exposes the toolSearchTool functionality to the frontend
 * for the Tool Browser UI component.
 */

import { NextRequest, NextResponse } from 'next/server'
import { toolSearchTool, getToolCategories } from '@/backend/tools/toolSearchTool'
import { getTools } from '@/backend/tools'

export interface ToolSearchAPIResponse {
  success: boolean
  tools: Array<{
    name: string
    description: string
    category?: string
    relevanceScore?: number
  }>
  query: string
  totalAvailable: number
  categories: string[]
  message: string
}

/**
 * GET /api/tools/search?q=query&category=category&limit=5
 * Search for tools by query string
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || undefined
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // If no query, return all tools
    if (!query.trim()) {
      const allTools = await getTools()
      const categories = getToolCategories()
      
      return NextResponse.json({
        success: true,
        tools: allTools.map(t => ({
          name: t.name,
          description: t.description,
          category: categorizeToolSimple(t.name, t.description),
          relevanceScore: 100,
        })),
        query: '',
        totalAvailable: allTools.length,
        categories,
        message: `Showing all ${allTools.length} available tools`,
      } satisfies ToolSearchAPIResponse)
    }

    // Use the toolSearchTool to search
    const result = await toolSearchTool.execute({
      query,
      limit,
      category,
    })

    const categories = getToolCategories()

    return NextResponse.json({
      ...result,
      categories,
    } satisfies ToolSearchAPIResponse)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        tools: [],
        query: '',
        totalAvailable: 0,
        categories: [],
        message: error instanceof Error ? error.message : 'Failed to search tools',
      } satisfies ToolSearchAPIResponse,
      { status: 500 }
    )
  }
}

/**
 * Simple categorization helper for when query is empty
 */
function categorizeToolSimple(toolName: string, toolDescription: string): string {
  const lower = (toolName + ' ' + toolDescription).toLowerCase()
  
  if (lower.includes('agent') || lower.includes('create')) {
    return 'agent-management'
  }
  if (lower.includes('mcp') || lower.includes('platform') || lower.includes('slack') || lower.includes('discord')) {
    return 'platform-integration'
  }
  if (lower.includes('markdown') || lower.includes('format')) {
    return 'formatting'
  }
  if (lower.includes('screenshot') || lower.includes('image') || lower.includes('vision')) {
    return 'vision'
  }
  if (lower.includes('search') || lower.includes('discover')) {
    return 'discovery'
  }
  if (lower.includes('hello') || lower.includes('test')) {
    return 'utility'
  }
  
  return 'general'
}




