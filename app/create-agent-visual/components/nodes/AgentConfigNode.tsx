"use client"

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import type { AgentConfigNodeData } from '../../types'

function AgentConfigNode({ data, selected }: NodeProps<any>) {
  const nodeData = data as AgentConfigNodeData
  return (
    <div
      className={`px-5 py-4 bg-gradient-to-br from-black to-gray-900 border-2 rounded-xl min-w-[300px] transition-all duration-300 ${
        selected
          ? 'border-green-400 shadow-[0_0_30px_rgba(0,255,0,0.4)] scale-105'
          : 'border-green-400/50 hover:border-green-400/80 hover:shadow-[0_0_15px_rgba(0,255,0,0.2)]'
      }`}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-400/20">
        <div className="text-green-400 text-xl filter drop-shadow-[0_0_8px_rgba(0,255,0,0.6)]">⚙️</div>
        <div className="text-green-400 font-mono font-bold text-sm tracking-wider">AGENT CONFIG</div>
      </div>
      <div className="space-y-2 text-xs font-mono">
        <div className="text-green-300/90">
          <span className="text-green-400/70 font-semibold">Name:</span>{' '}
          <span className="text-green-300 font-medium">{nodeData.name || 'Untitled'}</span>
        </div>
        {nodeData.description && (
          <div className="text-green-300/70 text-[11px] leading-relaxed line-clamp-2">
            {nodeData.description}
          </div>
        )}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-green-400/10">
          <span className={`px-2.5 py-1 text-[10px] font-semibold border rounded-md transition-all ${
            nodeData.enabled
              ? 'border-green-400/60 bg-green-400/15 text-green-400 shadow-[0_0_8px_rgba(0,255,0,0.2)]'
              : 'border-red-400/60 bg-red-400/15 text-red-400'
          }`}>
            {nodeData.enabled ? '✓ Enabled' : '✗ Disabled'}
          </span>
          {nodeData.useMemory && (
            <span className="px-2.5 py-1 text-[10px] font-semibold border border-cyan-400/60 bg-cyan-400/15 text-cyan-400 rounded-md shadow-[0_0_8px_rgba(34,211,238,0.2)]">
              🧠 Memory
            </span>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
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
        title="Connect to: Tools, Skills, RAG, MCP"
      />
    </div>
  )
}

export default memo(AgentConfigNode)

