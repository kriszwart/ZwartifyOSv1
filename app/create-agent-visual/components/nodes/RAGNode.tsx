"use client"

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import type { RAGNodeData } from '../../types'

function RAGNode({ data, selected }: NodeProps<any>) {
  const nodeData = data as RAGNodeData
  return (
    <div
      className={`px-5 py-4 bg-gradient-to-br from-black to-gray-900 border-2 rounded-xl min-w-[260px] transition-all duration-300 ${
        selected
          ? 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] scale-105'
          : 'border-cyan-400/50 hover:border-cyan-400/80 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]'
      }`}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyan-400/20">
        <div className="text-cyan-400 text-xl filter drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">📚</div>
        <div className="text-cyan-400 font-mono font-bold text-sm tracking-wider">RAG</div>
      </div>
      <div className="space-y-2 text-xs font-mono">
        <div className="text-cyan-300 font-medium">
          {nodeData.ragFolderName || 'Select folder'}
        </div>
        {nodeData.enabled === false && (
          <div className="text-red-400/80 text-[10px] mt-2 px-2 py-1 border border-red-400/40 bg-red-400/10 rounded">
            ✗ Disabled
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-cyan-400 border-2 border-black hover:bg-cyan-300 hover:scale-125 hover:w-5 hover:h-5 transition-all cursor-crosshair handle-pulse"
        style={{ 
          zIndex: 10,
          boxShadow: '0 0 8px rgba(6, 182, 212, 0.6)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.animation = 'handlePulse 1s ease-in-out infinite'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.animation = ''
        }}
        title="Connect from: Agent Config"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-cyan-400 border-2 border-black hover:bg-cyan-300 hover:scale-125 hover:w-5 hover:h-5 transition-all cursor-crosshair handle-pulse"
        style={{ 
          zIndex: 10,
          boxShadow: '0 0 8px rgba(6, 182, 212, 0.6)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.animation = 'handlePulse 1s ease-in-out infinite'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.animation = ''
        }}
        title="Connect to: Output"
      />
    </div>
  )
}

export default memo(RAGNode)

