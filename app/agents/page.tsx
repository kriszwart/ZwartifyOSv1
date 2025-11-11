"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Agent {
  id: string
  name: string
  description?: string
  prompt: string
  version: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  skillIds?: string[]
  createdByAgentId?: string | null
  creationPrompt?: string | null
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCreationPrompt, setSelectedCreationPrompt] = useState<string | null>(null)
  const [selectedCreatorAgent, setSelectedCreatorAgent] = useState<Agent | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'ai-created' | 'manual'>('all')
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    prompt: '',
    enabled: true,
    ragFolderId: '',
    useMemory: true,
    skillIds: [] as string[],
  })
  const [ragFolders, setRagFolders] = useState<Array<{ id: string; name: string }>>([])
  const [skills, setSkills] = useState<Array<{ id: string; name: string; description: string }>>([])

  useEffect(() => {
    loadAgents()
    loadRAGFolders()
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      const response = await fetch('/api/skills?enabled=true')
      const data = await response.json()
      setSkills(data.skills || [])
    } catch (error) {
      console.error('Error loading skills:', error)
    }
  }

  const loadRAGFolders = async () => {
    try {
      const response = await fetch('/api/rag/folders')
      const data = await response.json()
      setRagFolders(data.folders || [])
    } catch (error) {
      console.error('Error loading RAG folders:', error)
    }
  }

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      const data = await response.json()
      setAgents(data.agents || [])
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })

      if (response.ok) {
        setShowCreateForm(false)
        setCreateForm({ name: '', description: '', prompt: '', enabled: true, ragFolderId: '', useMemory: true, skillIds: [] })
        loadAgents()
      }
    } catch (error) {
      console.error('Error creating agent:', error)
    }
  }

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      })

      if (response.ok) {
        loadAgents()
      }
    } catch (error) {
      console.error('Error toggling agent:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadAgents()
      }
    } catch (error) {
      console.error('Error deleting agent:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none" />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="border-b border-green-400/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              ← HOME
            </Link>
            <span className="text-green-400/50">|</span>
            <button
              onClick={() => window.history.back()}
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              ← Back
            </button>
          </div>
          <h1 className="text-2xl font-bold font-mono">Agent Management</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/skills"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              SKILLS
            </Link>
            <Link
              href="/agent"
              className="text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              TEST →
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-3xl font-bold text-green-400">Agents</h2>
            <div className="flex items-center gap-4">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-400/60 font-mono">Filter:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'ai-created' | 'manual')}
                  className="px-3 py-1 bg-black border border-green-400/30 text-green-400 font-mono text-xs focus:outline-none focus:border-green-400"
                >
                  <option value="all">All Agents</option>
                  <option value="ai-created">🤖 Created by AI</option>
                  <option value="manual">✋ Manual</option>
                </select>
              </div>
              <Link
                href="/create-agent"
                className="px-4 py-2 border-2 border-purple-400 text-purple-400 hover:bg-purple-400/10 transition-colors font-mono text-sm"
              >
                ✨ Create with G-SAC
              </Link>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-colors font-mono"
              >
                {showCreateForm ? 'Cancel' : '+ Create Agent'}
              </button>
            </div>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-bold mb-4 text-green-400">Create New Agent</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    Description
                  </label>
                  <input
                    type="text"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    Prompt *
                  </label>
                  <textarea
                    value={createForm.prompt}
                    onChange={(e) => setCreateForm({ ...createForm, prompt: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    RAG Folder (Optional)
                  </label>
                  <select
                    value={createForm.ragFolderId}
                    onChange={(e) => setCreateForm({ ...createForm, ragFolderId: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                  >
                    <option value="">None (No RAG knowledge base)</option>
                    {ragFolders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-green-400/60 mt-1">
                    Select a RAG folder to give this agent access to uploaded documents. 
                    <Link href="/rag" className="text-green-400 hover:underline ml-1">Create folder →</Link>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={createForm.enabled}
                    onChange={(e) => setCreateForm({ ...createForm, enabled: e.target.checked })}
                    className="w-4 h-4 border-green-400/30 bg-black text-green-400 focus:ring-green-400"
                  />
                  <label htmlFor="enabled" className="text-sm font-mono text-green-300">
                    Enabled
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useMemory"
                    checked={createForm.useMemory}
                    onChange={(e) => setCreateForm({ ...createForm, useMemory: e.target.checked })}
                    className="w-4 h-4 border-green-400/30 bg-black text-green-400 focus:ring-green-400"
                  />
                  <label htmlFor="useMemory" className="text-sm font-mono text-green-300">
                    Use Conversation Memory
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    Skills (Optional)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-green-400/30 p-3 rounded bg-black/50">
                    {skills.length === 0 ? (
                      <p className="text-xs text-green-400/60">
                        No skills available. <Link href="/skills" className="text-green-400 hover:underline">Create skills →</Link>
                      </p>
                    ) : (
                      skills.map((skill) => (
                        <label key={skill.id} className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createForm.skillIds?.includes(skill.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCreateForm({ ...createForm, skillIds: [...(createForm.skillIds || []), skill.id] })
                              } else {
                                setCreateForm({ ...createForm, skillIds: createForm.skillIds?.filter(id => id !== skill.id) || [] })
                              }
                            }}
                            className="mt-1 w-4 h-4 border-green-400/30 bg-black text-green-400 focus:ring-green-400"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-mono text-green-400">{skill.name}</div>
                            <div className="text-xs text-green-400/60">{skill.description}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-green-400/60 mt-1">
                    Select Skills to give this agent specialised capabilities. Skills provide domain expertise and workflows.
                  </p>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-green-400 bg-green-400/20 text-green-400 hover:bg-green-400/30 transition-colors font-mono"
                >
                  Create Agent
                </button>
              </form>
            </div>
          )}

          {/* Agents List */}
          {loading ? (
            <div className="text-center py-12 text-green-400/60 font-mono">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-green-400/60 font-mono">
              <p className="mb-4">No agents found. Create your first agent above.</p>
              <p className="text-sm text-green-400/40 mt-4">
                Note: Example agents (PDF Processor, Data Analyst, Code Reviewer, Customer Support) should appear automatically after server restart.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {agents
                .filter(agent => {
                  if (filterType === 'all') return true
                  if (filterType === 'ai-created') return !!agent.createdByAgentId
                  if (filterType === 'manual') return !agent.createdByAgentId
                  return true
                })
                .map((agent) => {
                  const creatorAgent = agents.find(a => a.id === agent.createdByAgentId)
                  return (
                    <div
                      key={agent.id}
                      className={`bg-black/50 border-2 p-6 rounded-lg ${
                        agent.createdByAgentId 
                          ? 'border-purple-400/50 bg-gradient-to-r from-purple-400/5 to-black/50' 
                          : 'border-green-400/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-xl font-bold text-green-400">{agent.name}</h3>
                            <span
                              className={`px-2 py-1 text-xs font-mono border ${
                                agent.enabled
                                  ? 'border-green-400/50 bg-green-400/10 text-green-400'
                                  : 'border-red-400/50 bg-red-400/10 text-red-400'
                              }`}
                            >
                              {agent.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            {agent.createdByAgentId && (
                              <button
                                onClick={() => {
                                  setSelectedCreationPrompt(agent.creationPrompt || `Created by ${creatorAgent?.name || 'an AI agent'}`)
                                  setSelectedCreatorAgent(creatorAgent || null)
                                }}
                                className="px-3 py-1 text-xs font-mono border-2 border-purple-400/70 bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 hover:border-purple-400 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-400/20"
                                title="Click to view creation prompt"
                              >
                                <span className="text-base">🤖</span>
                                <span>Created by {creatorAgent?.name || 'AI Agent'}</span>
                              </button>
                            )}
                            <span className="text-xs text-green-400/60 font-mono">
                              v{agent.version}
                            </span>
                          </div>
                      {agent.description && (
                        <p className="text-green-300/80 mb-3">{agent.description}</p>
                      )}
                      {agent.skillIds && agent.skillIds.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-green-400/60 font-mono mb-1">Skills:</div>
                          <div className="flex flex-wrap gap-2">
                            {agent.skillIds.map((skillId) => {
                              const skill = skills.find(s => s.id === skillId)
                              return skill ? (
                                <span key={skillId} className="px-2 py-1 text-xs bg-green-400/10 text-green-400/80 border border-green-400/30 rounded font-mono">
                                  {skill.name}
                                </span>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                      <div className="bg-black/50 border border-green-400/20 p-3 rounded font-mono text-sm text-green-400/80 mb-3">
                        <div className="text-xs text-green-400/60 mb-1">Prompt:</div>
                        <div className="line-clamp-3">{agent.prompt}</div>
                      </div>
                      <div className="text-xs text-green-400/60 font-mono">
                        Created: {new Date(agent.createdAt).toLocaleString()} • 
                        Updated: {new Date(agent.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Link
                        href={`/agent/${agent.id}`}
                        className="px-3 py-1 text-xs font-mono border border-green-400/50 text-green-400 hover:bg-green-400/10 transition-colors text-center"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleToggleEnabled(agent.id, agent.enabled)}
                        className={`px-3 py-1 text-xs font-mono border transition-colors ${
                          agent.enabled
                            ? 'border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10'
                            : 'border-green-400/50 text-green-400 hover:bg-green-400/10'
                        }`}
                      >
                        {agent.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="px-3 py-1 text-xs font-mono border border-red-400/50 text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        Delete
                      </button>
                      </div>
                    </div>
                  </div>
                  )
                })}
            </div>
          )}
        </main>

        {/* Creation Prompt Modal */}
        {selectedCreationPrompt && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-black border-2 border-purple-400/50 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-purple-400 font-mono">Original Creation Prompt</h3>
                  {selectedCreatorAgent && (
                    <p className="text-sm text-purple-300/70 font-mono mt-1">
                      Created by: <Link href={`/agent/${selectedCreatorAgent.id}`} className="text-purple-400 hover:text-purple-300 underline">{selectedCreatorAgent.name}</Link>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedCreationPrompt(null)
                    setSelectedCreatorAgent(null)
                  }}
                  className="text-purple-400 hover:text-purple-300 transition-colors font-mono text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="bg-black/50 border border-purple-400/30 p-4 rounded font-mono text-sm text-purple-300 whitespace-pre-wrap">
                {selectedCreationPrompt}
              </div>
              <div className="mt-4 text-xs text-purple-400/60 font-mono">
                This shows the original prompt used to create this agent via G-SAC (Growth Strategy Agent Creator).
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

