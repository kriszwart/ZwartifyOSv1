/**
 * Execution Logger
 * 
 * Logs agent executions, tool calls, and errors for observability
 */

import { AgentExecution, ToolCall, AgentLog, ExecutionStatus } from './types'
import { randomUUID } from 'crypto'

// In-memory store for now (will be replaced with database)
const executions = new Map<string, AgentExecution>()
const toolCalls = new Map<string, ToolCall>()
const logs = new Map<string, AgentLog[]>()

export class ExecutionLogger {
  private executionId: string
  private agentId: string
  private agentName?: string
  private startTime: Date
  private executionLogs: AgentLog[] = []

  constructor(agentId: string, agentName?: string) {
    this.executionId = randomUUID()
    this.agentId = agentId
    this.agentName = agentName
    this.startTime = new Date()
  }

  /**
   * Get the current execution ID
   */
  getExecutionId(): string {
    return this.executionId
  }

  /**
   * Start execution logging
   */
  startExecution(input: string, metadata?: Record<string, unknown>): void {
    const execution: AgentExecution = {
      id: this.executionId,
      agentId: this.agentId,
      agentName: this.agentName,
      status: 'running',
      input,
      startedAt: this.startTime,
      metadata,
      toolCalls: [],
    }

    executions.set(this.executionId, execution)
    logs.set(this.executionId, [])

    this.log('info', 'Execution started', { input, metadata })
  }

  /**
   * Complete execution successfully
   */
  completeExecution(output: string): void {
    const execution = executions.get(this.executionId)
    if (!execution) return

    const completedAt = new Date()
    const duration = completedAt.getTime() - this.startTime.getTime()

    execution.status = 'completed'
    execution.output = output
    execution.completedAt = completedAt
    execution.duration = duration

    executions.set(this.executionId, execution)
    this.log('info', 'Execution completed', { output, duration })
  }

  /**
   * Mark execution as failed
   */
  failExecution(error: Error | string): void {
    const execution = executions.get(this.executionId)
    if (!execution) return

    const completedAt = new Date()
    const duration = completedAt.getTime() - this.startTime.getTime()

    execution.status = 'failed'
    execution.error = error instanceof Error ? error.message : error
    execution.completedAt = completedAt
    execution.duration = duration

    executions.set(this.executionId, execution)
    
    const errorLog = error instanceof Error 
      ? { message: error.message, stack: error.stack, name: error.name }
      : { message: error }
    
    this.log('error', 'Execution failed', errorLog)
  }

  /**
   * Log a tool call
   */
  logToolCall(toolName: string, args?: unknown): string {
    const toolCallId = randomUUID()
    const startedAt = new Date()

    const toolCall: ToolCall = {
      id: toolCallId,
      executionId: this.executionId,
      toolName,
      arguments: args,
      startedAt,
    }

    toolCalls.set(toolCallId, toolCall)

    const execution = executions.get(this.executionId)
    if (execution) {
      execution.toolCalls = execution.toolCalls || []
      execution.toolCalls.push(toolCall)
      executions.set(this.executionId, execution)
    }

    this.log('info', `Tool call: ${toolName}`, { toolCallId, arguments: args })
    return toolCallId
  }

  /**
   * Complete a tool call
   */
  completeToolCall(toolCallId: string, result?: unknown, error?: Error | string): void {
    const toolCall = toolCalls.get(toolCallId)
    if (!toolCall) return

    const completedAt = new Date()
    const duration = completedAt.getTime() - toolCall.startedAt.getTime()

    toolCall.completedAt = completedAt
    toolCall.duration = duration

    if (error) {
      toolCall.error = error instanceof Error ? error.message : error
      this.log('error', `Tool call failed: ${toolCall.toolName}`, { toolCallId, error })
    } else {
      toolCall.result = result
      this.log('info', `Tool call completed: ${toolCall.toolName}`, { toolCallId, result })
    }

    toolCalls.set(toolCallId, toolCall)
  }

  /**
   * Log a message
   */
  log(level: AgentLog['level'], message: string, data?: unknown): void {
    const logEntry: AgentLog = {
      id: randomUUID(),
      executionId: this.executionId,
      level,
      message,
      data,
      timestamp: new Date(),
    }

    this.executionLogs.push(logEntry)
    logs.set(this.executionId, [...this.executionLogs])
  }

  /**
   * Get execution logs
   */
  getLogs(): AgentLog[] {
    return this.executionLogs
  }
}

/**
 * Get execution by ID
 */
export function getExecution(executionId: string): AgentExecution | undefined {
  return executions.get(executionId)
}

/**
 * Get executions for an agent
 */
export function getAgentExecutions(agentId: string, limit = 50): AgentExecution[] {
  const allExecutions = Array.from(executions.values())
    .filter(ex => ex.agentId === agentId)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .slice(0, limit)

  return allExecutions
}

/**
 * Get logs for an execution
 */
export function getExecutionLogs(executionId: string): AgentLog[] {
  return logs.get(executionId) || []
}

/**
 * Get all executions (for dashboard)
 */
export function getAllExecutions(limit = 100): AgentExecution[] {
  return Array.from(executions.values())
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .slice(0, limit)
}

