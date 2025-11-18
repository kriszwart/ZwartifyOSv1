"use client"

import { BaseEdge, EdgeProps, getBezierPath, useReactFlow } from '@xyflow/react'
import { useMemo } from 'react'

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  style = {},
  markerEnd,
  animated,
  selected,
}: EdgeProps) {
  const { getNode } = useReactFlow()
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Determine edge color based on source node type
  const edgeColor = useMemo(() => {
    if (!source) return '#00ff00' // Default green
    
    const sourceNode = getNode(source)
    if (!sourceNode) return '#00ff00'
    
    const nodeType = sourceNode.type
    const colorMap: Record<string, string> = {
      agentConfig: '#00ff00', // Green
      tool: '#eab308',         // Yellow
      skill: '#a855f7',       // Purple
      rag: '#06b6d4',         // Cyan
      mcp: '#60a5fa',         // Blue
      output: '#00ff00',      // Green
    }
    
    return colorMap[nodeType || ''] || '#00ff00'
  }, [source, getNode])

  // Convert hex to rgba for glow effect
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const glowColor = hexToRgba(edgeColor, 0.8)

  return (
    <g
      onDoubleClick={(e) => {
        e.stopPropagation()
        // Edge deletion will be handled by parent via onEdgesChange
      }}
      style={{ cursor: 'pointer' }}
    >
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: selected ? 3.5 : 2.5,
          filter: selected 
            ? `drop-shadow(0 0 10px ${glowColor})`
            : `drop-shadow(0 0 6px ${glowColor})`,
          transition: 'all 0.3s ease',
          opacity: selected ? 1 : 0.9,
          ...(animated ? { 
            strokeDasharray: '5 5',
            animation: 'edgeFlow 1s linear infinite',
          } : {}),
        }}
      />
    </g>
  )
}

