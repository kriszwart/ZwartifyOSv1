/**
 * Agent State Persistence
 * 
 * Save and restore agent state for long-running operations.
 * Enables resilience through state snapshots and recovery.
 * 
 * Part of Claude SDK Integration for autonomous operation.
 */

import { randomUUID } from 'crypto'

export interface AgentGoal {
  id: string
  description: string
  priority: number // Lower = higher priority
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked'
  progress: number // 0-100
  dependencies?: string[] // Goal IDs that must complete first
  subtasks?: AgentSubtask[]
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  metadata?: Record<string, unknown>
}

export interface AgentSubtask {
  id: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  result?: string
  toolsUsed?: string[]
}

export interface AgentStateSnapshot {
  id: string
  agentId: string
  version: number
  createdAt: Date
  
  // Current state
  currentGoalId?: string
  goals: AgentGoal[]
  context: Record<string, unknown>
  
  // Progress tracking
  iterationCount: number
  totalToolCalls: number
  successfulToolCalls: number
  failedToolCalls: number
  
  // Memory
  recentActions: AgentAction[]
  learnings: AgentLearning[]
  
  // Metadata
  metadata?: Record<string, unknown>
}

export interface AgentAction {
  id: string
  type: 'tool_call' | 'goal_update' | 'decision' | 'error'
  description: string
  timestamp: Date
  data?: unknown
}

export interface AgentLearning {
  id: string
  type: 'success_pattern' | 'failure_pattern' | 'optimization' | 'insight'
  description: string
  confidence: number // 0-1
  createdAt: Date
  usageCount: number
}

// In-memory stores
const agentStates = new Map<string, AgentStateSnapshot>()
const stateHistory = new Map<string, AgentStateSnapshot[]>() // agentId -> historical snapshots
const MAX_HISTORY_PER_AGENT = 10
const MAX_RECENT_ACTIONS = 50

/**
 * Get current state for an agent
 */
export function getAgentState(agentId: string): AgentStateSnapshot | undefined {
  return agentStates.get(agentId)
}

/**
 * Create initial state for an agent
 */
export function createAgentState(
  agentId: string,
  options: {
    goals?: Array<{ description: string; priority?: number; dependencies?: string[] }>
    context?: Record<string, unknown>
    metadata?: Record<string, unknown>
  } = {}
): AgentStateSnapshot {
  const now = new Date()
  
  const state: AgentStateSnapshot = {
    id: randomUUID(),
    agentId,
    version: 1,
    createdAt: now,
    goals: (options.goals || []).map((g, index) => ({
      id: randomUUID(),
      description: g.description,
      priority: g.priority ?? index,
      status: 'pending',
      progress: 0,
      dependencies: g.dependencies,
      createdAt: now,
    })),
    context: options.context || {},
    iterationCount: 0,
    totalToolCalls: 0,
    successfulToolCalls: 0,
    failedToolCalls: 0,
    recentActions: [],
    learnings: [],
    metadata: options.metadata,
  }

  // Set first goal as current if no dependencies
  if (state.goals.length > 0) {
    const firstGoal = state.goals.find(g => !g.dependencies || g.dependencies.length === 0)
    if (firstGoal) {
      state.currentGoalId = firstGoal.id
      firstGoal.status = 'in_progress'
      firstGoal.startedAt = now
    }
  }

  agentStates.set(agentId, state)
  return state
}

/**
 * Update agent state
 */
export function updateAgentState(
  agentId: string,
  updates: Partial<Pick<AgentStateSnapshot, 'currentGoalId' | 'context' | 'metadata'>>
): AgentStateSnapshot | null {
  const state = agentStates.get(agentId)
  if (!state) return null

  const updated: AgentStateSnapshot = {
    ...state,
    ...updates,
    version: state.version + 1,
  }

  agentStates.set(agentId, updated)
  return updated
}

/**
 * Record an action in agent state
 */
export function recordAction(
  agentId: string,
  action: Omit<AgentAction, 'id' | 'timestamp'>
): AgentAction | null {
  const state = agentStates.get(agentId)
  if (!state) return null

  const newAction: AgentAction = {
    id: randomUUID(),
    ...action,
    timestamp: new Date(),
  }

  // Add to recent actions (keep limited history)
  state.recentActions.unshift(newAction)
  if (state.recentActions.length > MAX_RECENT_ACTIONS) {
    state.recentActions = state.recentActions.slice(0, MAX_RECENT_ACTIONS)
  }

  state.iterationCount++
  state.version++
  agentStates.set(agentId, state)

  return newAction
}

