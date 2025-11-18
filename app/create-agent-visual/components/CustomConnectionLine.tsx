"use client"

import { ConnectionLineComponent, getBezierPath, Position, useReactFlow } from '@xyflow/react'
import { useMemo } from 'react'

const CustomConnectionLine: ConnectionLineComponent = ({ fromX, fromY, toX, toY, fromNode, toNode }) => {
  const { getNodes } = useReactFlow()
  const nodes = getNodes()

  // Determine if connection would be valid
  const isValid = useMemo(() => {
    if (!fromNode || !toNode) return true // Default to valid during drag
    
    const sourceNode = nodes.find((n) => n.id === fromNode.id)
    const targetNode = nodes.find((n) => n.id === toNode.id)

    if (!sourceNode || !targetNode) return true

    // AgentConfig can connect to Tools, Skills, RAG, MCP
    if (sourceNode.type === 'agentConfig') {
      return ['tool', 'skill', 'rag', 'mcp'].includes(targetNode.type || '')
    }

    // Tools, Skills, RAG, MCP can connect to Output
    if (['tool', 'skill', 'rag', 'mcp'].includes(sourceNode.type || '')) {
      return targetNode.type === 'output'
    }

    // Output cannot be a source
    if (sourceNode.type === 'output') {
      return false
    }

    return true
  }, [fromNode, toNode, nodes])

  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  })

  // Determine color based on source node type and validity
  const lineColor = useMemo(() => {
    if (!isValid) return '#ef4444' // Red for invalid
    
    if (!fromNode) return '#00ff00'
    
    const nodeType = fromNode.type
    const colorMap: Record<string, string> = {
      agentConfig: '#00ff00',
      tool: '#eab308',
      skill: '#a855f7',
      rag: '#06b6d4',
      mcp: '#60a5fa',
      output: '#00ff00',
    }
    
    return colorMap[nodeType || ''] || '#00ff00'
  }, [fromNode, isValid])

  return (
    <g>
      <path
        d={edgePath}
        fill="none"
        stroke={lineColor}
        strokeWidth={2.5}
        strokeDasharray={isValid ? '0' : '5 5'}
        style={{
          filter: isValid 
            ? `drop-shadow(0 0 4px ${lineColor}80)`
            : `drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))`,
          transition: 'all 0.2s ease',
          opacity: isValid ? 1 : 0.8,
        }}
      />
      <circle
        cx={toX}
        cy={toY}
        r={isValid ? 4 : 5}
        fill={lineColor}
        style={{
          filter: isValid 
            ? `drop-shadow(0 0 6px ${lineColor})`
            : `drop-shadow(0 0 8px rgba(239, 68, 68, 1))`,
          animation: isValid ? 'none' : 'pulse 0.5s ease-in-out infinite',
        }}
      />
    </g>
  )
}

export default CustomConnectionLine

