"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Node } from '@xyflow/react'
import NodeCanvas from './components/NodeCanvas'
import NodePalette from './components/NodePalette'
import NodePanel from './components/NodePanel'
import AgentPreview from './components/AgentPreview'
import { useNodeBuilder } from './hooks/useNodeBuilder'
import { useAgentConfig } from './hooks/useAgentConfig'
import { agentToVisualNodes } from './utils/agentToVisualNodes'
import { workflowTemplates } from './utils/workflowTemplates'
import { exportWorkflowAsCode, exportWorkflowAsJSON } from './utils/workflowExporter'
import type { CustomNode, CustomNodeData, ToolNodeData, SkillNodeData, RAGNodeData, MCPNodeData, OutputNodeData } from './types'

export const dynamic = 'force-dynamic'

function CreateAgentVisualPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentId = searchParams.get('agentId')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null)
  const [agentName, setAgentName] = useState<string>('')
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    setSelectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeData,
    deleteNode,
    loadNodes,
    clearCanvas,
  } = useNodeBuilder()

  const agentConfig = useAgentConfig(nodes)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingAgent, setIsLoadingAgent] = useState(false)
  const [showLoadAgentModal, setShowLoadAgentModal] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [allAgents, setAllAgents] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [availableTools, setAvailableTools] = useState<Array<{ name: string; description: string }>>([])
  const [availableSkills, setAvailableSkills] = useState<Array<{ id: string; name: string; description: string }>>([])
  const [availableRAGFolders, setAvailableRAGFolders] = useState<Array<{ id: string; name: string }>>([])

  // Load available tools, skills, RAG folders, and agents
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tools
        const toolsRes = await fetch('/api/tools')
        if (toolsRes.ok) {
          const toolsData = await toolsRes.json()
          setAvailableTools(toolsData.tools || [])
        }

        // Load skills
        const skillsRes = await fetch('/api/skills?enabled=true')
        if (skillsRes.ok) {
          const skillsData = await skillsRes.json()
          setAvailableSkills(skillsData.skills || [])
        }

        // Load RAG folders
        const ragRes = await fetch('/api/rag/folders')
        if (ragRes.ok) {
          const ragData = await ragRes.json()
          setAvailableRAGFolders(ragData.folders || [])
        }

        // Load agents
        const agentsRes = await fetch('/api/agents')
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json()
          const agents = agentsData.agents || []
          setAllAgents(agents)
          setAvailableAgents(agents)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [])

  // Load agent helper function
  const loadAgentById = useCallback(async (id: string) => {
    if (isLoadingAgent) return

    setIsLoadingAgent(true)
    try {
      const response = await fetch(`/api/agents/${id}`)
      if (response.ok) {
        const data = await response.json()
        const agent = data.agent

        if (agent && availableTools.length > 0 && availableSkills.length > 0) {
          setIsEditMode(true)
          setEditingAgentId(agent.id)
          setAgentName(agent.name)
          setShowLoadAgentModal(false)

          const { nodes: visualNodes, edges: visualEdges } = agentToVisualNodes(
            {
              id: agent.id,
              name: agent.name,
              description: agent.description,
              prompt: agent.prompt,
              version: agent.version,
              enabled: agent.enabled,
              useMemory: agent.useMemory,
              skillIds: agent.skillIds,
              ragFolderId: agent.ragFolderId,
              metadata: agent.metadata,
            },
            {
              availableTools,
              availableSkills,
              availableRAGFolders,
            }
          )

          loadNodes(visualNodes, visualEdges)
          router.push(`/create-agent-visual?agentId=${id}`)
        }
      }
    } catch (error) {
      console.error('Error loading agent:', error)
      alert('Failed to load agent. Please try again.')
    } finally {
      setIsLoadingAgent(false)
    }
  }, [availableTools, availableSkills, availableRAGFolders, loadNodes, isLoadingAgent, router])

  // Load agent if agentId is in URL
  useEffect(() => {
    if (agentId && availableTools.length > 0 && availableSkills.length > 0 && !isLoadingAgent) {
      loadAgentById(agentId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, availableTools.length, availableSkills.length])

  // Update output node when agent config changes (prevent infinite loop)
  useEffect(() => {
    if (agentConfig) {
      const outputNode = nodes.find(node => node.type === 'output')
      if (outputNode) {
        const currentConfig = (outputNode.data as OutputNodeData).agentConfig
        // Only update if config actually changed
        if (
          !currentConfig ||
          currentConfig.name !== agentConfig.name ||
          currentConfig.prompt !== agentConfig.prompt ||
          JSON.stringify(currentConfig.toolNames) !== JSON.stringify(agentConfig.toolNames) ||
          JSON.stringify(currentConfig.skillIds) !== JSON.stringify(agentConfig.skillIds) ||
          currentConfig.ragFolderId !== agentConfig.ragFolderId ||
          JSON.stringify(currentConfig.mcpServers) !== JSON.stringify(agentConfig.mcpServers)
        ) {
          updateNodeData(outputNode.id, {
            agentConfig,
          } as Partial<OutputNodeData>)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentConfig?.name, agentConfig?.prompt, agentConfig?.toolNames?.length, agentConfig?.skillIds?.length, agentConfig?.ragFolderId, agentConfig?.mcpServers?.length])

  const handleAddNode = useCallback((nodeSpec: string) => {
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 }
    
    if (nodeSpec.startsWith('tool|')) {
      const [, toolName, toolDescription] = nodeSpec.split('|')
      addNode('tool', position, {
        toolName,
        toolDescription: decodeURIComponent(toolDescription || ''),
        enabled: true,
      } as ToolNodeData)
    } else if (nodeSpec.startsWith('skill|')) {
      const [, skillId, skillName, skillDescription] = nodeSpec.split('|')
      addNode('skill', position, {
        skillId,
        skillName: decodeURIComponent(skillName || ''),
        skillDescription: decodeURIComponent(skillDescription || ''),
        enabled: true,
      } as SkillNodeData)
    } else if (nodeSpec.startsWith('rag|')) {
      const [, ragId, ragName] = nodeSpec.split('|')
      addNode('rag', position, {
        ragFolderId: ragId,
        ragFolderName: decodeURIComponent(ragName || ''),
        enabled: true,
      } as RAGNodeData)
    } else if (nodeSpec === 'mcp') {
      addNode('mcp', position, {
        serverUrl: '',
        serverName: '',
        enabled: true,
      } as MCPNodeData)
    } else if (nodeSpec === 'output') {
      const outputPosition = { x: 600, y: 100 }
      addNode('output', outputPosition, {
        agentConfig: agentConfig || {
          name: '',
          description: '',
          prompt: '',
          enabled: true,
          useMemory: true,
          version: '1.0.0',
          toolNames: [],
          skillIds: [],
          ragFolderId: undefined,
          mcpServers: [],
        },
      } as OutputNodeData)
    } else {
      addNode(nodeSpec, position)
    }
  }, [addNode, agentConfig])

  const handleNodeClick = useCallback((event: React.MouseEvent, node: CustomNode) => {
    setSelectedNodeId(node.id)
  }, [setSelectedNodeId])

  const handleSave = async () => {
    if (!agentConfig) {
      alert('Please configure agent before saving.')
      return
    }

    if (!agentConfig.name || !agentConfig.name.trim()) {
      alert('Agent name is required.')
      return
    }

    if (!agentConfig.prompt || !agentConfig.prompt.trim()) {
      alert('Agent prompt is required.')
      return
    }

    setIsSaving(true)
    try {
      const url = isEditMode && editingAgentId
        ? `/api/agents/${editingAgentId}`
        : '/api/agents'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentConfig.name.trim(),
          description: agentConfig.description?.trim() || '',
          prompt: agentConfig.prompt.trim(),
          enabled: agentConfig.enabled,
          useMemory: agentConfig.useMemory,
          version: agentConfig.version || '1.0.0',
          ragFolderId: agentConfig.ragFolderId || '',
          skillIds: agentConfig.skillIds || [],
          metadata: {
            mcpServers: agentConfig.mcpServers || [],
            toolNames: agentConfig.toolNames || [],
          },
        }),
      })

      if (response.ok) {
        router.push(`/agents`)
      } else {
        const error = await response.json()
        alert(`Error ${isEditMode ? 'updating' : 'creating'} agent: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving agent:', error)
      alert(`Failed to ${isEditMode ? 'update' : 'save'} agent. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none" />

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-green-400/30 p-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              ← HOME
            </Link>
            <span className="text-green-400/50">|</span>
            <Link
              href="/agents"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-xs"
            >
              Agents
            </Link>
          </div>
          <h1 className="text-xl font-bold font-mono truncate max-w-md" style={{ animation: "glitch-slow 4s infinite" }}>
            {isEditMode ? `Editing: ${agentName}` : 'Visual Agent Builder'}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowTemplatesModal(true)}
              className="px-3 py-1.5 border-2 border-blue-400 text-blue-400 hover:bg-blue-400/10 transition-all font-mono text-xs"
            >
              📋 Templates
            </button>
            <button
              onClick={() => setShowLoadAgentModal(true)}
              className="px-3 py-1.5 border-2 border-purple-400 text-purple-400 hover:bg-purple-400/10 transition-all font-mono text-xs"
            >
              📥 Load
            </button>
            {isEditMode && (
              <button
                onClick={() => {
                  router.push('/create-agent-visual')
                  clearCanvas()
                  setIsEditMode(false)
                  setEditingAgentId(null)
                  setAgentName('')
                }}
                className="px-3 py-1.5 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 transition-all font-mono text-xs"
              >
                New
              </button>
            )}
            <button
              onClick={() => setShowExportModal(true)}
              disabled={!agentConfig || !agentConfig.name?.trim()}
              className="px-3 py-1.5 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 transition-all font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💾 Export
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoadingAgent || !agentConfig || !agentConfig.name?.trim() || !agentConfig.prompt?.trim()}
              className="px-3 py-1.5 border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title={!agentConfig || !agentConfig.name?.trim() || !agentConfig.prompt?.trim() ? 'Name and prompt are required' : ''}
            >
              {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden relative min-h-0">
          {/* Left Sidebar Toggle */}
          <button
            onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-black/90 border-r border-t border-b border-green-400/30 rounded-r-lg px-2 py-4 text-green-400 hover:bg-green-400/10 transition-all ${
              leftSidebarCollapsed ? 'translate-x-0' : 'translate-x-64'
            }`}
            title={leftSidebarCollapsed ? 'Show Node Palette' : 'Hide Node Palette'}
          >
            <span className="text-xs font-mono">{leftSidebarCollapsed ? '▶' : '◀'}</span>
          </button>

          {/* Node Palette */}
          <div
            className={`bg-black/90 border-r border-green-400/30 transition-all duration-300 overflow-hidden ${
              leftSidebarCollapsed ? 'w-0' : 'w-64'
            }`}
          >
            {!leftSidebarCollapsed && (
              <NodePalette
                onAddNode={handleAddNode}
                availableTools={availableTools}
                availableSkills={availableSkills}
                availableRAGFolders={availableRAGFolders}
              />
            )}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative min-w-0 min-h-0" style={{ height: '100%' }}>
            <NodeCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
            />
          </div>

          {/* Right Sidebar Toggle */}
          <button
            onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-black/90 border-l border-t border-b border-green-400/30 rounded-l-lg px-2 py-4 text-green-400 hover:bg-green-400/10 transition-all ${
              rightSidebarCollapsed ? 'translate-x-0' : '-translate-x-80'
            }`}
            title={rightSidebarCollapsed ? 'Show Panels' : 'Hide Panels'}
          >
            <span className="text-xs font-mono">{rightSidebarCollapsed ? '◀' : '▶'}</span>
          </button>

          {/* Right Column: Node Panel and Agent Preview */}
          <div
            className={`flex flex-col border-l border-green-400/30 transition-all duration-300 overflow-hidden ${
              rightSidebarCollapsed ? 'w-0' : 'w-80'
            }`}
            style={{ height: '100%' }}
          >
            {!rightSidebarCollapsed && (
              <>
                {/* Node Panel */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <NodePanel
                    node={selectedNode}
                    onUpdateNode={updateNodeData}
                    onDeleteNode={deleteNode}
                    availableTools={availableTools}
                    availableSkills={availableSkills}
                    availableRAGFolders={availableRAGFolders}
                  />
                </div>

                {/* Agent Preview (Test Panel) */}
                <div className="border-t border-green-400/30 flex-shrink-0 overflow-hidden" style={{ height: '300px', maxHeight: '300px' }}>
                  <AgentPreview nodes={nodes} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTemplatesModal(false)
            }
          }}
        >
          <div className="bg-black border-2 border-blue-400/50 rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-400 font-mono">Workflow Templates</h3>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="text-blue-400 hover:text-blue-300 transition-colors font-mono text-2xl leading-none"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="text-blue-400/60 text-xs font-mono mb-4">
              Start from a template to see how workflows work together
            </div>
            <div className="space-y-3 overflow-y-auto flex-1">
              {workflowTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    loadNodes(template.nodes, template.edges)
                    setShowTemplatesModal(false)
                    setIsEditMode(false)
                    setEditingAgentId(null)
                    setAgentName('')
                  }}
                  className="w-full px-4 py-3 text-left border border-blue-400/30 text-blue-300 hover:bg-blue-400/10 hover:border-blue-400/50 transition-all rounded font-mono"
                >
                  <div className="font-bold text-blue-400">{template.name}</div>
                  <div className="text-blue-300/60 text-xs mt-1">{template.description}</div>
                  <div className="text-blue-400/40 text-[10px] mt-2">{template.category}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowExportModal(false)
            }
          }}
        >
          <div className="bg-black border-2 border-cyan-400/50 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-cyan-400 font-mono">Export Workflow</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-2xl leading-none"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  const code = exportWorkflowAsCode(agentConfig)
                  navigator.clipboard.writeText(code)
                  alert('Code copied to clipboard!')
                }}
                className="px-3 py-2 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 transition-all font-mono text-xs"
              >
                Copy Code
              </button>
              <button
                onClick={() => {
                  const json = exportWorkflowAsJSON(agentConfig)
                  navigator.clipboard.writeText(json)
                  alert('JSON copied to clipboard!')
                }}
                className="px-3 py-2 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 transition-all font-mono text-xs"
              >
                Copy JSON
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="bg-black/50 p-4 rounded border border-cyan-400/20">
                <pre className="text-cyan-300 text-xs font-mono whitespace-pre-wrap">
                  {exportWorkflowAsCode(agentConfig)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Agent Modal */}
      {showLoadAgentModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLoadAgentModal(false)
            }
          }}
        >
          <div className="bg-black border-2 border-purple-400/50 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-purple-400 font-mono">Load Agent</h3>
              <button
                onClick={() => setShowLoadAgentModal(false)}
                className="text-purple-400 hover:text-purple-300 transition-colors font-mono text-2xl leading-none"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search agents..."
                className="w-full px-3 py-2 bg-black border border-purple-400/30 text-purple-400 font-mono text-sm focus:outline-none focus:border-purple-400"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase()
                  if (searchTerm === '') {
                    setAvailableAgents(allAgents)
                  } else {
                    const filtered = allAgents.filter(agent => 
                      agent.name.toLowerCase().includes(searchTerm) ||
                      agent.description?.toLowerCase().includes(searchTerm)
                    )
                    setAvailableAgents(filtered)
                  }
                }}
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto flex-1">
              {availableAgents.length === 0 ? (
                <p className="text-green-400/60 font-mono text-sm text-center py-8">
                  {allAgents.length === 0 ? 'No agents available' : 'No agents match your search'}
                </p>
              ) : (
                availableAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => loadAgentById(agent.id)}
                    disabled={isLoadingAgent}
                    className="w-full px-4 py-3 text-left border border-purple-400/30 text-purple-300 hover:bg-purple-400/10 hover:border-purple-400/50 transition-all rounded font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-bold text-purple-400">{agent.name}</div>
                    {agent.description && (
                      <div className="text-purple-300/60 text-xs mt-1 line-clamp-2">{agent.description}</div>
                    )}
                  </button>
                ))
              )}
            </div>
            {isLoadingAgent && (
              <div className="mt-4 text-center text-purple-400 font-mono text-sm">
                Loading agent...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const CreateAgentVisualPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-green-400 font-mono">Loading...</div>
      </div>
    }>
      <CreateAgentVisualPageContent />
    </Suspense>
  )
}

export default CreateAgentVisualPage

