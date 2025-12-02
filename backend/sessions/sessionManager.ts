/**
 * Session Manager
 * 
 * Manages persistent agent sessions that maintain state across multiple interactions.
 * Part of Claude SDK Integration for autonomous operation.
 * Now uses backend adapter for storage (in-memory or remote)
 */

import { randomUUID } from 'crypto'
import { getBackendAdapter } from '../adapters'

export type SessionStatus = 'active' | 'paused' | 'completed' | 'expired'

export interface SessionGoal {
  id: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: Date
  completedAt?: Date
  metadata?: Record<string, unknown>
}

export interface SessionMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: Date
  toolName?: string
  toolResult?: unknown
}

export interface AgentSession {
  id: string
  agentId: string
  status: SessionStatus
  goals: SessionGoal[]
  context: Record<string, unknown>
  history: SessionMessage[]
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
  lastActivityAt: Date
  metadata?: Record<string, unknown>
  // Tracking for multi-turn operations
  currentGoalId?: string
  toolChain: Array<{
    toolName: string
    input: unknown
    output: unknown
    timestamp: Date
  }>
  iterationCount: number
  maxIterations: number
}

export interface CreateSessionOptions {
  agentId: string
  goals?: string[]
  context?: Record<string, unknown>
  expiresInMs?: number // Default: 1 hour
  maxIterations?: number // Default: 10
  metadata?: Record<string, unknown>
}

// Default session expiry: 1 hour
const DEFAULT_EXPIRY_MS = 60 * 60 * 1000
// Default max iterations for autonomous mode
const DEFAULT_MAX_ITERATIONS = 10

/**
 * Create a new agent session
 */
export async function createSession(options: CreateSessionOptions): Promise<AgentSession> {
  const adapter = getBackendAdapter()
  return adapter.createSession(options)
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<AgentSession | undefined> {
  const adapter = getBackendAdapter()
  const session = await adapter.getSession(sessionId)
  
  if (session) {
    // Check if expired
    if (new Date() > session.expiresAt) {
      session.status = 'expired'
      await adapter.updateSession(sessionId, { status: 'expired' })
    }
  }
  
  return session ?? undefined
}

/**
 * Get active sessions for an agent
 */
export async function getAgentSessions(agentId: string): Promise<AgentSession[]> {
  const adapter = getBackendAdapter()
  const sessions = await adapter.getAgentSessions(agentId)
  return sessions.filter(s => s.status === 'active')
}

/**
 * Update session
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<AgentSession, 'status' | 'context' | 'metadata' | 'currentGoalId'>>
): Promise<AgentSession | null> {
  const adapter = getBackendAdapter()
  // Update lastActivityAt automatically
  const session = await adapter.getSession(sessionId)
  if (!session) return null
  
  return adapter.updateSession(sessionId, {
    ...updates,
    lastActivityAt: new Date(),
  })
}

/**
 * Add message to session history
 */
export async function addSessionMessage(
  sessionId: string,
  message: Omit<SessionMessage, 'timestamp'>
): Promise<AgentSession | null> {
  const adapter = getBackendAdapter()
  const session = await adapter.getSession(sessionId)
  if (!session) return null

  const updatedHistory = [
    ...session.history,
    {
      ...message,
      timestamp: new Date(),
    },
  ]

  return adapter.updateSession(sessionId, {
    history: updatedHistory,
    lastActivityAt: new Date(),
  })
}

/**
 * Record tool execution in session
 */
export async function recordToolExecution(
  sessionId: string,
  toolName: string,
  input: unknown,
  output: unknown
): Promise<AgentSession | null> {
  const adapter = getBackendAdapter()
  const session = await adapter.getSession(sessionId)
  if (!session) return null

  const updatedToolChain = [
    ...session.toolChain,
    {
      toolName,
      input,
      output,
      timestamp: new Date(),
    },
  ]

  return adapter.updateSession(sessionId, {
    toolChain: updatedToolChain,
    iterationCount: session.iterationCount + 1,
    lastActivityAt: new Date(),
  })
}

/**
 * Check if session can continue (not expired, not at max iterations)
 */
export async function canContinue(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId)
  if (!session) return false
  
  if (session.status !== 'active') return false
  if (new Date() > session.expiresAt) return false
  if (session.iterationCount >= session.maxIterations) return false
  
  return true
}

/**
 * Add a goal to session
 */
export async function addGoal(sessionId: string, description: string): Promise<SessionGoal | null> {
  const adapter = getBackendAdapter()
  const session = await adapter.getSession(sessionId)
  if (!session) return null

  const goal: SessionGoal = {
    id: randomUUID(),
    description,
    status: 'pending',
    createdAt: new Date(),
  }

  const updatedGoals = [...session.goals, goal]
  let currentGoalId = session.currentGoalId

  // If no current goal, set this as current
  if (!currentGoalId) {
    currentGoalId = goal.id
    goal.status = 'in_progress'
  }

  await adapter.updateSession(sessionId, {
    goals: updatedGoals,
    currentGoalId,
  })

  return goal
}

