"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Link from "next/link"

interface AgentNode {
  id: string
  name: string
  level: number
  parent?: string
  children: string[]
  isActive: boolean
  createdAt?: string
  description?: string
  // Calculated layout positions
  x?: number
  y?: number
}

interface LineageResponse {
  success: boolean
  nodes: Array<{
    id: string
    name: string
    description?: string
    level: number
    parent?: string
    children: string[]
    createdAt: string
    createdByAgentId: string | null
    isRoot: boolean
  }>
  totalAgents: number
  agentsWithLineage: number
  maxDepth: number
}

interface OuroborosVisualizationProps {
  animated?: boolean
  showLabels?: boolean
  variant?: 'compact' | 'full'
  useRealData?: boolean
}

// Get icon for agent type
function getAgentIcon(name: string, id: string): string {
  if (id === 'user') return '👤'
  const lower = name.toLowerCase()
  if (lower.includes('g-sac') || lower.includes('gsac')) return '🎯'
  if (lower.includes('factory')) return '🏭'
  if (lower.includes('sales')) return '💼'
  if (lower.includes('support')) return '🎧'
  if (lower.includes('content')) return '✍️'
  if (lower.includes('data') || lower.includes('analytics')) return '📊'
  if (lower.includes('code') || lower.includes('dev')) return '💻'
  if (lower.includes('research')) return '🔬'
  if (lower.includes('email') || lower.includes('outreach')) return '📧'
  return '🤖'
}

// Get gradient colors for level
function getLevelColors(level: number): { from: string; to: string; glow: string } {
  const colors = [
    { from: '#22d3ee', to: '#06b6d4', glow: 'rgba(34, 211, 238, 0.5)' },   // cyan
    { from: '#a855f7', to: '#9333ea', glow: 'rgba(168, 85, 247, 0.5)' },   // purple
    { from: '#22c55e', to: '#16a34a', glow: 'rgba(34, 197, 94, 0.5)' },    // green
    { from: '#f59e0b', to: '#d97706', glow: 'rgba(245, 158, 11, 0.5)' },   // amber
    { from: '#ec4899', to: '#db2777', glow: 'rgba(236, 72, 153, 0.5)' },   // pink
    { from: '#3b82f6', to: '#2563eb', glow: 'rgba(59, 130, 246, 0.5)' },   // blue
  ]
  return colors[Math.abs(level + 1) % colors.length]
}

// Mock data
const mockAgentChain: AgentNode[] = [
  { id: 'user', name: 'User', level: -1, children: ['gsac'], isActive: true },
  { id: 'gsac', name: 'G-SAC', level: 0, parent: 'user', children: ['agent-factory', 'sales-agent'], isActive: false },
  { id: 'agent-factory', name: 'Agent Factory', level: 1, parent: 'gsac', children: ['support-bot', 'research-agent'], isActive: false },
  { id: 'sales-agent', name: 'Sales Agent', level: 1, parent: 'gsac', children: [], isActive: false },
  { id: 'support-bot', name: 'Support Bot', level: 2, parent: 'agent-factory', children: ['sub-agent'], isActive: false },
  { id: 'research-agent', name: 'Research Agent', level: 2, parent: 'agent-factory', children: [], isActive: false },
  { id: 'sub-agent', name: 'Sub Agent', level: 3, parent: 'support-bot', children: [], isActive: false },
]

// Tree layout algorithm
function calculateTreeLayout(nodes: AgentNode[], containerWidth: number): AgentNode[] {
  if (nodes.length === 0) return nodes
  
  const nodeWidth = 160
  const nodeHeight = 120
  const levelHeight = 140
  const minNodeSpacing = 40
  
  // Group by level
  const levels = new Map<number, AgentNode[]>()
  nodes.forEach(node => {
    const level = node.level + 1 // Offset for user at -1
    if (!levels.has(level)) levels.set(level, [])
    levels.get(level)!.push(node)
  })
  
  // Calculate positions for each level
  const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b)
  const result: AgentNode[] = []
  
  sortedLevels.forEach((levelNum) => {
    const levelNodes = levels.get(levelNum)!
    const totalWidth = levelNodes.length * nodeWidth + (levelNodes.length - 1) * minNodeSpacing
    let startX = (containerWidth - totalWidth) / 2
    
    // Center under parent if possible
    levelNodes.forEach((node, index) => {
      const y = levelNum * levelHeight + 60
      let x = startX + index * (nodeWidth + minNodeSpacing) + nodeWidth / 2
      
      // Try to center under parent
      if (node.parent) {
        const parentNode = result.find(n => n.id === node.parent)
        if (parentNode && parentNode.x !== undefined) {
          const siblings = levelNodes.filter(n => n.parent === node.parent)
          const siblingIndex = siblings.findIndex(n => n.id === node.id)
          const siblingCount = siblings.length
          const siblingSpread = (siblingCount - 1) * (nodeWidth + minNodeSpacing)
          x = parentNode.x - siblingSpread / 2 + siblingIndex * (nodeWidth + minNodeSpacing)
        }
      }
      
      result.push({ ...node, x, y })
    })
  })
  
  return result
}

