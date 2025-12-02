"use client"

import { ConnectionLineComponent, getBezierPath, Position, useReactFlow } from '@xyflow/react'
import { useMemo } from 'react'

// Magnetic snap distance in pixels
const SNAP_DISTANCE = 30

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

  // Magnetic snapping: find closest valid target handle
  const { snappedX, snappedY, isSnapped, snapTarget } = useMemo(() => {
    if (!fromNode) return { snappedX: toX, snappedY: toY, isSnapped: false, snapTarget: null }

    let closestDistance = Infinity
    let closestTarget: { x: number; y: number; node: any } | null = null

    // Find all valid target nodes
    const validTargets = nodes.filter(targetNode => {
      if (!targetNode || targetNode.id === fromNode.id) return false
      
      const sourceNode = nodes.find(n => n.id === fromNode.id)
      if (!sourceNode) return false

      // Check if connection would be valid
      if (sourceNode.type === 'agentConfig') {
        return ['tool', 'skill', 'rag', 'mcp'].includes(targetNode.type || '')
      }
      if (['tool', 'skill', 'rag', 'mcp'].includes(sourceNode.type || '')) {
        return targetNode.type === 'output'
      }
      return false
    })

    // Calculate distance to each valid target's left handle position
    validTargets.forEach(targetNode => {
      // Approximate handle position (left side of node)
      const handleX = targetNode.position.x
      const handleY = targetNode.position.y + (targetNode.height || 60) / 2
      
      const distance = Math.sqrt(
        Math.pow(toX - handleX, 2) + Math.pow(toY - handleY, 2)
      )

      if (distance < SNAP_DISTANCE && distance < closestDistance) {
        closestDistance = distance
        closestTarget = { x: handleX, y: handleY, node: targetNode }
      }
    })

    if (closestTarget) {
      return {
        snappedX: closestTarget.x,
        snappedY: closestTarget.y,
        isSnapped: true,
        snapTarget: closestTarget.node,
      }
    }

    return { snappedX: toX, snappedY: toY, isSnapped: false, snapTarget: null }
  }, [fromNode, toX, toY, nodes])

  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: snappedX,
    targetY: snappedY,
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
      {/* Magnetic snap indicator */}
      {isSnapped && isValid && (
        <circle
          cx={snappedX}
          cy={snappedY}
          r={14}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
          strokeDasharray="5 5"
          opacity={0.7}
          style={{
            animation: 'magneticSnap 1s ease-in-out infinite',
            filter: `drop-shadow(0 0 10px ${lineColor})`,
          }}
        />
      )}
      <circle
        cx={snappedX}
        cy={snappedY}
        r={isValid ? (isSnapped ? 6 : 4) : 5}
        fill={lineColor}
        style={{
          filter: isValid 
            ? `drop-shadow(0 0 ${isSnapped ? '12px' : '6px'} ${lineColor})`
            : `drop-shadow(0 0 8px rgba(239, 68, 68, 1))`,
          animation: isValid 
            ? (isSnapped ? 'pulse 0.8s ease-in-out infinite' : 'none')
            : 'pulse 0.5s ease-in-out infinite',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </g>
  )
}

export default CustomConnectionLine

