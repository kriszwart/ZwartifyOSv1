"use client"

import { useState } from 'react'
import { useAgentConfig } from '../hooks/useAgentConfig'
import type { CustomNode } from '../types'
import WorkflowPreview from './WorkflowPreview'
import FullscreenTest from './FullscreenTest'

interface AgentPreviewProps {
  nodes: CustomNode[]
}

export default function AgentPreview({ nodes }: AgentPreviewProps) {
  const agentConfig = useAgentConfig(nodes)
  const [activeTab, setActiveTab] = useState<'preview' | 'test'>('preview')
  const [showFullscreen, setShowFullscreen] = useState(false)

  if (!agentConfig) {
    return (
      <div className="bg-black/90 p-4">
        <p className="text-green-400/60 font-mono text-sm">Configure agent to see preview</p>
      </div>
    )
  }

  const hasComponents = agentConfig.toolNames.length > 0 || 
    agentConfig.skillIds.length > 0 || 
    agentConfig.ragFolderId || 
    agentConfig.mcpServers.length > 0

  return (
    <div className="bg-black/90 flex flex-col" style={{ height: '300px', maxHeight: '300px' }}>
      <div className="flex border-b border-green-400/20">
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 px-3 py-2 text-xs font-mono transition-all ${
            activeTab === 'preview'
              ? 'text-green-400 border-b-2 border-green-400 bg-green-400/10'
              : 'text-green-400/60 hover:text-green-400/80'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => {
            setShowFullscreen(true)
          }}
          className="flex-1 px-3 py-2 text-xs font-mono transition-all text-green-400/60 hover:text-green-400/80 hover:bg-green-400/5"
        >
          🚀 Test (Fullscreen)
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'preview' ? (
          <div className="p-4">
            <h3 className="text-green-400 font-mono font-bold text-sm mb-3 uppercase tracking-wider">
              Agent Preview
            </h3>
            <div className="space-y-2 text-xs font-mono">
        <div>
          <span className="text-green-400/60">Name:</span>{' '}
          <span className="text-green-300">{agentConfig.name || 'Untitled'}</span>
        </div>
        {agentConfig.description && (
          <div>
            <span className="text-green-400/60">Description:</span>{' '}
            <span className="text-green-300/80 line-clamp-2">{agentConfig.description}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-green-400/60">Version:</span>{' '}
          <span className="text-green-300">{agentConfig.version}</span>
          <span className="text-green-400/30">|</span>
          <span className={`px-1.5 py-0.5 text-[10px] border ${
            agentConfig.enabled
              ? 'border-green-400/50 bg-green-400/10 text-green-400'
              : 'border-red-400/50 bg-red-400/10 text-red-400'
          }`}>
            {agentConfig.enabled ? 'Enabled' : 'Disabled'}
          </span>
          {agentConfig.useMemory && (
            <>
              <span className="text-green-400/30">|</span>
              <span className="px-1.5 py-0.5 text-[10px] border border-cyan-400/50 bg-cyan-400/10 text-cyan-400">
                Memory
              </span>
            </>
          )}
        </div>
        {hasComponents ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {agentConfig.toolNames.length > 0 && (
              <div className="px-2 py-1 border border-yellow-400/30 bg-yellow-400/10 rounded">
                <span className="text-yellow-400 text-[10px]">{agentConfig.toolNames.length} Tool{agentConfig.toolNames.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            {agentConfig.skillIds.length > 0 && (
              <div className="px-2 py-1 border border-purple-400/30 bg-purple-400/10 rounded">
                <span className="text-purple-400 text-[10px]">{agentConfig.skillIds.length} Skill{agentConfig.skillIds.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            {agentConfig.ragFolderId && (
              <div className="px-2 py-1 border border-cyan-400/30 bg-cyan-400/10 rounded">
                <span className="text-cyan-400 text-[10px]">RAG</span>
              </div>
            )}
            {agentConfig.mcpServers.length > 0 && (
              <div className="px-2 py-1 border border-blue-400/30 bg-blue-400/10 rounded">
                <span className="text-blue-400 text-[10px]">{agentConfig.mcpServers.length} MCP</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-green-400/40 text-[10px] mt-2 italic">
            No components configured
          </div>
        )}
        {(agentConfig as any).isPublic || (agentConfig as any).isExportable !== false ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {(agentConfig as any).isPublic && (
              <span className="px-1.5 py-0.5 text-[10px] border border-blue-400/50 bg-blue-400/10 text-blue-400 font-mono">
                Public
              </span>
            )}
            {(agentConfig as any).isExportable !== false && (
              <span className="px-1.5 py-0.5 text-[10px] border border-green-400/50 bg-green-400/10 text-green-400 font-mono">
                Exportable
              </span>
            )}
            {(agentConfig as any).category && (
              <span className="px-1.5 py-0.5 text-[10px] border border-purple-400/50 bg-purple-400/10 text-purple-400 font-mono">
                {(agentConfig as any).category}
              </span>
            )}
          </div>
        ) : null}
        <div className="mt-3 pt-3 border-t border-green-400/20">
          <div className="text-green-400/60 mb-1 text-[10px]">Prompt Preview:</div>
          <div className="text-green-300/60 text-[10px] line-clamp-4 break-words">
            {agentConfig.prompt || 'No prompt configured'}
          </div>
        </div>
            </div>
          </div>
        ) : (
          <div className="p-4 flex items-center justify-center h-full">
            <button
              onClick={() => setShowFullscreen(true)}
              className="px-6 py-3 border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-mono text-sm font-bold"
            >
              🚀 Open Fullscreen Test Console
            </button>
          </div>
        )}
      </div>
      
      {showFullscreen && (
        <FullscreenTest nodes={nodes} onClose={() => setShowFullscreen(false)} />
      )}
    </div>
  )
}

