/**
 * Tool Search Tool
 * 
 * Implements Anthropic's Tool Search Tool pattern for dynamic tool discovery:
 * https://www.anthropic.com/engineering/advanced-tool-use
 * 
 * Instead of loading all tool definitions upfront (which can consume 50K+ tokens),
 * this tool allows Claude to dynamically discover tools on-demand.
 * 
 * Benefits:
 * - 85% reduction in token usage
 * - Better tool selection accuracy (49% → 74% on Opus 4)
 * - Scales to hundreds of tools without context bloat
 * 
 * The Ouroboros Connection:
 * When meta-agents create other agents, they don't need all 50+ tools loaded.
 * They can dynamically discover just the createAgent tool and MCP tools needed.
 */

import { getTools } from './index'

export interface ToolSearchResult {
  name: string
  description: string
  category?: string
  relevanceScore?: number
}

export interface ToolSearchResponse {
  success: boolean
  tools: ToolSearchResult[]
  query: string
  totalAvailable: number
  message: string
}

/**
 * Calculate relevance score for a tool based on query
 */
function calculateRelevance(query: string, toolName: string, toolDescription: string): number {
  const lowerQuery = query.toLowerCase()
  const lowerName = toolName.toLowerCase()
  const lowerDesc = toolDescription.toLowerCase()
  
  let score = 0
  
  // Exact name match
  if (lowerName === lowerQuery) {
    score += 100
  }
  // Name contains query
  else if (lowerName.includes(lowerQuery)) {
    score += 50
  }
  // Query contains name
  else if (lowerQuery.includes(lowerName)) {
    score += 40
  }
  
  // Description contains query words
  const queryWords = lowerQuery.split(/\s+/)
  for (const word of queryWords) {
    if (word.length < 3) continue // Skip short words
    
    if (lowerName.includes(word)) {
      score += 20
    }
    if (lowerDesc.includes(word)) {
      score += 10
    }
  }
  
  // Bonus for keyword matches
  const keywords: Record<string, string[]> = {
    'agent': ['createAgent', 'agent'],
    'create': ['createAgent', 'create'],
    'mcp': ['callMCP', 'mcp', 'platform'],
    'slack': ['callMCP', 'slack'],
    'discord': ['callMCP', 'discord'],
    'platform': ['callMCP', 'mcp'],
    'markdown': ['markdownFormatter', 'format'],
    'screenshot': ['screenshotDescription', 'image'],
    'image': ['screenshotDescription', 'vision'],
    'hello': ['helloTool', 'test'],
  }
  
  for (const [keyword, matches] of Object.entries(keywords)) {
    if (lowerQuery.includes(keyword)) {
      if (matches.some(m => lowerName.includes(m.toLowerCase()) || lowerDesc.includes(m.toLowerCase()))) {
        score += 15
      }
    }
  }
  
  return score
}

/**
 * Categorize a tool based on its name and description
 */
function categorize(toolName: string, toolDescription: string): string {
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
  if (lower.includes('hello') || lower.includes('test')) {
    return 'utility'
  }
  
  return 'general'
}

export const toolSearchTool = {
  name: "searchTools",
  description: `Search for available tools by capability or keyword. Use this to discover what tools are available before using them.

This enables dynamic tool discovery - instead of having all tools loaded upfront, you can search for exactly what you need.

Examples:
• searchTools({ query: "create agent" }) - Find tools for creating agents
• searchTools({ query: "slack" }) - Find tools for Slack integration
• searchTools({ query: "mcp platform" }) - Find MCP/platform tools
• searchTools({ query: "format markdown" }) - Find formatting tools

For the Ouroboros pattern, search for "agent" to find the createAgent tool.`,

  execute: async (params: {
    query: string
    limit?: number
    category?: string
  }): Promise<ToolSearchResponse> => {
    try {
      // Validate required parameters
      if (!params.query || params.query.trim().length === 0) {
        return {
          success: false,
          tools: [],
          query: params.query || '',
          totalAvailable: 0,
          message: "Please provide a search query to find relevant tools"
        }
      }

      const query = params.query.trim()
      const limit = params.limit || 5

      // Get all available tools
      const allTools = await getTools()
      
      // Calculate relevance scores and filter
      const scoredTools = allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        category: categorize(tool.name, tool.description),
        relevanceScore: calculateRelevance(query, tool.name, tool.description)
      }))
      
      // Filter tools with any relevance
      let relevantTools = scoredTools.filter(t => t.relevanceScore > 0)
      
      // If no matches, return all tools with a helpful message
      if (relevantTools.length === 0) {
        relevantTools = scoredTools.slice(0, limit)
        return {
          success: true,
          tools: relevantTools,
          query,
          totalAvailable: allTools.length,
          message: `No exact matches for "${query}". Showing ${relevantTools.length} available tools. Try broader search terms.`
        }
      }
      
      // Filter by category if specified
      if (params.category) {
        relevantTools = relevantTools.filter(t => t.category === params.category)
      }
      
      // Sort by relevance and limit
      relevantTools.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      relevantTools = relevantTools.slice(0, limit)
      
      return {
        success: true,
        tools: relevantTools,
        query,
        totalAvailable: allTools.length,
        message: `Found ${relevantTools.length} tool(s) matching "${query}" out of ${allTools.length} available`
      }
    } catch (error) {
      return {
        success: false,
        tools: [],
        query: params.query || '',
        totalAvailable: 0,
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

/**
 * Get tool categories for filtering
 */
export function getToolCategories(): string[] {
  return [
    'agent-management',
    'platform-integration',
    'formatting',
    'vision',
    'utility',
    'general'
  ]
}

/**
 * Check if a tool should be deferred (not loaded upfront)
 * In production, most tools should be deferred to save context tokens
 */
export function shouldDeferTool(toolName: string): boolean {
  // Always load these core tools
  const alwaysLoadedTools = ['searchTools']
  
  return !alwaysLoadedTools.includes(toolName)
}




