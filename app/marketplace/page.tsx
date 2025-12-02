"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AgentPreviewModal from "@/app/components/AgentPreviewModal"

interface PublicAgent {
  id: string
  name: string
  description?: string
  version: string
  category?: string
  tags?: string[]
  exportFormats?: string[]
  installCount?: number
  createdAt: string
  updatedAt: string
  isPublic?: boolean
  isExportable?: boolean
}

export default function MarketplacePage() {
  const [agents, setAgents] = useState<PublicAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedFormat, setSelectedFormat] = useState<string>("")
  const [categories, setCategories] = useState<string[]>([])
  const [selectedAgent, setSelectedAgent] = useState<PublicAgent | null>(null)

  useEffect(() => {
    loadAgents()
  }, [search, selectedCategory, selectedFormat])

  const loadAgents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedFormat) params.append('format', selectedFormat)
      
      const response = await fetch(`/api/agents/public?${params.toString()}`)
      const data = await response.json()
      
      setAgents(data.agents || [])
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(data.agents?.map((a: PublicAgent) => a.category).filter(Boolean) || [])
      ) as string[]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInstall = async (agentId: string) => {
    try {
      await fetch(`/api/agents/${agentId}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'web' }),
      })
      // Reload to update install counts
      loadAgents()
    } catch (error) {
      console.error('Error tracking installation:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-400">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold font-mono mb-2">Agent Marketplace</h1>
          <p className="text-green-400/70 font-mono">
            Discover and install public AI agents
          </p>
        </header>

        {/* Search and Filters */}
        <div className="bg-black/50 border-2 border-green-400/30 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-green-400/60 font-mono mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents..."
                className="w-full px-4 py-2 bg-black border-2 border-green-400/30 rounded text-green-400 font-mono focus:border-green-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-green-400/60 font-mono mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-green-400/30 rounded text-green-400 font-mono focus:border-green-400 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-green-400/60 font-mono mb-2">Export Format</label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-green-400/30 rounded text-green-400 font-mono focus:border-green-400 focus:outline-none"
              >
                <option value="">All Formats</option>
                <option value="wordpress">WordPress</option>
                <option value="widget">Widget</option>
                <option value="api">API</option>
                <option value="npm">NPM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        {loading ? (
          <div className="text-center py-12 text-green-400/60 font-mono">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 text-green-400/60 font-mono">
            No agents found. Try adjusting your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-black/50 border-2 border-green-400/30 rounded-lg p-6 hover:border-green-400/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold font-mono text-green-400">{agent.name}</h3>
                  {agent.installCount && agent.installCount > 0 && (
                    <span className="text-xs text-green-400/60 font-mono">
                      {agent.installCount} installs
                    </span>
                  )}
                </div>
                
                {agent.description && (
                  <p className="text-green-300/70 text-sm mb-4 line-clamp-3">{agent.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.category && (
                    <span className="px-2 py-1 text-xs bg-green-400/10 text-green-400 border border-green-400/30 rounded font-mono">
                      {agent.category}
                    </span>
                  )}
                  {agent.tags && agent.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-green-400/5 text-green-400/70 border border-green-400/20 rounded font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-green-400/60 font-mono">Formats:</span>
                  <div className="flex flex-wrap gap-1">
                    {agent.exportFormats?.map((format) => (
                      <span key={format} className="text-xs text-green-400/50 font-mono">
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className="flex-1 px-4 py-2 bg-green-400/10 text-green-400 border border-green-400/30 rounded font-mono text-sm text-center hover:bg-green-400/20 transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleInstall(agent.id)}
                    className="px-4 py-2 bg-green-400/20 text-green-400 border border-green-400/50 rounded font-mono text-sm hover:bg-green-400/30 transition-colors"
                  >
                    Install
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agent Preview Modal */}
        {selectedAgent && (
          <AgentPreviewModal
            agent={selectedAgent}
            onClose={() => setSelectedAgent(null)}
            onInstall={(agentId) => {
              handleInstall(agentId)
              setSelectedAgent(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