// Animated connection line component
function ConnectionPath({ 
  fromNode, 
  toNode, 
  isActive,
  isHighlighted 
}: { 
  fromNode: AgentNode
  toNode: AgentNode
  isActive: boolean
  isHighlighted: boolean
}) {
  const colors = getLevelColors(toNode.level)
  
  if (fromNode.x === undefined || fromNode.y === undefined || 
      toNode.x === undefined || toNode.y === undefined) {
    return null
  }
  
  const startX = fromNode.x
  const startY = fromNode.y + 50 // Bottom of parent node
  const endX = toNode.x
  const endY = toNode.y - 10 // Top of child node
  
  // Control points for bezier curve
  const midY = (startY + endY) / 2
  const controlOffset = Math.abs(endX - startX) * 0.2
  
  const path = `
    M ${startX} ${startY}
    C ${startX} ${midY + controlOffset},
      ${endX} ${midY - controlOffset},
      ${endX} ${endY}
  `
  
  const id = `path-${fromNode.id}-${toNode.id}`
  
  return (
    <g className="connection-group">
      {/* Glow effect */}
      <path
        d={path}
        fill="none"
        stroke={colors.from}
        strokeWidth={isActive || isHighlighted ? 8 : 4}
        strokeLinecap="round"
        opacity={isActive || isHighlighted ? 0.4 : 0.1}
        style={{ filter: 'blur(8px)' }}
      />
      
      {/* Base line */}
      <path
        d={path}
        fill="none"
        stroke={`url(#gradient-${Math.abs(toNode.level + 1) % 6})`}
        strokeWidth={isActive || isHighlighted ? 3 : 2}
        strokeLinecap="round"
        opacity={isActive || isHighlighted ? 1 : 0.3}
        style={{
          transition: 'all 0.3s ease',
        }}
      />
      
      {/* Animated flow particles */}
      {(isActive || isHighlighted) && (
        <>
          <circle r="4" fill={colors.from}>
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={path}
            />
          </circle>
          <circle r="3" fill={colors.from} opacity="0.6">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={path}
              begin="0.5s"
            />
          </circle>
          <circle r="2" fill={colors.from} opacity="0.4">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={path}
              begin="1s"
            />
          </circle>
        </>
      )}
      
      {/* Arrow head */}
      <circle
        cx={endX}
        cy={endY}
        r={isActive || isHighlighted ? 5 : 3}
        fill={colors.from}
        opacity={isActive || isHighlighted ? 1 : 0.5}
        style={{
          transition: 'all 0.3s ease',
          filter: isActive || isHighlighted ? `drop-shadow(0 0 6px ${colors.from})` : 'none',
        }}
      />
    </g>
  )
}

