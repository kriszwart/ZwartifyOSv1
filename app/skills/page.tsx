"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Skill {
  id: string
  name: string
  description: string
  instructions: string
  examples?: string[]
  tags?: string[]
  version: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  resourceFolderId?: string
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    instructions: '',
    examples: '',
    tags: '',
    enabled: true,
    resourceFolderId: '',
  })
  const [ragFolders, setRagFolders] = useState<Array<{ id: string; name: string }>>([])

  // Filter skills based on search query and enabled filter
  const filteredSkills = skills.filter(skill => {
    // Search filter
    const matchesSearch = !searchQuery || 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (skill.tags && skill.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    
    // Enabled filter
    const matchesEnabled = filterEnabled === null || skill.enabled === filterEnabled
    
    return matchesSearch && matchesEnabled
  })

  useEffect(() => {
    loadSkills()
    loadRAGFolders()
  }, [])

  const loadSkills = async () => {
    try {
      const response = await fetch('/api/skills')
      const data = await response.json()
      setSkills(data.skills || [])
    } catch (error) {
      console.error('Error loading skills:', error)
    } finally {
      setLoading(false)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          examples: createForm.examples ? createForm.examples.split('\n').filter(line => line.trim()) : [],
          tags: createForm.tags ? createForm.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        }),
      })

      if (response.ok) {
        setShowCreateForm(false)
        setCreateForm({ name: '', description: '', instructions: '', examples: '', tags: '', enabled: true, resourceFolderId: '' })
        loadSkills()
      }
    } catch (error) {
      console.error('Error creating skill:', error)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSkill) return

    try {
      const response = await fetch(`/api/skills/${editingSkill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description,
          instructions: createForm.instructions,
          examples: createForm.examples ? createForm.examples.split('\n').filter(line => line.trim()) : [],
          tags: createForm.tags ? createForm.tags.split(',').map(t => t.trim()).filter(t => t) : [],
          enabled: createForm.enabled,
          resourceFolderId: createForm.resourceFolderId || undefined,
        }),
      })

      if (response.ok) {
        setEditingSkill(null)
        setCreateForm({ name: '', description: '', instructions: '', examples: '', tags: '', enabled: true, resourceFolderId: '' })
        loadSkills()
      }
    } catch (error) {
      console.error('Error updating skill:', error)
    }
  }

  const startEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setShowCreateForm(false)
    setCreateForm({
      name: skill.name,
      description: skill.description,
      instructions: skill.instructions,
      examples: skill.examples?.join('\n') || '',
      tags: skill.tags?.join(', ') || '',
      enabled: skill.enabled,
      resourceFolderId: skill.resourceFolderId || '',
    })
  }

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/skills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      })

      if (response.ok) {
        loadSkills()
      }
    } catch (error) {
      console.error('Error toggling skill:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return

    try {
      const response = await fetch(`/api/skills/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadSkills()
      }
    } catch (error) {
      console.error('Error deleting skill:', error)
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
          <h1 className="text-2xl font-bold font-mono">Agent Skills</h1>
          <Link
            href="/agents"
            className="text-green-400 hover:text-green-300 transition-colors font-mono"
          >
            AGENTS →
          </Link>
        </header>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-green-400 mb-2">Skills</h2>
              <p className="text-green-300/80 text-sm">
                Modular capabilities that extend agent functionality with domain-specific expertise
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-colors font-mono"
            >
              {showCreateForm ? 'Cancel' : '+ Create Skill'}
            </button>
          </div>

          {/* Search and Filter */}
          <div className="bg-black/50 border border-green-400/30 p-4 rounded-lg mb-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search skills by name, description, or tags..."
                  className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                />
              </div>
              <select
                value={filterEnabled === null ? 'all' : filterEnabled ? 'enabled' : 'disabled'}
                onChange={(e) => {
                  if (e.target.value === 'all') setFilterEnabled(null)
                  else setFilterEnabled(e.target.value === 'enabled')
                }}
                className="px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
              >
                <option value="all">All Skills</option>
                <option value="enabled">Enabled Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>
          </div>

          {/* Create/Edit Form */}
          {(showCreateForm || editingSkill) && (
            <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-bold mb-4 text-green-400">
                {editingSkill ? 'Edit Skill' : 'Create New Skill'}
              </h3>
              <form onSubmit={editingSkill ? handleEdit : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                    placeholder="e.g., pdf-processing"
                    required
                  />
                  <p className="text-xs text-green-400/60 mt-1">Lowercase letters, numbers, and hyphens only</p>
                </div>
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                    placeholder="Brief description of what this Skill does and when to use it"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    Instructions *
                  </label>
                  <textarea
                    value={createForm.instructions}
                    onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                    placeholder="Step-by-step guidance, workflows, and best practices..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    Examples (one per line)
                  </label>
                  <textarea
                    value={createForm.examples}
                    onChange={(e) => setCreateForm({ ...createForm, examples: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                    placeholder="Example 1: Extract text from PDF&#10;Example 2: Analyse data..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={createForm.tags}
                    onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                    placeholder="pdf, document, extraction"
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    Resource Folder (Optional)
                  </label>
                  <select
                    value={createForm.resourceFolderId}
                    onChange={(e) => setCreateForm({ ...createForm, resourceFolderId: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                  >
                    <option value="">None</option>
                    {ragFolders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-green-400/60 mt-1">
                    Optional RAG folder with additional resources for this Skill
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
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-green-400 bg-green-400/20 text-green-400 hover:bg-green-400/30 transition-colors font-mono"
                >
                  {editingSkill ? 'Update Skill' : 'Create Skill'}
                </button>
                {editingSkill && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSkill(null)
                      setCreateForm({ name: '', description: '', instructions: '', examples: '', tags: '', enabled: true, resourceFolderId: '' })
                    }}
                    className="px-4 py-2 border-2 border-red-400/50 text-red-400 hover:bg-red-400/10 transition-colors font-mono"
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Skills List */}
          {loading ? (
            <div className="text-center py-12 text-green-400/60 font-mono">
              Loading skills...
            </div>
          ) : skills.length === 0 ? (
            <div className="text-center py-12 text-green-400/60 font-mono">
              No skills found. Create your first skill above.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-green-400">{skill.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-mono border ${
                            skill.enabled
                              ? 'border-green-400/50 bg-green-400/10 text-green-400'
                              : 'border-red-400/50 bg-red-400/10 text-red-400'
                          }`}
                        >
                          {skill.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        {skill.tags && skill.tags.length > 0 && (
                          <div className="flex gap-2">
                            {skill.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-1 text-xs bg-green-400/10 text-green-400/80 border border-green-400/30 rounded font-mono">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-green-300/80 mb-3">{skill.description}</p>
                      <div className="bg-black/50 border border-green-400/20 p-3 rounded font-mono text-sm text-green-400/80 mb-3">
                        <div className="text-xs text-green-400/60 mb-1">Instructions:</div>
                        <div className="line-clamp-3">{skill.instructions}</div>
                      </div>
                      {skill.examples && skill.examples.length > 0 && (
                        <div className="text-xs text-green-400/60 font-mono mb-2">
                          Examples: {skill.examples.slice(0, 2).join(', ')}
                          {skill.examples.length > 2 && ` +${skill.examples.length - 2} more`}
                        </div>
                      )}
                      <div className="text-xs text-green-400/60 font-mono">
                        Created: {new Date(skill.createdAt).toLocaleString()} • 
                        Updated: {new Date(skill.updatedAt).toLocaleString()}
                        {skill.resourceFolderId && (
                          <span className="ml-2 text-cyan-400">📁 Has Resources</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => setSelectedSkill(skill)}
                        className="px-3 py-1 text-xs font-mono border border-blue-400/50 text-blue-400 hover:bg-blue-400/10 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => startEdit(skill)}
                        className="px-3 py-1 text-xs font-mono border border-purple-400/50 text-purple-400 hover:bg-purple-400/10 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleEnabled(skill.id, skill.enabled)}
                        className={`px-3 py-1 text-xs font-mono border transition-colors ${
                          skill.enabled
                            ? 'border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10'
                            : 'border-green-400/50 text-green-400 hover:bg-green-400/10'
                        }`}
                      >
                        {skill.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(skill.id)}
                        className="px-3 py-1 text-xs font-mono border border-red-400/50 text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Skill Detail Modal */}
          {selectedSkill && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-black border-2 border-green-400/50 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-green-400">{selectedSkill.name}</h3>
                    <button
                      onClick={() => setSelectedSkill(null)}
                      className="text-green-400 hover:text-green-300 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-green-400/60 font-mono mb-1">Description</div>
                      <p className="text-green-300">{selectedSkill.description}</p>
                    </div>
                    
                    <div>
                      <div className="text-xs text-green-400/60 font-mono mb-1">Instructions</div>
                      <div className="bg-black/50 border border-green-400/20 p-4 rounded font-mono text-sm text-green-400/90 whitespace-pre-wrap">
                        {selectedSkill.instructions}
                      </div>
                    </div>
                    
                    {selectedSkill.examples && selectedSkill.examples.length > 0 && (
                      <div>
                        <div className="text-xs text-green-400/60 font-mono mb-1">Examples</div>
                        <ul className="list-disc list-inside space-y-1 text-green-300">
                          {selectedSkill.examples.map((example, i) => (
                            <li key={i}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedSkill.tags && selectedSkill.tags.length > 0 && (
                      <div>
                        <div className="text-xs text-green-400/60 font-mono mb-1">Tags</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedSkill.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-green-400/10 text-green-400/80 border border-green-400/30 rounded font-mono">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-green-400/60 font-mono">
                      Version: {selectedSkill.version} • 
                      Created: {new Date(selectedSkill.createdAt).toLocaleString()} • 
                      Updated: {new Date(selectedSkill.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
