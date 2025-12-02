import { useState, useCallback, useMemo, useRef } from 'react'
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

interface HistoryState {
  nodes: Node<CustomNodeData>[]
  edges: Edge[]
}

const MAX_HISTORY = 50

export function useNodeBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [clipboard, setClipboard] = useState<{ nodes: Node<CustomNodeData>[]; edges: Edge[] } | null>(null)
  
  // History management
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: initialNodes, edges: initialEdges }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const isUndoRedoRef = useRef(false)
  
  // Save state to history
  const saveToHistory = useCallback((newNodes: Node<CustomNodeData>[], newEdges: Edge[]) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false
      return
    }
    
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ nodes: JSON.parse(JSON.stringify(newNodes)), edges: JSON.parse(JSON.stringify(newEdges)) })
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
        return newHistory
      }
      
      return newHistory
    })
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [historyIndex])
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const state = history[newIndex]
      isUndoRedoRef.current = true
      setNodes(state.nodes)
      setEdges(state.edges)
      setHistoryIndex(newIndex)
    }
  }, [history, historyIndex, setNodes, setEdges])
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const state = history[newIndex]
      isUndoRedoRef.current = true
      setNodes(state.nodes)
      setEdges(state.edges)
      setHistoryIndex(newIndex)
    }
  }, [history, historyIndex, setNodes, setEdges])
  
  // Check if undo/redo is available
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  // Wrapped onNodesChange to track history
  const wrappedOnNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes)
    // Save to history after a short delay to batch changes
    setTimeout(() => {
      setNodes((currentNodes) => {
        setEdges((currentEdges) => {
          saveToHistory(currentNodes, currentEdges)
          return currentEdges
        })
        return currentNodes
      })
    }, 100)
  }, [onNodesChange, setNodes, setEdges, saveToHistory])
  
  // Wrapped onEdgesChange to track history
  const wrappedOnEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes)
    setTimeout(() => {
      setNodes((currentNodes) => {
        setEdges((currentEdges) => {
          saveToHistory(currentNodes, currentEdges)
          return currentEdges
        })
        return currentNodes
      })
    }, 100)
  }, [onEdgesChange, setNodes, setEdges, saveToHistory])

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge({ ...params, type: 'custom' } as Edge, eds)
        setTimeout(() => {
          setNodes((currentNodes) => {
            saveToHistory(currentNodes, newEdges)
            return currentNodes
          })
        }, 100)
        return newEdges
      })
    },
    [setEdges, setNodes, saveToHistory]
  )

  const addNode = useCallback((type: string, position: { x: number; y: number }, data?: Partial<CustomNodeData>) => {
    const id = `${type}-${Date.now()}`
    const newNode: Node<CustomNodeData> = {
      id,
      type,
      position,
      data: data as CustomNodeData,
    }
    setNodes((nds) => {
      const newNodes = [...nds, newNode]
      setTimeout(() => {
        setEdges((currentEdges) => {
          saveToHistory(newNodes, currentEdges)
          return currentEdges
        })
      }, 100)
      return newNodes
    })
    return id
  }, [setNodes, setEdges, saveToHistory])

  const updateNodeData = useCallback((nodeId: string, data: Partial<CustomNodeData>) => {
    setNodes((nds) => {
      const newNodes = nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } as CustomNodeData }
          : node
      )
      setTimeout(() => {
        setEdges((currentEdges) => {
          saveToHistory(newNodes, currentEdges)
          return currentEdges
        })
      }, 100)
      return newNodes
    })
  }, [setNodes, setEdges, saveToHistory])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => {
      const newNodes = nds.filter((node) => node.id !== nodeId)
      setEdges((eds) => {
        const newEdges = eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        setTimeout(() => {
          saveToHistory(newNodes, newEdges)
        }, 100)
        return newEdges
      })
      return newNodes
    })
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
  }, [setNodes, setEdges, selectedNodeId, saveToHistory])

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId) || null
  }, [nodes, selectedNodeId])

  const loadNodes = useCallback((newNodes: Node<CustomNodeData>[], newEdges: Edge[]) => {
    setNodes(newNodes)
    setEdges(newEdges)
    setSelectedNodeId(null)
    // Reset history when loading
    setHistory([{ nodes: JSON.parse(JSON.stringify(newNodes)), edges: JSON.parse(JSON.stringify(newEdges)) }])
    setHistoryIndex(0)
  }, [setNodes, setEdges])

  const clearCanvas = useCallback(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
    setSelectedNodeId(null)
    // Reset history when clearing
    setHistory([{ nodes: initialNodes, edges: initialEdges }])
    setHistoryIndex(0)
  }, [setNodes, setEdges])

  // Auto-layout function
  const autoLayout = useCallback(() => {
    const { autoLayoutNodes } = require('../utils/autoLayout')
    const arrangedNodes = autoLayoutNodes(nodes, edges)
    setNodes(arrangedNodes)
    setTimeout(() => {
      setEdges((currentEdges) => {
        saveToHistory(arrangedNodes, currentEdges)
        return currentEdges
      })
    }, 100)
  }, [nodes, edges, setNodes, setEdges, saveToHistory])

  // Copy selected nodes
  const copyNodes = useCallback(() => {
    if (selectedNodeIds.size === 0 && selectedNodeId) {
      // Copy single selected node
      const node = nodes.find(n => n.id === selectedNodeId)
      if (node) {
        const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id)
        setClipboard({ nodes: [node], edges: connectedEdges })
      }
    } else if (selectedNodeIds.size > 0) {
      // Copy multiple selected nodes
      const selectedNodes = nodes.filter(n => selectedNodeIds.has(n.id))
      const selectedNodeIdSet = new Set(selectedNodes.map(n => n.id))
      const connectedEdges = edges.filter(e => 
        selectedNodeIdSet.has(e.source) && selectedNodeIdSet.has(e.target)
      )
      setClipboard({ nodes: selectedNodes, edges: connectedEdges })
    }
  }, [selectedNodeId, selectedNodeIds, nodes, edges])

  // Paste nodes
  const pasteNodes = useCallback(() => {
    if (!clipboard || clipboard.nodes.length === 0) return

    const offset = 50
    const nodeIdMap = new Map<string, string>()

    // Create new nodes with offset
    const newNodes = clipboard.nodes.map((node, index) => {
      const newId = `${node.type}-${Date.now()}-${index}`
      nodeIdMap.set(node.id, newId)
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
      }
    })

    // Create new edges with updated IDs
    const newEdges = clipboard.edges.map((edge, index) => ({
      ...edge,
      id: `edge-${Date.now()}-${index}`,
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target,
    }))

    setNodes((nds) => {
      const updatedNodes = [...nds, ...newNodes]
      setTimeout(() => {
        setEdges((eds) => {
          const updatedEdges = [...eds, ...newEdges]
          saveToHistory(updatedNodes, updatedEdges)
          return updatedEdges
        })
      }, 100)
      return updatedNodes
    })

    // Select pasted nodes
    setSelectedNodeIds(new Set(newNodes.map(n => n.id)))
    if (newNodes.length === 1) {
      setSelectedNodeId(newNodes[0].id)
    }
  }, [clipboard, setNodes, setEdges, saveToHistory])

  // Duplicate selected nodes
  const duplicateNodes = useCallback(() => {
    copyNodes()
    setTimeout(() => pasteNodes(), 50)
  }, [copyNodes, pasteNodes])

  // Select all nodes
  const selectAll = useCallback(() => {
    setSelectedNodeIds(new Set(nodes.map(n => n.id)))
  }, [nodes])

  // Deselect all
  const deselectAll = useCallback(() => {
    setSelectedNodeIds(new Set())
    setSelectedNodeId(null)
  }, [])

  return {
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    selectedNodeIds,
    setSelectedNodeId,
    setSelectedNodeIds,
    onNodesChange: wrappedOnNodesChange,
    onEdgesChange: wrappedOnEdgesChange,
    onConnect,
    addNode,
    updateNodeData,
    deleteNode,
    loadNodes,
    clearCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
    autoLayout,
    copyNodes,
    pasteNodes,
    duplicateNodes,
    selectAll,
    deselectAll,
  }
}

