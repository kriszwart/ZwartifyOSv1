"use client"

import { BaseEdge, EdgeProps, getBezierPath, useReactFlow } from '@xyflow/react'
import { useMemo, useState } from 'react'

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
  const [isHovered, setIsHovered] = useState(false)
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
    if (!source) return '#22c55e' // Default green
    
    const sourceNode = getNode(source)
    if (!sourceNode) return '#22c55e'
    
    const nodeType = sourceNode.type
    const colorMap: Record<string, string> = {
      agentConfig: '#22c55e', // Green
      tool: '#eab308',         // Yellow
      skill: '#a855f7',       // Purple
      rag: '#06b6d4',         // Cyan
      mcp: '#60a5fa',         // Blue
      output: '#22c55e',      // Green
    }
    
    return colorMap[nodeType || ''] || '#22c55e'
  }, [source, getNode])

  // Convert hex to rgba for glow effect
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const glowColor = hexToRgba(edgeColor, 0.8)
  const isActive = selected || isHovered

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={(e) => {
        e.stopPropagation()
        // Edge deletion will be handled by parent via onEdgesChange
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Glow layer for depth */}
      <path
        d={edgePath}
        fill="none"
        stroke={edgeColor}
        strokeWidth={isActive ? 8 : 6}
        strokeLinecap="round"
        style={{
          filter: `blur(6px)`,
          opacity: isActive ? 0.4 : 0.2,
          transition: 'all 0.3s ease',
        }}
      />
      
      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: isActive ? 4 : 2.5,
          filter: isActive
            ? `drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 24px ${glowColor}60)`
            : `drop-shadow(0 0 6px ${glowColor})`,
          transition: 'all 0.3s ease',
          opacity: isActive ? 1 : 0.85,
        }}
      />
      
      {/* Animated flow particles */}
      {(isActive || animated) && (
        <>
          <circle r="4" fill={edgeColor} opacity="0.9">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
          <circle r="3" fill={edgeColor} opacity="0.6">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={edgePath}
              begin="0.5s"
            />
          </circle>
          <circle r="2" fill={edgeColor} opacity="0.4">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={edgePath}
              begin="1s"
            />
          </circle>
        </>
      )}
      
      {/* CSS for edge flow animation */}
      <style jsx>{`
        @keyframes edgeFlow {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: 20;
          }
        }
      `}</style>
    </g>
  )
}

