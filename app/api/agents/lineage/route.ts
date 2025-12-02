/**
 * Agent Lineage API
 * 
 * Returns agent tree data showing parent/child relationships
 * for the Ouroboros visualization.
 */

import { NextResponse } from 'next/server'
import { listAgents } from '@/backend/agents/agentRegistry'
import { AgentDefinition } from '@/backend/db/types'

export interface LineageNode {
  id: string
  name: string
  description?: string
  level: number
  parent?: string
  children: string[]
  createdAt: string
  createdByAgentId: string | null
  isRoot: boolean
}

export interface LineageResponse {
  success: boolean
  nodes: LineageNode[]
  totalAgents: number
  agentsWithLineage: number
  maxDepth: number
}

/**
 * Build the agent lineage tree from flat agent list
 */
function buildLineageTree(agents: AgentDefinition[]): LineageNode[] {
  // Create a map for quick lookups
  const agentMap = new Map<string, AgentDefinition>()
  for (const agent of agents) {
    agentMap.set(agent.id, agent)
  }

  // Build parent-child relationships
  const childrenMap = new Map<string, string[]>()
  for (const agent of agents) {
    if (agent.createdByAgentId) {
      const existing = childrenMap.get(agent.createdByAgentId) || []
      existing.push(agent.id)
      childrenMap.set(agent.createdByAgentId, existing)
    }
  }

  // Calculate levels (depth from root)
  const levelMap = new Map<string, number>()
  
  function calculateLevel(agentId: string, visited: Set<string> = new Set()): number {
    if (visited.has(agentId)) return 0 // Prevent infinite loops
    visited.add(agentId)
    
    if (levelMap.has(agentId)) {
      return levelMap.get(agentId)!
    }
    
    const agent = agentMap.get(agentId)
    if (!agent || !agent.createdByAgentId) {
      levelMap.set(agentId, 0)
      return 0
    }
    
    const parentLevel = calculateLevel(agent.createdByAgentId, visited)
    const level = parentLevel + 1
    levelMap.set(agentId, level)
    return level
  }

  // Calculate all levels
  for (const agent of agents) {
    calculateLevel(agent.id)
  }

  // Build nodes
  const nodes: LineageNode[] = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    level: levelMap.get(agent.id) || 0,
    parent: agent.createdByAgentId || undefined,
    children: childrenMap.get(agent.id) || [],
    createdAt: agent.createdAt instanceof Date ? agent.createdAt.toISOString() : new Date(agent.createdAt).toISOString(),
    createdByAgentId: agent.createdByAgentId ?? null,
    isRoot: !agent.createdByAgentId,
  }))

  // Sort by level, then by creation date
  nodes.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  return nodes
}

export async function GET() {
  try {
    const agents = await listAgents()
    const nodes = buildLineageTree(agents)
    
    // Calculate stats
    const agentsWithLineage = nodes.filter(n => n.createdByAgentId !== null).length
    const maxDepth = Math.max(0, ...nodes.map(n => n.level))

    const response: LineageResponse = {
      success: true,
      nodes,
      totalAgents: agents.length,
      agentsWithLineage,
      maxDepth,
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        nodes: [],
        totalAgents: 0,
        agentsWithLineage: 0,
        maxDepth: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch agent lineage',
      },
      { status: 500 }
    )
  }
}