/**
 * Record tool call result
 */
export function recordToolCall(
  agentId: string,
  toolName: string,
  success: boolean,
  result?: unknown
): void {
  const state = agentStates.get(agentId)
  if (!state) return

  state.totalToolCalls++
  if (success) {
    state.successfulToolCalls++
  } else {
    state.failedToolCalls++
  }

  recordAction(agentId, {
    type: 'tool_call',
    description: `Called ${toolName}: ${success ? 'success' : 'failed'}`,
    data: { toolName, success, result: typeof result === 'string' ? result.substring(0, 200) : undefined },
  })
}

/**
 * Add a goal to agent state
 */
export function addGoal(
  agentId: string,
  goal: { description: string; priority?: number; dependencies?: string[] }
): AgentGoal | null {
  const state = agentStates.get(agentId)
  if (!state) return null

  const newGoal: AgentGoal = {
    id: randomUUID(),
    description: goal.description,
    priority: goal.priority ?? state.goals.length,
    status: 'pending',
    progress: 0,
    dependencies: goal.dependencies,
    createdAt: new Date(),
  }

  state.goals.push(newGoal)
  state.version++

  // Check if this should be current goal (no dependencies or all deps complete)
  if (!state.currentGoalId) {
    const canStart = !newGoal.dependencies || 
      newGoal.dependencies.every(depId => 
        state.goals.find(g => g.id === depId)?.status === 'completed'
      )
    
    if (canStart) {
      state.currentGoalId = newGoal.id
      newGoal.status = 'in_progress'
      newGoal.startedAt = new Date()
    }
  }

  agentStates.set(agentId, state)
  return newGoal
}

/**
 * Update goal status
 */
export function updateGoalStatus(
  agentId: string,
  goalId: string,
  status: AgentGoal['status'],
  progress?: number
): AgentGoal | null {
  const state = agentStates.get(agentId)
  if (!state) return null

  const goal = state.goals.find(g => g.id === goalId)
  if (!goal) return null

  goal.status = status
  if (progress !== undefined) goal.progress = progress

  if (status === 'completed' || status === 'failed') {
    goal.completedAt = new Date()
    goal.progress = status === 'completed' ? 100 : goal.progress

    // If this was current goal, find next one
    if (state.currentGoalId === goalId) {
      state.currentGoalId = undefined
      
      // Find next goal that can start (pending, all deps complete)
      const nextGoal = state.goals
        .filter(g => g.status === 'pending')
        .sort((a, b) => a.priority - b.priority)
        .find(g => {
          if (!g.dependencies || g.dependencies.length === 0) return true
          return g.dependencies.every(depId => 
            state.goals.find(g => g.id === depId)?.status === 'completed'
          )
        })

      if (nextGoal) {
        state.currentGoalId = nextGoal.id
        nextGoal.status = 'in_progress'
        nextGoal.startedAt = new Date()
      }
    }
  }

  state.version++
  agentStates.set(agentId, state)

  recordAction(agentId, {
    type: 'goal_update',
    description: `Goal "${goal.description.substring(0, 50)}": ${status}`,
    data: { goalId, status, progress: goal.progress },
  })

  return goal
}

/**
 * Add a learning/insight
 */
export function addLearning(
  agentId: string,
  learning: Omit<AgentLearning, 'id' | 'createdAt' | 'usageCount'>
): AgentLearning | null {
  const state = agentStates.get(agentId)
  if (!state) return null

  const newLearning: AgentLearning = {
    id: randomUUID(),
    ...learning,
    createdAt: new Date(),
    usageCount: 0,
  }

  state.learnings.push(newLearning)
  state.version++
  agentStates.set(agentId, state)

  return newLearning
}

/**
 * Get applicable learnings for a context
 */
