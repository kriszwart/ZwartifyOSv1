"use client"

import { useState, useEffect, useCallback } from "react"

interface Tool {
  name: string
  description: string
  category?: string
  relevanceScore?: number
}

interface ToolBrowserProps {
  onToolSelect?: (tool: Tool) => void
  showCopyButton?: boolean
  compact?: boolean
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🔧' },
  { id: 'discovery', label: 'Discovery', icon: '🔍' },
  { id: 'agent-management', label: 'Agents', icon: '🤖' },
  { id: 'platform-integration', label: 'Platforms', icon: '🌐' },
  { id: 'formatting', label: 'Formatting', icon: '📝' },
  { id: 'vision', label: 'Vision', icon: '👁️' },
  { id: 'utility', label: 'Utility', icon: '⚙️' },
]

export default function ToolBrowser({ 
  onToolSelect, 
  showCopyButton = true,
  compact = false 
}: ToolBrowserProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedTool, setCopiedTool] = useState<string | null>(null)
  const [totalAvailable, setTotalAvailable] = useState(0)

  // Fetch tools
  const fetchTools = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (category !== 'all') params.set('category', category)
      params.set('limit', '20')

      const response = await fetch(`/api/tools/search?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        // Filter by category on client side if needed
        let filteredTools = data.tools
        if (category !== 'all' && !query) {
          filteredTools = data.tools.filter((t: Tool) => t.category === category)
        }
        setTools(filteredTools)
        setTotalAvailable(data.totalAvailable)
      } else {
        setError(data.message || 'Failed to fetch tools')
        setTools([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tools')
      setTools([])
    } finally {
      setLoading(false)
    }
  }, [query, category])

  // Fetch on mount and when query/category changes
  useEffect(() => {
    const debounce = setTimeout(fetchTools, 300)
    return () => clearTimeout(debounce)
  }, [fetchTools])

  // Copy tool name to clipboard
  const copyToolName = async (toolName: string) => {
    try {
      await navigator.clipboard.writeText(toolName)
      setCopiedTool(toolName)
      setTimeout(() => setCopiedTool(null), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = toolName
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedTool(toolName)
      setTimeout(() => setCopiedTool(null), 2000)
    }
  }

  // Get category color
  const getCategoryColor = (cat?: string): string => {
    const colors: Record<string, string> = {
      'discovery': 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300',
      'agent-management': 'border-purple-400/50 bg-purple-400/10 text-purple-300',
      'platform-integration': 'border-blue-400/50 bg-blue-400/10 text-blue-300',
      'formatting': 'border-yellow-400/50 bg-yellow-400/10 text-yellow-300',
      'vision': 'border-pink-400/50 bg-pink-400/10 text-pink-300',
      'utility': 'border-gray-400/50 bg-gray-400/10 text-gray-300',
      'general': 'border-green-400/50 bg-green-400/10 text-green-300',
    }
    return colors[cat || 'general'] || colors.general
  }

  if (compact) {
    return (
      <div className="bg-black/40 border border-green-400/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🔧</span>
          <h3 className="font-bold text-green-400">Tool Browser</h3>
          <span className="text-xs text-green-300/50">({totalAvailable} tools)</span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full bg-black/50 border border-green-400/30 rounded px-3 py-2 text-sm text-green-300 placeholder-green-400/40 focus:outline-none focus:border-green-400/60"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400/50 text-sm">
              ⏳
            </div>
          )}
        </div>

        {/* Tools list */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tools.map(tool => (
            <div
              key={tool.name}
              className={`p-2 rounded border cursor-pointer transition-all hover:scale-[1.02] ${getCategoryColor(tool.category)}`}
              onClick={() => onToolSelect?.(tool)}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold">{tool.name}</span>
                {showCopyButton && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToolName(tool.name)
                    }}
                    className="text-xs opacity-50 hover:opacity-100"
                  >
                    {copiedTool === tool.name ? '✓' : '📋'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {tools.length === 0 && !loading && (
            <div className="text-center text-green-300/50 text-sm py-4">
              No tools found
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-green-900/10 via-black to-cyan-900/10 border-2 border-green-400/30 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔧</span>
          <div>
            <h2 className="text-xl font-bold text-green-400">Tool Browser</h2>
            <p className="text-xs text-green-300/50">
              Dynamic discovery • {totalAvailable} tools available
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-cyan-400/70">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          searchTools API
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400/50">🔍</div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools by name or capability..."
          className="w-full bg-black/50 border-2 border-green-400/30 rounded-lg pl-10 pr-4 py-3 text-green-300 placeholder-green-400/40 focus:outline-none focus:border-green-400/60 font-mono"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-green-400">⚙️</div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all
              ${category === cat.id
                ? 'bg-green-400/20 border-2 border-green-400 text-green-300'
                : 'bg-black/30 border border-green-400/30 text-green-400/60 hover:border-green-400/50'
              }
            `}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-4 text-yellow-400/70 text-sm mb-4 bg-yellow-400/10 border border-yellow-400/30 rounded">
          ⚠️ {error}
        </div>
      )}

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map(tool => (
          <div
            key={tool.name}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg
              ${getCategoryColor(tool.category)}
            `}
            onClick={() => onToolSelect?.(tool)}
          >
            {/* Tool Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="font-mono font-bold">{tool.name}</div>
              {showCopyButton && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToolName(tool.name)
                  }}
                  className={`
                    px-2 py-1 rounded text-xs transition-all
                    ${copiedTool === tool.name 
                      ? 'bg-green-400/30 text-green-300' 
                      : 'bg-black/30 text-current opacity-50 hover:opacity-100'
                    }
                  `}
                >
                  {copiedTool === tool.name ? '✓ Copied' : '📋 Copy'}
                </button>
              )}
            </div>

            {/* Description */}
            <p className="text-xs opacity-80 line-clamp-2 mb-2">
              {tool.description.length > 100 
                ? tool.description.substring(0, 100) + '...' 
                : tool.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs opacity-60">
              <span className="capitalize">{tool.category || 'general'}</span>
              {tool.relevanceScore !== undefined && tool.relevanceScore > 0 && (
                <span>Score: {tool.relevanceScore}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tools.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h4 className="text-lg font-bold text-green-400 mb-2">No Tools Found</h4>
          <p className="text-green-300/70 text-sm">
            Try a different search term or category
          </p>
        </div>
      )}

      {/* Token Savings Info */}
      <div className="mt-6 pt-4 border-t border-green-400/20 text-center text-xs text-green-300/50">
        <span className="text-cyan-400">💡 Tip:</span> Using searchTools instead of loading all tools saves ~85% context tokens
      </div>
    </div>
  )
}



