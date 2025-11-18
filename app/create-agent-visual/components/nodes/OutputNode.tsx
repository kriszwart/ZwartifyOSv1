"use client"

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import type { OutputNodeData } from '../../types'

function OutputNode({ data, selected }: NodeProps<any>) {
  const nodeData = data as OutputNodeData
  const config = nodeData.agentConfig
  const toolCount = config.toolNames?.length || 0
  const skillCount = config.skillIds?.length || 0

  return (
    <div
      className={`px-5 py-4 bg-gradient-to-br from-black to-gray-900 border-2 rounded-xl min-w-[300px] transition-all duration-300 ${
        selected
          ? 'border-green-400 shadow-[0_0_30px_rgba(0,255,0,0.4)] scale-105'
          : 'border-green-400/50 hover:border-green-400/80 hover:shadow-[0_0_15px_rgba(0,255,0,0.2)]'
      }`}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-400/20">
        <div className="text-green-400 text-xl filter drop-shadow-[0_0_8px_rgba(0,255,0,0.6)]">🚀</div>
        <div className="text-green-400 font-mono font-bold text-sm tracking-wider">AGENT OUTPUT</div>
      </div>
      <div className="space-y-2 text-xs font-mono">
        <div className="text-green-300/90">
          <span className="text-green-400/70 font-semibold">Name:</span>{' '}
          <span className="text-green-300 font-medium">{config.name || 'Untitled Agent'}</span>
        </div>
        {config.description && (
          <div className="text-green-300/70 text-[11px] leading-relaxed line-clamp-2">
            {config.description}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-green-400/10">
          {toolCount > 0 && (
            <span className="px-2.5 py-1 text-[10px] font-semibold border border-yellow-400/60 bg-yellow-400/15 text-yellow-400 rounded-md shadow-[0_0_8px_rgba(255,255,0,0.2)]">
              {toolCount} tool{toolCount !== 1 ? 's' : ''}
            </span>
          )}
          {skillCount > 0 && (
            <span className="px-2.5 py-1 text-[10px] font-semibold border border-purple-400/60 bg-purple-400/15 text-purple-400 rounded-md shadow-[0_0_8px_rgba(168,85,247,0.2)]">
              {skillCount} skill{skillCount !== 1 ? 's' : ''}
            </span>
          )}
          {config.ragFolderId && (
            <span className="px-2.5 py-1 text-[10px] font-semibold border border-cyan-400/60 bg-cyan-400/15 text-cyan-400 rounded-md shadow-[0_0_8px_rgba(34,211,238,0.2)]">
              📚 RAG
            </span>
          )}
          {config.mcpServers?.length > 0 && (
            <span className="px-2.5 py-1 text-[10px] font-semibold border border-blue-400/60 bg-blue-400/15 text-blue-400 rounded-md shadow-[0_0_8px_rgba(96,165,250,0.2)]">
              🌐 {config.mcpServers.length} MCP
            </span>
          )}
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-green-400 border-2 border-black hover:bg-green-300 hover:scale-125 hover:w-5 hover:h-5 transition-all cursor-crosshair handle-pulse"
        style={{ 
          zIndex: 10,
          boxShadow: '0 0 8px rgba(0, 255, 0, 0.6)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.animation = 'handlePulse 1s ease-in-out infinite'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.animation = ''
        }}
        title="Connect from: Tools, Skills, RAG, MCP"
      />
    </div>
  )
}

export default memo(OutputNode)