// Individual node component with glassmorphism
function NodeCard({ 
  node, 
  isActive, 
  isSelected,
  isInPath,
  isCollapsed,
  hasChildren,
  onClick,
  onDoubleClick,
  onToggleCollapse,
  onHover,
  index,
}: { 
  node: AgentNode
  isActive: boolean
  isSelected: boolean
  isInPath: boolean
  isCollapsed: boolean
  hasChildren: boolean
  onClick: () => void
  onDoubleClick: () => void
  onToggleCollapse: () => void
  onHover: (isHovered: boolean) => void
  index: number
}) {
  const colors = getLevelColors(node.level)
  const icon = getAgentIcon(node.name, node.id)
  const highlighted = isActive || isSelected || isInPath
  
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="absolute group cursor-pointer transform -translate-x-1/2"
      style={{
        left: node.x,
        top: node.y,
        animation: `nodeEntrance 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s both`,
        zIndex: highlighted ? 20 : 10,
      }}
    >
      {/* Outer glow ring */}
      <div
        className={`absolute -inset-6 rounded-3xl transition-all duration-500 ${
          highlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
        }`}
        style={{
          background: `radial-gradient(ellipse at center, ${colors.glow} 0%, transparent 70%)`,
          animation: highlighted ? 'pulseGlow 3s ease-in-out infinite' : 'none',
        }}
      />
      
      {/* Animated border container */}
      <div
        className={`absolute -inset-[2px] rounded-2xl transition-all duration-500 overflow-hidden ${
          highlighted ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'
        }`}
      >
        {/* Spinning gradient border */}
        <div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 0deg, ${colors.from}, ${colors.to}, transparent, ${colors.from})`,
            animation: highlighted ? 'spinBorder 4s linear infinite' : 'none',
          }}
        />
      </div>
      
      {/* Main card body - glassmorphism */}
      <div
        className={`relative rounded-2xl p-4 transition-all duration-300 ${
          highlighted 
            ? 'bg-black/90 shadow-2xl scale-105' 
            : 'bg-black/70 group-hover:bg-black/80 group-hover:scale-102'
        }`}
        style={{
          backdropFilter: 'blur(24px)',
          width: '150px',
          boxShadow: highlighted 
            ? `0 0 40px ${colors.glow}, 0 20px 60px rgba(0,0,0,0.5)` 
            : '0 10px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Status indicator dot */}
        <div className="absolute -top-1.5 -right-1.5">
          <div 
            className={`w-4 h-4 rounded-full border-2 border-black ${
              isActive ? 'bg-green-400' : node.children.length > 0 ? 'bg-cyan-400/50' : 'bg-zinc-600'
            }`}
            style={{
              boxShadow: isActive ? `0 0 15px ${colors.from}, 0 0 30px rgba(74, 222, 128, 0.6)` : 'none',
              animation: isActive ? 'statusPulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
        </div>
        
        {/* Level indicator on left */}
        <div 
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full"
          style={{
            background: `linear-gradient(180deg, ${colors.from}, ${colors.to})`,
            boxShadow: highlighted ? `0 0 10px ${colors.from}` : 'none',
          }}
        />
        
        {/* Icon with depth effect */}
        <div 
          className="text-4xl mb-2 transition-all duration-300 relative"
          style={{
            filter: highlighted 
              ? `drop-shadow(0 0 15px ${colors.from}) drop-shadow(0 4px 8px rgba(0,0,0,0.5))` 
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            transform: highlighted ? 'translateY(-2px) scale(1.1)' : 'scale(1)',
          }}
        >
          {icon}
        </div>
        
        {/* Name */}
        <div 
          className="font-bold text-sm mb-2 truncate transition-all duration-300"
          style={{ 
            color: highlighted ? colors.from : 'rgba(255,255,255,0.95)',
            textShadow: highlighted ? `0 0 20px ${colors.glow}` : 'none',
          }}
        >
          {node.name}
        </div>
        
        {/* Level badge */}
        <div className="flex items-center gap-2">
          <div 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium"
            style={{
              background: `linear-gradient(135deg, ${colors.from}15, ${colors.to}25)`,
              color: colors.from,
              border: `1px solid ${colors.from}40`,
              boxShadow: highlighted ? `inset 0 0 10px ${colors.from}20` : 'none',
            }}
          >
            {node.id === 'user' ? (
              <><span>◉</span> ROOT</>
            ) : (
              <><span>⬡</span> L{node.level}</>
            )}
          </div>
          
          {/* Children count badge with collapse toggle */}
          {hasChildren && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleCollapse()
                }}
                className="px-1.5 py-0.5 rounded text-xs font-mono transition-all hover:scale-110"
                style={{
                  background: `${colors.to}20`,
                  color: colors.to,
                  border: `1px solid ${colors.to}30`,
                }}
                title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
              >
                {isCollapsed ? '▶' : '▼'}
              </button>
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono"
                style={{
                  background: `${colors.to}20`,
                  color: colors.to,
                  border: `1px solid ${colors.to}30`,
                }}
              >
                <span className="text-[10px]">↓</span>
                {node.children.length}
              </div>
            </div>
          )}
        </div>
        
        {/* Hover tooltip */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 -bottom-2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30"
          style={{ width: '200px' }}
        >
          <div 
            className="mt-2 p-3 rounded-xl text-xs text-zinc-300 text-left"
            style={{
              background: 'rgba(0,0,0,0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${colors.from}40`,
              boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${colors.glow}`,
            }}
          >
            <div className="font-medium text-white mb-1">{node.name}</div>
            <div className="text-zinc-400 mb-2">
              {node.description || `Level ${node.level} agent in the hierarchy`}
            </div>
            {node.createdAt && (
              <div className="text-zinc-500 text-[10px]">
                Created: {new Date(node.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating particle effects */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${4 + (i % 3) * 2}px`,
                height: `${4 + (i % 3) * 2}px`,
                background: i % 2 === 0 ? colors.from : colors.to,
                left: `${50 + Math.cos(i * 45 * Math.PI / 180) * 80}%`,
                top: `${50 + Math.sin(i * 45 * Math.PI / 180) * 80}%`,
                animation: `floatParticle ${2.5 + i * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
                boxShadow: `0 0 10px ${colors.from}`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OuroborosVisualization({ 
  animated = true, 
  showLabels = true,
  variant = 'compact',
  useRealData = false
}: OuroborosVisualizationProps) {
  const [activeNode, setActiveNode] = useState(0)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false)
  const [agentChain, setAgentChain] = useState<AgentNode[]>(mockAgentChain)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, withLineage: 0, maxDepth: 0 })
  const [isKeyboardMode, setIsKeyboardMode] = useState(false)
  const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(new Set())
  const [focusedSubtree, setFocusedSubtree] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [showMinimap, setShowMinimap] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const treeContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)

  // Keyboard navigation
  useEffect(() => {
    if (variant !== 'full') return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && 
          document.activeElement !== document.body) return
      
      const currentIndex = selectedNode 
        ? agentChain.findIndex(n => n.id === selectedNode)
        : activeNode
      const currentNode = agentChain[currentIndex]
      
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          setIsKeyboardMode(true)
          // Move to first child
          if (currentNode?.children.length > 0) {
            const childId = currentNode.children[0]
            setSelectedNode(childId)
            setActiveNode(agentChain.findIndex(n => n.id === childId))
          }
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setIsKeyboardMode(true)
          // Move to parent
          if (currentNode?.parent) {
            setSelectedNode(currentNode.parent)
            setActiveNode(agentChain.findIndex(n => n.id === currentNode.parent))
          }
          break
        }
        case 'ArrowLeft':
        case 'ArrowRight': {
          e.preventDefault()
          setIsKeyboardMode(true)
          // Move to sibling
          if (currentNode?.parent) {
            const parent = agentChain.find(n => n.id === currentNode.parent)
            if (parent && parent.children && parent.children.length > 1) {
              const siblingIndex = parent.children.indexOf(currentNode.id)
              const newIndex = e.key === 'ArrowLeft' 
                ? (siblingIndex - 1 + parent.children.length) % parent.children.length
                : (siblingIndex + 1) % parent.children.length
              const newId = parent.children[newIndex]
              setSelectedNode(newId)
              setActiveNode(agentChain.findIndex(n => n.id === newId))
            }
          }
          break
        }
        case 'Enter':
        case ' ': {
          e.preventDefault()
          setIsKeyboardMode(true)
          if (currentNode) {
            setSelectedNode(selectedNode === currentNode.id ? null : currentNode.id)
          }
          break
        }
        case 'Escape': {
          setSelectedNode(null)
          setIsKeyboardMode(false)
          break
        }
        case 'Tab': {
          setIsKeyboardMode(true)
          // Cycle through nodes
          const newIndex = e.shiftKey 
            ? (currentIndex - 1 + agentChain.length) % agentChain.length
            : (currentIndex + 1) % agentChain.length
          setSelectedNode(agentChain[newIndex].id)
          setActiveNode(newIndex)
          e.preventDefault()
          break
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [variant, selectedNode, activeNode, agentChain])

  // Track container size
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Fetch real lineage data
  const fetchLineage = useCallback(async () => {
    if (!useRealData) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/agents/lineage')
      const data: LineageResponse = await response.json()
      
      if (data.success && data.nodes.length > 0) {
        const nodes: AgentNode[] = data.nodes.map(node => ({
          id: node.id,
          name: node.name,
          level: node.level,
          parent: node.parent,
          children: node.children,
          isActive: false,
          createdAt: node.createdAt,
          description: node.description,
        }))
        
        const rootAgents = nodes.filter(n => n.level === 0)
        if (rootAgents.length > 0) {
          const userNode: AgentNode = {
            id: 'user',
            name: 'User',
            level: -1,
            children: rootAgents.map(r => r.id),
            isActive: true,
          }
          rootAgents.forEach(r => r.parent = 'user')
          nodes.unshift(userNode)
        }
        
        setAgentChain(nodes)
        setStats({
          total: data.totalAgents,
          withLineage: data.agentsWithLineage,
          maxDepth: data.maxDepth,
        })
      } else {
        setAgentChain([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lineage')
      setAgentChain(mockAgentChain)
    } finally {
      setLoading(false)
    }
  }, [useRealData])

  useEffect(() => {
    fetchLineage()
  }, [fetchLineage])

  // Filter nodes based on collapsed branches and focused subtree
  const visibleNodes = useMemo(() => {
    if (focusedSubtree) {
      // Show only the focused subtree with path to root
      const focusedNode = agentChain.find(n => n.id === focusedSubtree)
      if (!focusedNode) return agentChain
      
      const subtree: AgentNode[] = []
      
      // Add path to root
      let current: AgentNode | undefined = focusedNode
      const pathToRoot: AgentNode[] = []
      while (current) {
        pathToRoot.unshift(current)
        if (current.parent) {
          current = agentChain.find(n => n.id === current!.parent)
        } else {
          break
        }
      }
      subtree.push(...pathToRoot)
      
      // Add all descendants
      const addChildren = (nodeId: string) => {
        const node = agentChain.find(n => n.id === nodeId)
        if (!node) return
        node.children.forEach(childId => {
          const child = agentChain.find(n => n.id === childId)
          if (child && !subtree.find(n => n.id === child.id)) {
            subtree.push(child)
            addChildren(childId)
          }
        })
      }
      addChildren(focusedSubtree)
      return subtree
    }
    
    // Filter out collapsed branches
    const visible: AgentNode[] = []
    const addVisible = (node: AgentNode) => {
      if (visible.find(n => n.id === node.id)) return
      visible.push(node)
      if (!collapsedBranches.has(node.id)) {
        node.children.forEach(childId => {
          const child = agentChain.find(n => n.id === childId)
          if (child) addVisible(child)
        })
      }
    }
    
    // Start from root nodes (nodes without parents)
    agentChain.forEach(node => {
      if (!node.parent || node.id === 'user') {
        addVisible(node)
      }
    })
    
    return visible.length > 0 ? visible : agentChain
  }, [agentChain, collapsedBranches, focusedSubtree])

  // Calculate layout
  const layoutNodes = useMemo(() => {
    return calculateTreeLayout(visibleNodes, containerWidth)
  }, [visibleNodes, containerWidth])

  // Get maximum Y for container height
  const maxY = useMemo(() => {
    return Math.max(...layoutNodes.map(n => n.y || 0)) + 160
  }, [layoutNodes])

  // Animate through the chain
  useEffect(() => {
    if (!animated || agentChain.length === 0) return
    
    const interval = setInterval(() => {
      setActiveNode(prev => (prev + 1) % agentChain.length)
    }, 2500)
    
    return () => clearInterval(interval)
  }, [animated, agentChain.length])

  // Get path from root to selected/hovered node
  const getPathToNode = useCallback((nodeId: string | null): Set<string> => {
    if (!nodeId) return new Set()
    
    const path = new Set<string>()
    let current = layoutNodes.find(n => n.id === nodeId)
    
    while (current) {
      path.add(current.id)
      if (current.parent) {
        current = layoutNodes.find(n => n.id === current!.parent)
      } else {
        break
      }
    }
    
    return path
  }, [layoutNodes])

  const highlightedPath = useMemo(() => {
    return getPathToNode(hoveredNode || selectedNode)
  }, [hoveredNode, selectedNode, getPathToNode])

  const getNodeDescription = (index: number): string => {
    if (agentChain.length === 0) return ""
    const node = agentChain[index]
    if (!node) return ""
    
    if (node.id === 'user') return "User initiates the creation chain with a natural language request..."
    if (node.name.toLowerCase().includes('g-sac')) return "G-SAC analyzes the goal and uses createAgent to spawn specialized agents..."
    if (node.description) return node.description
    if (node.children.length > 0) return `${node.name} orchestrates ${node.children.length} child agent(s) for delegated tasks...`
    return `${node.name} executes specialized tasks in the agent hierarchy...`
  }

  // CSS Keyframes
  const keyframes = `
    @keyframes nodeEntrance {
      0% { opacity: 0; transform: translate(-50%, 30px) scale(0.8); }
      60% { transform: translate(-50%, -5px) scale(1.02); }
      100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    @keyframes spinBorder {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes statusPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 15px currentColor; }
      50% { transform: scale(1.2); box-shadow: 0 0 25px currentColor; }
    }
    @keyframes floatParticle {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
      50% { transform: translateY(-20px) scale(1.4); opacity: 0.9; }
    }
    @keyframes gradientFlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.03); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes ouroboros {
      0% { transform: rotate(0deg) scale(1); }
      25% { transform: rotate(90deg) scale(1.05); }
      50% { transform: rotate(180deg) scale(1); }
      75% { transform: rotate(270deg) scale(0.95); }
      100% { transform: rotate(360deg) scale(1); }
    }
  `

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="my-6 text-center">
        <style>{keyframes}</style>
        
        <div className="relative bg-gradient-to-br from-purple-900/30 via-black to-cyan-900/30 border border-purple-500/30 p-8 rounded-2xl overflow-hidden">
          {/* Background grid */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(168, 85, 247, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          
          {/* Animated Ouroboros Symbol */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Outer ring */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #a855f7, #22d3ee, #22c55e, #a855f7)',
                animation: animated ? 'spin 10s linear infinite' : 'none',
                opacity: 0.3,
              }}
            />
            <div className="absolute inset-2 rounded-full bg-black" />
            
            {/* Inner animated ring */}
            <div 
              className="absolute inset-4 rounded-full border-2 border-dashed border-cyan-400/50"
              style={{
                animation: animated ? 'spin 15s linear infinite reverse' : 'none',
              }}
            />
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span 
                className="text-5xl"
                style={{
                  animation: animated ? 'ouroboros 8s ease-in-out infinite' : 'none',
                  filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.8))',
                }}
              >
                🐍
              </span>
            </div>
            
            {/* Orbiting dots */}
            {animated && [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-cyan-400"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 120}deg) translateX(60px)`,
                  animation: `spin ${4 + i}s linear infinite`,
                  transformOrigin: '0 0',
                  boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)',
                }}
              />
            ))}
          </div>

          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-green-400 bg-clip-text text-transparent mb-6">
            The Ouroboros Pattern
          </h3>
          
          {/* Evolution stages */}
          <div className="space-y-3 text-sm max-w-xl mx-auto">
            {[
              { text: 'Agents create agents (via createAgent tool)', icon: '🤖' },
              { text: 'Dynamic Tool Discovery (searchTools)', icon: '🔍' },
              { text: 'Tool Use Examples (90% accuracy)', icon: '📚' },
              { text: 'Self-improving agents (v1.4.0)', icon: '🔄' },
            ].map((item, i) => (
              <div 
                key={i}
                className={`flex items-center gap-3 justify-center transition-all duration-500 p-2 rounded-lg ${
                  activeNode % 4 === i 
                    ? 'bg-cyan-400/10 text-cyan-300 scale-105' 
                    : 'text-zinc-400'
                }`}
                style={{
                  animation: `nodeEntrance 0.5s ease-out ${i * 0.1}s both`,
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Badge */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30 rounded-full text-xs font-mono text-purple-300">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Advanced Tool Use Enabled
          </div>
        </div>
      </div>
    )
  }

  // Full variant with tree visualization
  return (
    <div className="my-8">
      <style>{keyframes}</style>
      
      <div className="relative bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20 border border-purple-500/40 rounded-2xl overflow-hidden">
        {/* Animated background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(34, 211, 238, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(34, 197, 94, 0.08) 0%, transparent 60%)
            `,
          }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Content */}
        <div className="relative p-8" ref={containerRef}>
          {/* Header */}
          <div className="text-center mb-10">
            <div 
              className="text-6xl mb-4 inline-block"
              style={{
                animation: 'breathe 4s ease-in-out infinite',
                filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.6))',
              }}
            >
              🐍
            </div>
            <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-green-400 bg-clip-text text-transparent mb-3">
              The Ouroboros Pattern
            </h3>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Agents creating agents, infinitely recursive, each generation more capable than the last
            </p>
            {useRealData && stats.total > 0 && (
              <div className="mt-3 flex items-center justify-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  Live Data
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">{stats.total} agents</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">{stats.withLineage} with lineage</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">depth {stats.maxDepth}</span>
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div 
                className="text-4xl mb-3 inline-block"
                style={{ animation: 'spin 2s linear infinite' }}
              >
                ⚙️
              </div>
              <p className="text-zinc-400">Loading agent lineage...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-4 text-amber-400/80 text-sm mb-6 bg-amber-400/10 rounded-lg mx-auto max-w-md">
              ⚠️ {error} — Showing example data
            </div>
          )}

          {/* Empty state */}
          {!loading && agentChain.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🌱</div>
              <h4 className="text-xl font-bold text-green-400 mb-2">No Agent Lineage Yet</h4>
              <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                Create your first agent with G-SAC to begin the Ouroboros chain.
              </p>
              <Link
                href="/create-agent"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/50 rounded-xl text-purple-300 hover:text-white hover:border-purple-400 transition-all font-mono"
              >
                Create Your First Agent
                <span>→</span>
              </Link>
            </div>
          )}

          {/* Agent Tree */}
          {!loading && agentChain.length > 0 && (
            <div className="mb-10">
              <h4 className="text-lg font-bold text-center mb-8">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Agent Lineage Tree
                </span>
                {useRealData && (
                  <span className="ml-2 text-xs font-normal text-cyan-400/50">(Real Data)</span>
                )}
              </h4>
              
              {/* Controls */}
              <div className="flex items-center justify-between mb-4 px-4">
                <div className="flex items-center gap-2">
                  {/* Level indicators */}
                  <div className="flex items-center gap-1 text-xs font-mono text-zinc-500">
                    {Array.from(new Set(layoutNodes.map(n => n.level))).sort().map(level => (
                      <div
                        key={level}
                        className="px-2 py-1 rounded border border-zinc-700 bg-zinc-900/50"
                        style={{
                          color: getLevelColors(level).from,
                          borderColor: `${getLevelColors(level).from}40`,
                        }}
                      >
                        L{level}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Zoom controls */}
                  <div className="flex items-center gap-1 border border-zinc-700 rounded-lg p-1">
                    <button
                      onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.1))}
                      className="px-2 py-1 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                      title="Zoom out"
                    >
                      −
                    </button>
                    <span className="px-2 py-1 text-xs font-mono text-zinc-400 min-w-[3rem] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                      className="px-2 py-1 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                      title="Zoom in"
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        setZoomLevel(1)
                        setPanOffset({ x: 0, y: 0 })
                        setFocusedSubtree(null)
                      }}
                      className="px-2 py-1 text-xs font-mono text-zinc-400 hover:text-white transition-colors ml-1"
                      title="Reset view"
                    >
                      ⟲
                    </button>
                  </div>
                  
                  {/* Mini-map toggle */}
                  <button
                    onClick={() => setShowMinimap(!showMinimap)}
                    className="px-2 py-1 text-xs font-mono border border-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                    title="Toggle mini-map"
                  >
                    🗺️
                  </button>
                  
                  {/* Focus indicator */}
                  {focusedSubtree && (
                    <button
                      onClick={() => setFocusedSubtree(null)}
                      className="px-2 py-1 text-xs font-mono border border-purple-500 rounded text-purple-400 hover:text-purple-300 transition-colors"
                      title="Exit focus mode"
                    >
                      ✕ Focus
                    </button>
                  )}
                </div>
              </div>

              {/* Tree visualization container */}
              <div 
                ref={treeContainerRef}
                className="relative mx-auto overflow-hidden"
                style={{ 
                  height: `${maxY}px`,
                  maxWidth: '100%',
                  transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: 'top center',
                  transition: isPanning ? 'none' : 'transform 0.2s ease-out',
                  cursor: isPanning ? 'grabbing' : 'grab',
                }}
                onMouseDown={(e) => {
                  if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
                    setIsPanning(true)
                    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
                  }
                }}
                onMouseMove={(e) => {
                  if (isPanning) {
                    setPanOffset({
                      x: e.clientX - panStart.x,
                      y: e.clientY - panStart.y,
                    })
                  }
                }}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault()
                    const delta = e.deltaY > 0 ? -0.1 : 0.1
                    setZoomLevel(Math.max(0.3, Math.min(2, zoomLevel + delta)))
                  }
                }}
              >
                {/* SVG for connections */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 1 }}
                >
                  {/* Gradient definitions */}
                  <defs>
                    {[0, 1, 2, 3, 4, 5].map(level => {
                      const colors = getLevelColors(level - 1)
                      return (
                        <linearGradient 
                          key={level} 
                          id={`gradient-${level}`} 
                          x1="0%" 
                          y1="0%" 
                          x2="0%" 
                          y2="100%"
                        >
                          <stop offset="0%" stopColor={colors.from} stopOpacity="0.6" />
                          <stop offset="100%" stopColor={colors.to} />
                        </linearGradient>
                      )
                    })}
                    
                    {/* Glow filter */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Connection lines */}
                  <g>
                    {layoutNodes.map(node => {
                      if (!node.parent) return null
                      const parentNode = layoutNodes.find(n => n.id === node.parent)
                      if (!parentNode) return null
                      
                      const isInActivePath = layoutNodes[activeNode]?.id === node.id || 
                                            layoutNodes[activeNode]?.id === parentNode.id
                      const isHighlighted = highlightedPath.has(node.id) && highlightedPath.has(parentNode.id)
                      
                      return (
                        <ConnectionPath
                          key={`${parentNode.id}-${node.id}`}
                          fromNode={parentNode}
                          toNode={node}
                          isActive={isInActivePath}
                          isHighlighted={isHighlighted}
                        />
                      )
                    })}
                  </g>
                </svg>
                
                {/* Node cards */}
                {layoutNodes.map((node, index) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    isActive={agentChain[activeNode]?.id === node.id}
                    isSelected={selectedNode === node.id}
                    isInPath={highlightedPath.has(node.id)}
                    isCollapsed={collapsedBranches.has(node.id)}
                    hasChildren={node.children.length > 0}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                    onDoubleClick={() => {
                      if (node.children.length > 0) {
                        setFocusedSubtree(focusedSubtree === node.id ? null : node.id)
                      }
                    }}
                    onToggleCollapse={() => {
                      setCollapsedBranches(prev => {
                        const next = new Set(prev)
                        if (next.has(node.id)) {
                          next.delete(node.id)
                        } else {
                          next.add(node.id)
                        }
                        return next
                      })
                    }}
                    onHover={(isHovered) => setHoveredNode(isHovered ? node.id : null)}
                    index={index}
                  />
                ))}
              </div>

              {/* Mini-map */}
              {showMinimap && layoutNodes.length > 3 && (
                <div className="absolute bottom-4 right-4 w-48 h-32 bg-black/80 border border-zinc-700 rounded-lg p-2 backdrop-blur-xl z-50">
                  <div className="text-xs font-mono text-zinc-400 mb-1">Mini-map</div>
                  <div className="relative w-full h-full bg-zinc-900/50 rounded border border-zinc-800 overflow-hidden">
                    {layoutNodes.map(node => {
                      const scaleX = 200 / containerWidth
                      const scaleY = 120 / maxY
                      const colors = getLevelColors(node.level)
                      return (
                        <div
                          key={node.id}
                          className="absolute rounded-sm"
                          style={{
                            left: `${(node.x || 0) * scaleX}px`,
                            top: `${(node.y || 0) * scaleY}px`,
                            width: `${150 * scaleX}px`,
                            height: `${120 * scaleY}px`,
                            background: selectedNode === node.id 
                              ? colors.from 
                              : agentChain[activeNode]?.id === node.id
                              ? `${colors.from}80`
                              : `${colors.from}30`,
                            border: `1px solid ${colors.from}60`,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setSelectedNode(node.id)
                            setActiveNode(agentChain.findIndex(n => n.id === node.id))
                          }}
                          title={node.name}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Active node description */}
              <div 
                className="mt-8 text-center p-5 bg-black/50 rounded-2xl border border-zinc-800/50 max-w-2xl mx-auto backdrop-blur-xl"
                style={{
                  boxShadow: `0 0 40px ${getLevelColors(agentChain[activeNode]?.level || 0).glow}`,
                }}
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span 
                    className="text-3xl"
                    style={{
                      filter: `drop-shadow(0 0 10px ${getLevelColors(agentChain[activeNode]?.level || 0).from})`,
                    }}
                  >
                    {getAgentIcon(agentChain[activeNode]?.name || '', agentChain[activeNode]?.id || '')}
                  </span>
                  <span 
                    className="font-bold text-xl"
                    style={{ color: getLevelColors(agentChain[activeNode]?.level || 0).from }}
                  >
                    {agentChain[activeNode]?.name}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {getNodeDescription(activeNode)}
                </p>
              </div>

              {/* Interaction hints */}
              <div 
                className={`mt-4 flex items-center justify-center gap-4 text-xs transition-opacity duration-300 flex-wrap ${
                  isKeyboardMode ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono">↑↓</kbd>
                  <span>parent/child</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono">←→</kbd>
                  <span>siblings</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono">Tab</kbd>
                  <span>cycle</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono">Esc</kbd>
                  <span>deselect</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <span className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono">2×Click</span>
                  <span>focus subtree</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <span className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono">Ctrl+Wheel</span>
                  <span>zoom</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <span className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono">Ctrl+Drag</span>
                  <span>pan</span>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Features Section */}
          <div className="border-t border-zinc-800/50 pt-8">
            <button 
              onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
              className="flex items-center gap-3 mx-auto px-6 py-3 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-400/30 rounded-full text-green-400 hover:text-green-300 hover:border-green-400/50 hover:scale-105 transition-all font-mono text-sm"
            >
              <span className="text-lg">{showAdvancedFeatures ? '−' : '+'}</span>
              Advanced Tool Use Features
              <span className="px-2 py-0.5 bg-green-400/20 rounded text-xs">NEW</span>
            </button>

            {showAdvancedFeatures && (
              <div className="mt-8 grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: '🔍',
                    title: 'Tool Search',
                    color: '#22d3ee',
                    desc: 'Dynamic discovery saves 85% context tokens',
                    code: 'searchTools({ query: "create" })',
                  },
                  {
                    icon: '📚',
                    title: 'Tool Examples',
                    color: '#a855f7',
                    desc: 'Pattern examples boost accuracy to 90%',
                    code: 'input_examples: [...]',
                  },
                  {
                    icon: '⚡',
                    title: 'Deferred Loading',
                    color: '#22c55e',
                    desc: 'Load tools on-demand as needed',
                    code: 'useDeferredLoading: true',
                  },
                ].map((feature, i) => (
                  <div 
                    key={i}
                    className="relative group"
                    style={{ animation: `nodeEntrance 0.5s ease-out ${i * 0.1}s both` }}
                  >
                    <div 
                      className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-40 blur-2xl transition-all duration-500"
                      style={{ background: feature.color }}
                    />
                    <div 
                      className="relative rounded-2xl p-6 bg-black/70 border transition-all duration-300 group-hover:scale-[1.03] group-hover:bg-black/80"
                      style={{ 
                        borderColor: `${feature.color}30`,
                        backdropFilter: 'blur(20px)',
                        boxShadow: `0 10px 40px rgba(0,0,0,0.3)`,
                      }}
                    >
                      <div 
                        className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110"
                        style={{ filter: `drop-shadow(0 0 10px ${feature.color}50)` }}
                      >
                        {feature.icon}
                      </div>
                      <h5 
                        className="font-bold text-lg mb-2"
                        style={{ color: feature.color }}
                      >
                        {feature.title}
                      </h5>
                      <p className="text-zinc-400 text-sm mb-4">{feature.desc}</p>
                      <div 
                        className="font-mono text-xs p-3 rounded-xl overflow-x-auto"
                        style={{ 
                          background: `${feature.color}08`,
                          border: `1px solid ${feature.color}25`,
                          color: feature.color,
                        }}
                      >
                        {feature.code}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: '85%', label: 'Token Savings', color: '#a855f7' },
              { value: '90%', label: 'Tool Accuracy', color: '#22d3ee' },
              { value: useRealData && stats.maxDepth > 0 ? stats.maxDepth.toString() : '∞', label: useRealData && stats.maxDepth > 0 ? 'Current Depth' : 'Recursion Depth', color: '#22c55e' },
            ].map((stat, i) => (
              <div 
                key={i}
                className="text-center p-5 rounded-2xl transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}15)`,
                  border: `1px solid ${stat.color}25`,
                  boxShadow: `0 10px 40px ${stat.color}10`,
                }}
              >
                <div 
                  className="text-4xl font-bold mb-1"
                  style={{ 
                    color: stat.color,
                    textShadow: `0 0 40px ${stat.color}50`,
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-zinc-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Attribution */}
          <div className="mt-8 text-center text-xs text-zinc-500">
            Patterns from{' '}
            <a 
              href="https://www.anthropic.com/engineering/advanced-tool-use" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Anthropic&apos;s Advanced Tool Use
            </a>
            {' '}+{' '}
            <a 
              href="https://www.arcade.dev/mcp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Arcade MCP
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
