import { Node, Edge } from '@xyflow/react'
import type { CustomNodeData } from '../types'

interface LayoutOptions {
  startX?: number
  startY?: number
  horizontalSpacing?: number
  verticalSpacing?: number
  nodeWidth?: number
  nodeHeight?: number
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  startX: 150,
  startY: 200,
  horizontalSpacing: 550,
  verticalSpacing: 140,
  nodeWidth: 300,
  nodeHeight: 120,
}

/**
 * Auto-arrange nodes in a hierarchical layout:
 * AgentConfig (left) → Components (middle) → Output (right)
 */
export function autoLayoutNodes(
  nodes: Node<CustomNodeData>[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node<CustomNodeData>[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  if (nodes.length === 0) return nodes

  // Find AgentConfig node
  const agentConfigNode = nodes.find(n => n.type === 'agentConfig')
  if (!agentConfigNode) return nodes

  // Find Output node
  const outputNode = nodes.find(n => n.type === 'output')

  // Find component nodes (tools, skills, RAG, MCP)
  const componentNodes = nodes.filter(n => 
    ['tool', 'skill', 'rag', 'mcp'].includes(n.type || '')
  )

  // Group components by type for better organization
  const tools = componentNodes.filter(n => n.type === 'tool')
  const skills = componentNodes.filter(n => n.type === 'skill')
  const rags = componentNodes.filter(n => n.type === 'rag')
  const mcps = componentNodes.filter(n => n.type === 'mcp')

  const allComponents = [...tools, ...skills, ...rags, ...mcps]

  // Calculate positions
  const arrangedNodes: Node<CustomNodeData>[] = []

  // Position AgentConfig (left column)
  if (agentConfigNode) {
    arrangedNodes.push({
      ...agentConfigNode,
      position: { x: opts.startX, y: opts.startY },
    })
  }

  // Position Components (middle column)
  const componentX = opts.startX + opts.horizontalSpacing
  let componentY = opts.startY

  // Group components with spacing between types
  const componentGroups = [
    { nodes: tools, label: 'Tools' },
    { nodes: skills, label: 'Skills' },
    { nodes: rags, label: 'RAG' },
    { nodes: mcps, label: 'MCP' },
  ].filter(group => group.nodes.length > 0)

  componentGroups.forEach((group, groupIndex) => {
    group.nodes.forEach((node, index) => {
      arrangedNodes.push({
        ...node,
        position: {
          x: componentX,
          y: componentY + index * opts.verticalSpacing,
        },
      })
    })
    // Add extra spacing between groups
    componentY += group.nodes.length * opts.verticalSpacing + 40
  })

  // Position Output (right column)
  if (outputNode) {
    const outputX = componentX + opts.horizontalSpacing
    // Center output vertically with components
    const totalComponentHeight = allComponents.length * opts.verticalSpacing
    const outputY = Math.max(
      opts.startY,
      opts.startY + (totalComponentHeight - opts.nodeHeight) / 2
    )
    
    arrangedNodes.push({
      ...outputNode,
      position: { x: outputX, y: outputY },
    })
  }

  // Preserve any nodes not in the standard layout
  const arrangedIds = new Set(arrangedNodes.map(n => n.id))
  nodes.forEach(node => {
    if (!arrangedIds.has(node.id)) {
      arrangedNodes.push(node)
    }
  })

  return arrangedNodes
}

/**
 * Calculate optimal layout based on node connections
 */
export function calculateOptimalLayout(
  nodes: Node<CustomNodeData>[],
  edges: Edge[]
): Node<CustomNodeData>[] {
  // Build connection graph
  const connections = new Map<string, string[]>()
  const reverseConnections = new Map<string, string[]>()

  edges.forEach(edge => {
    if (!connections.has(edge.source)) {
      connections.set(edge.source, [])
    }
    connections.get(edge.source)!.push(edge.target)

    if (!reverseConnections.has(edge.target)) {
      reverseConnections.set(edge.target, [])
    }
    reverseConnections.get(edge.target)!.push(edge.source)
  })

  // Find root nodes (no incoming edges)
  const rootNodes = nodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  )

  // Find leaf nodes (no outgoing edges)
  const leafNodes = nodes.filter(node =>
    !edges.some(edge => edge.source === node.id)
  )

  // Use hierarchical layout
  return autoLayoutNodes(nodes, edges)
}




