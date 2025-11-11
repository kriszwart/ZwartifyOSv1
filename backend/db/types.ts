/**
 * Database Types
 * 
 * Type definitions for agent execution tracking, logging, and persistence
 */

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface AgentExecution {
  id: string
  agentId: string
  agentName?: string
  status: ExecutionStatus
  input: string
  output?: string
  error?: string
  startedAt: Date
  completedAt?: Date
  duration?: number // milliseconds
  toolCalls?: ToolCall[]
  metadata?: Record<string, unknown>
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCost: number // USD
  }
  model?: string
}

export interface ToolCall {
  id: string
  executionId: string
  toolName: string
  arguments?: unknown
  result?: unknown
  error?: string
  startedAt: Date
  completedAt?: Date
  duration?: number // milliseconds
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

export interface AgentLog {
  id: string
  executionId: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: unknown
  timestamp: Date
}

export interface AgentDefinition {
  id: string
  name: string
  description?: string
  prompt: string
  version: string
  createdAt: Date
  updatedAt: Date
  enabled: boolean
  metadata?: Record<string, unknown>
  ragFolderId?: string
  useMemory?: boolean
  skillIds?: string[] // Skills assigned to this agent
  createdByAgentId?: string | null // ID of the agent that created this agent
  creationPrompt?: string | null // Original prompt used to create this agent
}

