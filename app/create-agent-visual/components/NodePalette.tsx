"use client"

import { useState } from 'react'

interface NodePaletteProps {
  onAddNode: (type: string) => void
  availableTools: Array<{ name: string; description: string }>
  availableSkills: Array<{ id: string; name: string; description: string }>
  availableRAGFolders: Array<{ id: string; name: string }>
}

export default function NodePalette({
  onAddNode,
  availableTools,
  availableSkills,
  availableRAGFolders,
}: NodePaletteProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const nodeTypes = [
    { type: 'agentConfig', label: 'Agent Config', icon: '⚙️', color: 'green' },
    { type: 'tool', label: 'Tool', icon: '🔧', color: 'yellow' },
    { type: 'skill', label: 'Skill', icon: '🧠', color: 'purple' },
    { type: 'rag', label: 'RAG', icon: '📚', color: 'cyan' },
    { type: 'mcp', label: 'MCP Server', icon: '🌐', color: 'blue' },
    { type: 'output', label: 'Output', icon: '📤', color: 'green' },
  ]

  const handleAddNode = (type: string) => {
    onAddNode(type)
  }

  const handleAddTool = (toolName: string, toolDescription: string) => {
    // This will be handled by the parent component
    onAddNode(`tool|${toolName}|${encodeURIComponent(toolDescription)}`)
  }

  const handleAddSkill = (skillId: string, skillName: string, skillDescription: string) => {
    onAddNode(`skill|${skillId}|${encodeURIComponent(skillName)}|${encodeURIComponent(skillDescription)}`)
  }

  const handleAddRAG = (ragId: string, ragName: string) => {
    onAddNode(`rag|${ragId}|${encodeURIComponent(ragName)}`)
  }

  return (
    <div className="bg-black/90 p-4 h-full overflow-y-auto flex flex-col">
      <div className="flex-shrink-0">
        <h3 className="text-green-400 font-mono font-bold text-sm mb-4 uppercase tracking-wider">
          Node Palette
        </h3>
        <div className="text-green-400/40 text-[10px] font-mono mb-4">
          Click to add nodes to canvas
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
        {nodeTypes.map((nodeType) => (
          <div key={nodeType.type}>
            <button
              onClick={() => {
                if (nodeType.type === 'tool' || nodeType.type === 'skill' || nodeType.type === 'rag') {
                  setExpanded(expanded === nodeType.type ? null : nodeType.type)
                } else {
                  handleAddNode(nodeType.type)
                }
              }}
              className={`w-full px-3 py-2 text-left border-2 rounded font-mono text-xs transition-all ${
                nodeType.color === 'green'
                  ? 'border-green-400/50 text-green-400 hover:border-green-400 hover:bg-green-400/10'
                  : nodeType.color === 'yellow'
                  ? 'border-yellow-400/50 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/10'
                  : nodeType.color === 'purple'
                  ? 'border-purple-400/50 text-purple-400 hover:border-purple-400 hover:bg-purple-400/10'
                  : nodeType.color === 'cyan'
                  ? 'border-cyan-400/50 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10'
                  : 'border-blue-400/50 text-blue-400 hover:border-blue-400 hover:bg-blue-400/10'
              }`}
            >
              <span className="mr-2">{nodeType.icon}</span>
              {nodeType.label}
            </button>
            {expanded === nodeType.type && (
              <div className="mt-2 ml-4 space-y-1 max-h-48 overflow-y-auto">
                {nodeType.type === 'tool' && (
                  availableTools.length === 0 ? (
                    <div className="text-yellow-400/40 text-[10px] font-mono px-2 py-1">
                      No tools available
                    </div>
                  ) : (
                    availableTools.map((tool) => (
                      <button
                        key={tool.name}
                        onClick={() => handleAddTool(tool.name, tool.description)}
                        className="w-full px-2 py-1 text-left text-[10px] border border-yellow-400/30 text-yellow-300/80 hover:bg-yellow-400/10 hover:text-yellow-300 rounded font-mono transition-colors"
                        title={tool.description}
                      >
                        {tool.name}
                      </button>
                    ))
                  )
                )}
                {nodeType.type === 'skill' && (
                  availableSkills.length === 0 ? (
                    <div className="text-purple-400/40 text-[10px] font-mono px-2 py-1">
                      No skills available
                    </div>
                  ) : (
                    availableSkills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => handleAddSkill(skill.id, skill.name, skill.description)}
                        className="w-full px-2 py-1 text-left text-[10px] border border-purple-400/30 text-purple-300/80 hover:bg-purple-400/10 hover:text-purple-300 rounded font-mono transition-colors"
                        title={skill.description}
                      >
                        {skill.name}
                      </button>
                    ))
                  )
                )}
                {nodeType.type === 'rag' && (
                  availableRAGFolders.length === 0 ? (
                    <div className="text-cyan-400/40 text-[10px] font-mono px-2 py-1">
                      No RAG folders available
                    </div>
                  ) : (
                    availableRAGFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleAddRAG(folder.id, folder.name)}
                        className="w-full px-2 py-1 text-left text-[10px] border border-cyan-400/30 text-cyan-300/80 hover:bg-cyan-400/10 hover:text-cyan-300 rounded font-mono transition-colors"
                      >
                        {folder.name}
                      </button>
                    ))
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

