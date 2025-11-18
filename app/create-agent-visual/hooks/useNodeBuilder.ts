import { useState, useCallback, useMemo } from 'react'
import { Node, Edge, addEdge, Connection, useNodesState, useEdgesState } from '@xyflow/react'
import type { CustomNodeData, AgentConfigNodeData } from '../types'

const initialNodes: Node<CustomNodeData>[] = [
  {
    id: 'agent-config-1',
    type: 'agentConfig',
    position: { x: 250, y: 100 },
    data: {
      name: '',
      description: '',
      prompt: '',
      enabled: true,
      useMemory: true,
      version: '1.0.0',
    } as AgentConfigNodeData,
  },
]

const initialEdges: Edge[] = []

export function useNodeBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'custom' } as Edge, eds))
    },
    [setEdges]
  )

  const addNode = useCallback((type: string, position: { x: number; y: number }, data?: Partial<CustomNodeData>) => {
    const id = `${type}-${Date.now()}`
    const newNode: Node<CustomNodeData> = {
      id,
      type,
      position,
      data: data as CustomNodeData,
    }
    setNodes((nds) => [...nds, newNode])
    return id
  }, [setNodes])

  const updateNodeData = useCallback((nodeId: string, data: Partial<CustomNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } as CustomNodeData }
          : node
      )
    )
  }, [setNodes])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
  }, [setNodes, setEdges, selectedNodeId])

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId) || null
  }, [nodes, selectedNodeId])

  const loadNodes = useCallback((newNodes: Node<CustomNodeData>[], newEdges: Edge[]) => {
    setNodes(newNodes)
    setEdges(newEdges)
    setSelectedNodeId(null)
    // Reset fit view flag when loading new nodes
  }, [setNodes, setEdges])

  const clearCanvas = useCallback(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
    setSelectedNodeId(null)
  }, [setNodes, setEdges])

  return {
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    setSelectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeData,
    deleteNode,
    loadNodes,
    clearCanvas,
  }
}

