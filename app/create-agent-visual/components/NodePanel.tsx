"use client"

import { useState } from 'react'
import { Node } from '@xyflow/react'
import type { CustomNodeData, AgentConfigNodeData, ToolNodeData, SkillNodeData, RAGNodeData, MCPNodeData } from '../types'

interface NodePanelProps {
  node: Node<CustomNodeData> | null
  onUpdateNode: (nodeId: string, data: Partial<CustomNodeData>) => void
  onDeleteNode: (nodeId: string) => void
  availableTools: Array<{ name: string; description: string }>
  availableSkills: Array<{ id: string; name: string; description: string }>
  availableRAGFolders: Array<{ id: string; name: string }>
}

export default function NodePanel({
  node,
  onUpdateNode,
  onDeleteNode,
  availableTools,
  availableSkills,
  availableRAGFolders,
}: NodePanelProps) {
  if (!node) {
    return (
      <div className="bg-black/90 p-4 h-full flex items-center justify-center">
        <p className="text-green-400/60 font-mono text-sm text-center">Select a node to configure</p>
      </div>
    )
  }

  const nodeData = node.data

  const handleUpdate = (updates: Partial<CustomNodeData>) => {
    if (node) {
      onUpdateNode(node.id, updates)
    }
  }

  return (
    <div className="bg-black/90 p-4 h-full overflow-y-auto min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-green-400 font-mono font-bold text-sm uppercase tracking-wider">
          {node.type} Config
        </h3>
        {node.type !== 'agentConfig' && (
          <button
            onClick={() => {
              if (confirm(`Delete ${node.type} node?`)) {
                onDeleteNode(node.id)
              }
            }}
            className="text-red-400 hover:text-red-300 font-mono text-xs transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {node.type === 'agentConfig' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-green-300/80 mb-1">Name *</label>
            <input
              type="text"
              value={(nodeData as AgentConfigNodeData).name || ''}
              onChange={(e) => handleUpdate({ name: e.target.value } as Partial<AgentConfigNodeData>)}
              className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono text-sm focus:outline-none focus:border-green-400"
              placeholder="agent-name"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-green-300/80 mb-1">Description</label>
            <input
              type="text"
              value={(nodeData as AgentConfigNodeData).description || ''}
              onChange={(e) => handleUpdate({ description: e.target.value } as Partial<AgentConfigNodeData>)}
              className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono text-sm focus:outline-none focus:border-green-400"
              placeholder="Agent description"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-green-300/80 mb-1">Prompt *</label>
            <textarea
              value={(nodeData as AgentConfigNodeData).prompt || ''}
              onChange={(e) => handleUpdate({ prompt: e.target.value } as Partial<AgentConfigNodeData>)}
              rows={8}
              className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono text-sm focus:outline-none focus:border-green-400 resize-none"
              placeholder="Agent system prompt..."
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(nodeData as AgentConfigNodeData).enabled !== false}
                onChange={(e) => handleUpdate({ enabled: e.target.checked } as Partial<AgentConfigNodeData>)}
                className="w-4 h-4 border-green-400/30 bg-black text-green-400"
              />
              <span className="text-xs font-mono text-green-300/80">Enabled</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(nodeData as AgentConfigNodeData).useMemory !== false}
                onChange={(e) => handleUpdate({ useMemory: e.target.checked } as Partial<AgentConfigNodeData>)}
                className="w-4 h-4 border-green-400/30 bg-black text-green-400"
              />
              <span className="text-xs font-mono text-green-300/80">Use Memory</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-mono text-green-300/80 mb-1">Version</label>
            <input
              type="text"
              value={(nodeData as AgentConfigNodeData).version || '1.0.0'}
              onChange={(e) => handleUpdate({ version: e.target.value } as Partial<AgentConfigNodeData>)}
              className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono text-sm focus:outline-none focus:border-green-400"
            />
          </div>
        </div>
      )}

      {node.type === 'tool' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-green-300/80 mb-1">Select Tool</label>
            <select
              value={(nodeData as ToolNodeData).toolName || ''}
              onChange={(e) => {
                const tool = availableTools.find(t => t.name === e.target.value)
                handleUpdate({
                  toolName: e.target.value,
                  toolDescription: tool?.description || '',
                } as Partial<ToolNodeData>)
              }}
              className="w-full px-3 py-2 bg-black border border-yellow-400/30 text-yellow-400 font-mono text-sm focus:outline-none focus:border-yellow-400"
            >
              <option value="">Select a tool...</option>
              {availableTools.map((tool) => (
                <option key={tool.name} value={tool.name}>
                  {tool.name}
                </option>
              ))}
            </select>
          </div>
          {(nodeData as ToolNodeData).toolDescription && (
            <div className="text-xs font-mono text-yellow-300/60">
              {(nodeData as ToolNodeData).toolDescription}
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(nodeData as ToolNodeData).enabled !== false}
              onChange={(e) => handleUpdate({ enabled: e.target.checked } as Partial<ToolNodeData>)}
              className="w-4 h-4 border-yellow-400/30 bg-black text-yellow-400"
            />
            <span className="text-xs font-mono text-yellow-300/80">Enabled</span>
          </label>
        </div>
      )}

      {node.type === 'skill' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-green-300/80 mb-1">Select Skill</label>
            <select
              value={(nodeData as SkillNodeData).skillId || ''}
              onChange={(e) => {
                const skill = availableSkills.find(s => s.id === e.target.value)
                handleUpdate({
                  skillId: e.target.value,
                  skillName: skill?.name || '',
                  skillDescription: skill?.description || '',
                } as Partial<SkillNodeData>)
              }}
              className="w-full px-3 py-2 bg-black border border-purple-400/30 text-purple-400 font-mono text-sm focus:outline-none focus:border-purple-400"
            >
              <option value="">Select a skill...</option>
              {availableSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>
          {(nodeData as SkillNodeData).skillDescription && (
            <div className="text-xs font-mono text-purple-300/60">
              {(nodeData as SkillNodeData).skillDescription}
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(nodeData as SkillNodeData).enabled !== false}
              onChange={(e) => handleUpdate({ enabled: e.target.checked } as Partial<SkillNodeData>)}
              className="w-4 h-4 border-purple-400/30 bg-black text-purple-400"
            />
            <span className="text-xs font-mono text-purple-300/80">Enabled</span>
          </label>
        </div>
      )}

      {node.type === 'rag' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-green-300/80 mb-1">Select RAG Folder</label>
            <select
              value={(nodeData as RAGNodeData).ragFolderId || ''}
              onChange={(e) => {
                const folder = availableRAGFolders.find(f => f.id === e.target.value)
                handleUpdate({
                  ragFolderId: e.target.value,
                  ragFolderName: folder?.name || '',
                } as Partial<RAGNodeData>)
              }}
              className="w-full px-3 py-2 bg-black border border-cyan-400/30 text-cyan-400 font-mono text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="">Select a folder...</option>
              {availableRAGFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(nodeData as RAGNodeData).enabled !== false}
              onChange={(e) => handleUpdate({ enabled: e.target.checked } as Partial<RAGNodeData>)}
              className="w-4 h-4 border-cyan-400/30 bg-black text-cyan-400"
            />
            <span className="text-xs font-mono text-cyan-300/80">Enabled</span>
          </label>
        </div>
      )}

      {node.type === 'mcp' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-green-300/80 mb-1">Server Name</label>
            <input
              type="text"
              value={(nodeData as MCPNodeData).serverName || ''}
              onChange={(e) => handleUpdate({ serverName: e.target.value } as Partial<MCPNodeData>)}
              className="w-full px-3 py-2 bg-black border border-blue-400/30 text-blue-400 font-mono text-sm focus:outline-none focus:border-blue-400"
              placeholder="My MCP Server"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-green-300/80 mb-1">Server URL</label>
            <input
              type="text"
              value={(nodeData as MCPNodeData).serverUrl || ''}
              onChange={(e) => handleUpdate({ serverUrl: e.target.value } as Partial<MCPNodeData>)}
              className="w-full px-3 py-2 bg-black border border-blue-400/30 text-blue-400 font-mono text-sm focus:outline-none focus:border-blue-400"
              placeholder="https://..."
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(nodeData as MCPNodeData).enabled !== false}
              onChange={(e) => handleUpdate({ enabled: e.target.checked } as Partial<MCPNodeData>)}
              className="w-4 h-4 border-blue-400/30 bg-black text-blue-400"
            />
            <span className="text-xs font-mono text-blue-300/80">Enabled</span>
          </label>
        </div>
      )}
    </div>
  )
}