/**
 * Update goal status
 */
export async function updateGoal(
  sessionId: string,
  goalId: string,
  status: SessionGoal['status']
): Promise<SessionGoal | null> {
  const adapter = getBackendAdapter()
  const session = await adapter.getSession(sessionId)
  if (!session) return null

  const goal = session.goals.find(g => g.id === goalId)
  if (!goal) return null

  goal.status = status
  if (status === 'completed' || status === 'failed') {
    goal.completedAt = new Date()
  }

  const updatedGoals = [...session.goals]
  let currentGoalId = session.currentGoalId
  let sessionStatus = session.status

  // If completing current goal, move to next pending goal
  if ((status === 'completed' || status === 'failed') && session.currentGoalId === goalId) {
    const nextGoal = updatedGoals.find(g => g.status === 'pending')
    if (nextGoal) {
      currentGoalId = nextGoal.id
      nextGoal.status = 'in_progress'
    } else {
      currentGoalId = undefined
      // All goals done - check if session should complete
      const allCompleted = updatedGoals.every(g => g.status === 'completed')
      if (allCompleted) {
        sessionStatus = 'completed'
      }
    }
  }

  await adapter.updateSession(sessionId, {
    goals: updatedGoals,
    currentGoalId,
    status: sessionStatus,
  })

  return goal
}

/**
 * Get current goal for session
 */
export async function getCurrentGoal(sessionId: string): Promise<SessionGoal | undefined> {
  const session = await getSession(sessionId)
  if (!session || !session.currentGoalId) return undefined
  return session.goals.find(g => g.id === session.currentGoalId)
}

/**
 * Pause session
 */
export async function pauseSession(sessionId: string): Promise<AgentSession | null> {
  return updateSession(sessionId, { status: 'paused' })
}

/**
 * Resume session
 */
export async function resumeSession(sessionId: string): Promise<AgentSession | null> {
  const session = await getSession(sessionId)
  if (!session) return null
  
  // Can only resume paused sessions that haven't expired
  if (session.status !== 'paused') return null
  if (new Date() > session.expiresAt) {
    await updateSession(sessionId, { status: 'expired' })
    return null
  }

  return updateSession(sessionId, { status: 'active' })
}

/**
 * Complete session
 */
export async function completeSession(sessionId: string): Promise<AgentSession | null> {
  return updateSession(sessionId, { status: 'completed' })
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const adapter = getBackendAdapter()
  return adapter.deleteSession(sessionId)
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const adapter = getBackendAdapter()
  const sessions = await adapter.listSessions()
  const now = new Date()
  let cleaned = 0

  for (const session of sessions) {
    if (now > session.expiresAt && session.status !== 'completed') {
      await adapter.updateSession(session.id, { status: 'expired' })
      cleaned++
    }
  }

  return cleaned
}

/**
 * List all sessions (for admin/debugging)
 */
export async function listSessions(options?: {
  status?: SessionStatus
  agentId?: string
  limit?: number
}): Promise<AgentSession[]> {
  const adapter = getBackendAdapter()
  let sessions = await adapter.listSessions(options?.agentId)

  if (options?.status) {
    sessions = sessions.filter(s => s.status === options.status)
  }

  // Sort by last activity (most recent first)
  sessions.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())

  if (options?.limit) {
    sessions = sessions.slice(0, options.limit)
  }

  return sessions
}

/**
 * Build context string from session for agent prompt
 */
export async function buildSessionContext(sessionId: string): Promise<string> {
  const session = await getSession(sessionId)
  if (!session) return ''

  const parts: string[] = []

  // Add current goal
  const currentGoal = await getCurrentGoal(sessionId)
  if (currentGoal) {
    parts.push(`Current Goal: ${currentGoal.description}`)
  }

  // Add context
  if (Object.keys(session.context).length > 0) {
    parts.push(`Session Context: ${JSON.stringify(session.context)}`)
  }

  // Add recent history summary
  if (session.history.length > 0) {
    const recentHistory = session.history.slice(-5)
    parts.push('Recent History:')
    recentHistory.forEach(msg => {
      parts.push(`  [${msg.role}]: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`)
    })
  }

  // Add tool chain summary
  if (session.toolChain.length > 0) {
    parts.push(`Tools used this session: ${session.toolChain.map(t => t.toolName).join(', ')}`)
    parts.push(`Iteration: ${session.iterationCount}/${session.maxIterations}`)
  }

  return parts.join('\n')
}

