import { NextRequest, NextResponse } from "next/server"
import { listAgents } from "../../../../backend/agents/agentRegistry"

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/public
 * 
 * List public/exportable agents for marketplace
 * Query params:
 *   - category: Filter by category
 *   - search: Search in name/description
 *   - format: Filter by available export format
 *   - limit: Number of results (default: 50)
 *   - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const format = searchParams.get('format')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    // Get all agents
    const allAgents = await listAgents(false)
    
    // Filter for public/exportable agents
    let publicAgents = allAgents.filter(agent => {
      // Must be public or exportable
      if (!agent.isPublic && !agent.isExportable) {
        return false
      }
      
      // Filter by category if specified
      if (category && agent.category !== category) {
        return false
      }
      
      // Filter by export format if specified
      if (format) {
        const availableFormats = agent.exportFormats || ['wordpress', 'widget', 'api', 'npm']
        if (!availableFormats.includes(format)) {
          return false
        }
      }
      
      // Search in name/description if specified
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesName = agent.name.toLowerCase().includes(searchLower)
        const matchesDescription = agent.description?.toLowerCase().includes(searchLower) || false
        const matchesTags = agent.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false
        
        if (!matchesName && !matchesDescription && !matchesTags) {
          return false
        }
      }
      
      return true
    })
    
    // Sort by install count (descending), then by name
    publicAgents.sort((a, b) => {
      const aInstalls = a.installCount || 0
      const bInstalls = b.installCount || 0
      if (aInstalls !== bInstalls) {
        return bInstalls - aInstalls
      }
      return a.name.localeCompare(b.name)
    })
    
    // Paginate
    const total = publicAgents.length
    const paginatedAgents = publicAgents.slice(offset, offset + limit)
    
    // Return agent metadata (no sensitive data like prompts)
    const agentMetadata = paginatedAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      version: agent.version,
      category: agent.category,
      tags: agent.tags || [],
      exportFormats: agent.exportFormats || ['wordpress', 'widget', 'api', 'npm'],
      installCount: agent.installCount || 0,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      isPublic: agent.isPublic,
      isExportable: agent.isExportable,
    }))
    
    return NextResponse.json({
      agents: agentMetadata,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error listing public agents:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list public agents' },
      { status: 500 }
    )
  }
}