export function getRelevantLearnings(
  agentId: string,
  context: string,
  minConfidence: number = 0.5
): AgentLearning[] {
  const state = agentStates.get(agentId)
  if (!state) return []

  // Simple keyword matching - could be enhanced with embeddings
  const keywords = context.toLowerCase().split(/\s+/)

  return state.learnings
    .filter(l => l.confidence >= minConfidence)
    .filter(l => {
      const learningWords = l.description.toLowerCase().split(/\s+/)
      return keywords.some(k => learningWords.some(w => w.includes(k) || k.includes(w)))
    })
    .sort((a, b) => b.confidence - a.confidence)
}

/**
 * Create a state snapshot (for recovery)
 */
export function createSnapshot(agentId: string): AgentStateSnapshot | null {
  const state = agentStates.get(agentId)
  if (!state) return null

  // Create a deep copy for the snapshot
  const snapshot: AgentStateSnapshot = JSON.parse(JSON.stringify(state))
  snapshot.id = randomUUID()
  snapshot.createdAt = new Date()

  // Store in history
  const history = stateHistory.get(agentId) || []
  history.push(snapshot)

  // Keep limited history
  if (history.length > MAX_HISTORY_PER_AGENT) {
    history.shift()
  }

  stateHistory.set(agentId, history)
  return snapshot
}

/**
 * Restore from a snapshot
 */
export function restoreFromSnapshot(agentId: string, snapshotId: string): AgentStateSnapshot | null {
  const history = stateHistory.get(agentId)
  if (!history) return null

  const snapshot = history.find(s => s.id === snapshotId)
  if (!snapshot) return null

  // Create a new state from snapshot with incremented version
  const restoredState: AgentStateSnapshot = {
    ...JSON.parse(JSON.stringify(snapshot)),
    version: (agentStates.get(agentId)?.version || 0) + 1,
  }

  agentStates.set(agentId, restoredState)

  recordAction(agentId, {
    type: 'decision',
    description: `Restored from snapshot ${snapshotId}`,
    data: { snapshotId },
  })

  return restoredState
}

/**
 * Get state history (snapshots)
 */
export function getStateHistory(agentId: string): AgentStateSnapshot[] {
  return stateHistory.get(agentId) || []
}

/**
 * Get current goal
 */
export function getCurrentGoal(agentId: string): AgentGoal | undefined {
  const state = agentStates.get(agentId)
  if (!state || !state.currentGoalId) return undefined
  return state.goals.find(g => g.id === state.currentGoalId)
}

/**
 * Build state context for agent prompt
 */
export function buildStateContext(agentId: string): string {
  const state = agentStates.get(agentId)
  if (!state) return ''

  const parts: string[] = []

  // Current goal
  const currentGoal = getCurrentGoal(agentId)
  if (currentGoal) {
    parts.push(`## Current Goal`)
    parts.push(`${currentGoal.description} (${currentGoal.progress}% complete)`)
    
    if (currentGoal.subtasks?.length) {
      parts.push('\nSubtasks:')
      currentGoal.subtasks.forEach(st => {
        parts.push(`- [${st.status}] ${st.description}`)
      })
    }
  }

  // Goal overview
  const pendingGoals = state.goals.filter(g => g.status === 'pending').length
  const completedGoals = state.goals.filter(g => g.status === 'completed').length
  parts.push(`\n## Progress: ${completedGoals}/${state.goals.length} goals completed, ${pendingGoals} pending`)

  // Recent learnings
  const recentLearnings = state.learnings
    .filter(l => l.confidence > 0.7)
    .slice(0, 3)
  
  if (recentLearnings.length > 0) {
    parts.push('\n## Learnings')
    recentLearnings.forEach(l => {
      parts.push(`- ${l.description}`)
    })
  }

  // Stats
  const successRate = state.totalToolCalls > 0 
    ? Math.round((state.successfulToolCalls / state.totalToolCalls) * 100) 
    : 100
  parts.push(`\n## Stats: ${state.totalToolCalls} tool calls (${successRate}% success), ${state.iterationCount} iterations`)

  return parts.join('\n')
}

/**
 * Delete agent state
 */
export function deleteAgentState(agentId: string): boolean {
  stateHistory.delete(agentId)
  return agentStates.delete(agentId)
}

/**
 * List all agent states
 */
export function listAgentStates(): AgentStateSnapshot[] {
  return Array.from(agentStates.values())
    .sort((a, b) => b.version - a.version)
}



