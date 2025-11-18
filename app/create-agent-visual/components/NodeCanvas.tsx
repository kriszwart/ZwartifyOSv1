"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  NodeTypes,
  EdgeTypes,
  Connection,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import AgentConfigNode from './nodes/AgentConfigNode'
import ToolNode from './nodes/ToolNode'
import SkillNode from './nodes/SkillNode'
import RAGNode from './nodes/RAGNode'
import MCPNode from './nodes/MCPNode'
import OutputNode from './nodes/OutputNode'
import CustomEdgeComponent from './CustomEdge'
import CustomConnectionLine from './CustomConnectionLine'
import type { CustomNode, CustomEdge } from '../types'

const nodeTypes: NodeTypes = {
  agentConfig: AgentConfigNode as any,
  tool: ToolNode as any,
  skill: SkillNode as any,
  rag: RAGNode as any,
  mcp: MCPNode as any,
  output: OutputNode as any,
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdgeComponent,
}

interface NodeCanvasProps {
  nodes: CustomNode[]
  edges: CustomEdge[]
  onNodesChange: (changes: any) => void
  onEdgesChange: (changes: any) => void
  onConnect: (connection: Connection) => void
  onNodeClick?: (event: React.MouseEvent, node: CustomNode) => void
}

// Connection validation rules
const isValidConnection = (connection: Connection, nodes: CustomNode[]): boolean => {
  const sourceNode = nodes.find((n) => n.id === connection.source)
  const targetNode = nodes.find((n) => n.id === connection.target)

  if (!sourceNode || !targetNode) return false

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

  return false
}

function NodeCanvasInner({ nodes }: { nodes: CustomNode[] }) {
  const { fitView } = useReactFlow()
  const prevNodesLength = useRef(0)
  const hasFittedRef = useRef(false)

  // Auto-fit view when nodes are loaded (only once per load)
  useEffect(() => {
    if (nodes.length > prevNodesLength.current && nodes.length > 1 && !hasFittedRef.current) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 500, minZoom: 0.3, maxZoom: 1.5 })
        hasFittedRef.current = true
      }, 400)
      return () => clearTimeout(timer)
    }
    prevNodesLength.current = nodes.length
  }, [nodes.length, fitView])
  
  // Also fit view on window resize
  useEffect(() => {
    const handleResize = () => {
      if (nodes.length > 0) {
        fitView({ padding: 0.2, duration: 300, minZoom: 0.3, maxZoom: 1.5 })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [nodes.length, fitView])

  // Reset hasFitted when nodes are cleared
  useEffect(() => {
    if (nodes.length <= 1) {
      hasFittedRef.current = false
    }
  }, [nodes.length])

  return (
    <>
      <Background color="#00ff00" gap={16} size={1} />
      <Controls className="bg-black/80 border border-green-400/30 rounded" />
      <MiniMap
        nodeColor={(node) => {
          const colors: Record<string, string> = {
            agentConfig: '#00ff00',
            tool: '#eab308',
            skill: '#a855f7',
            rag: '#06b6d4',
            mcp: '#60a5fa',
            output: '#00ff00',
          }
          return colors[node.type || ''] || '#00ff00'
        }}
        className="bg-black/80 border border-green-400/30 rounded"
        maskColor="rgba(0, 0, 0, 0.6)"
      />
    </>
  )
}

export default function NodeCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
}: NodeCanvasProps) {
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [connectionFeedback, setConnectionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: any) => {
      onNodeClick?.(event, node as CustomNode)
    },
    [onNodeClick]
  )

  const getConnectionErrorMessage = useCallback((connection: Connection): string => {
    const sourceNode = nodes.find((n) => n.id === connection.source)
    const targetNode = nodes.find((n) => n.id === connection.target)

    if (!sourceNode || !targetNode) {
      return 'Invalid connection: Source or target node not found'
    }

    if (sourceNode.type === 'agentConfig') {
      return `Invalid connection: AgentConfig can only connect to Tools, Skills, RAG, or MCP nodes (not ${targetNode.type})`
    }

    if (['tool', 'skill', 'rag', 'mcp'].includes(sourceNode.type || '')) {
      return `Invalid connection: ${sourceNode.type} can only connect to Output node (not ${targetNode.type})`
    }

    if (sourceNode.type === 'output') {
      return 'Invalid connection: Output node cannot be a source'
    }

    return 'Invalid connection: These node types cannot be connected'
  }, [nodes])

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (isValidConnection(connection, nodes)) {
        onConnect(connection)
        setConnectionFeedback({ type: 'success', message: 'Connection created!' })
        setTimeout(() => setConnectionFeedback(null), 2000)
      } else {
        const errorMessage = getConnectionErrorMessage(connection)
        setConnectionFeedback({ type: 'error', message: errorMessage })
        setTimeout(() => setConnectionFeedback(null), 3000)
      }
      setConnectingFrom(null)
    },
    [nodes, onConnect, getConnectionErrorMessage]
  )

  const handleConnectStart = useCallback(
    (event: MouseEvent | TouchEvent, { nodeId }: { nodeId: string | null }) => {
      if (nodeId) {
        setConnectingFrom(nodeId)
      }
    },
    []
  )

  const handleConnectEnd = useCallback(() => {
    setConnectingFrom(null)
  }, [])

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.stopPropagation()
      // Edge selection is handled automatically by React Flow
    },
    []
  )

  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      // Handle edge deletion confirmation
      const deleteChanges = changes.filter((change) => change.type === 'remove')
      if (deleteChanges.length > 0) {
        const edgeIds = deleteChanges.map((change) => change.id)
        const shouldDelete = edgeIds.length === 1
          ? confirm(`Delete connection?`)
          : confirm(`Delete ${edgeIds.length} connections?`)
        
        if (shouldDelete) {
          onEdgesChange(changes)
        } else {
          // Filter out delete changes if user cancelled
          onEdgesChange(changes.filter((change) => change.type !== 'remove'))
        }
      } else {
        onEdgesChange(changes)
      }
    },
    [onEdgesChange]
  )

  // Use custom connection line component for dynamic styling
  const ConnectionLine = useMemo(() => CustomConnectionLine, [])

  const defaultEdgeOptions = {
    type: 'custom',
    animated: true,
    style: {
      stroke: '#00ff00',
      strokeWidth: 2.5,
    },
  }

  return (
    <div className="w-full h-full bg-black relative" style={{ height: '100%', width: '100%' }}>
      {/* Connection Feedback Overlay */}
      {connectionFeedback && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg font-mono text-xs transition-all max-w-md ${
            connectionFeedback.type === 'success'
              ? 'bg-green-400/20 border-2 border-green-400 text-green-400 shadow-[0_0_20px_rgba(0,255,0,0.3)]'
              : 'bg-red-400/20 border-2 border-red-400 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse'
          }`}
          style={{ 
            animation: connectionFeedback.type === 'error' ? 'pulse 0.5s ease-in-out 3' : 'none',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{connectionFeedback.type === 'success' ? '✓' : '✗'}</span>
            <span className="break-words">{connectionFeedback.message}</span>
          </div>
        </div>
      )}

      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes as any}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onEdgeClick={handleEdgeClick}
          onConnect={handleConnect}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          connectionLineComponent={ConnectionLine}
          isValidConnection={(connection: Connection | any) => {
            // React Flow may pass Connection or Edge, ensure we have source and target
            if (connection.source && connection.target) {
              return isValidConnection(connection as Connection, nodes)
            }
            return true
          }}
          fitView
          fitViewOptions={{ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 }}
          className="bg-black"
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Meta', 'Control']}
        >
          <NodeCanvasInner nodes={nodes} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}

