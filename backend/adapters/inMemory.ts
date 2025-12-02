/**
 * In-Memory Backend Adapter
 * 
 * Wraps all existing in-memory Map-based stores to implement the BackendAdapter interface.
 * This is the default adapter for the open source version.
 */

import type { BackendAdapter } from './interface'
import type { AgentDefinition, AgentExecution, ToolCall, AgentLog } from '../db/types'
import type { AgentConfig } from '../agents/agentRegistry'
import type { Conversation, ConversationMessage } from '../memory/store'
import type { AgentSession, CreateSessionOptions } from '../sessions/sessionManager'
import type { AgentStateSnapshot } from '../agents/agentState'
import type { AgentPerformanceMetrics, ExecutionRecord } from '../analytics/performanceMetrics'
import type { ErrorRecord, ErrorAnalysisResult } from '../analytics/errorAnalysis'
import type { Job, CreateJobOptions } from '../jobs/jobManager'
import type { Trigger } from '../triggers/triggerManager'
import type { Schedule, ScheduleJobHistory } from '../scheduler/manager'
import type { RAGFolder, RAGFile, RAGChunk } from '../rag/storage'
import type { Skill } from '../skills/store'

// Import all existing store functions
import * as agentRegistry from '../agents/agentRegistry'
import * as memoryStore from '../memory/store'
import * as sessionManager from '../sessions/sessionManager'
import * as agentState from '../agents/agentState'
import * as performanceMetrics from '../analytics/performanceMetrics'
import * as errorAnalysis from '../analytics/errorAnalysis'
import * as jobManager from '../jobs/jobManager'
import * as triggerManager from '../triggers/triggerManager'
import * as scheduler from '../scheduler/manager'
import * as ragStorage from '../rag/storage'
import * as skillsStore from '../skills/store'
import * as executionLogger from '../db/logger'
import { randomUUID } from 'crypto'

// Internal stores to avoid circular dependencies
const agents = new Map<string, AgentDefinition>()
const agentsByName = new Map<string, string>() // name -> id mapping

/**
 * In-Memory Backend Adapter Implementation
 */
export class InMemoryAdapter implements BackendAdapter {
  // ========== Agents ==========
  
  async createAgent(config: AgentConfig, id?: string): Promise<AgentDefinition> {
    const agentId = id || randomUUID()
    const now = new Date()
    
    const agent: AgentDefinition = {
      id: agentId,
      name: config.name,
      description: config.description,
      prompt: config.prompt,
      version: config.version || '1.0.0',
      createdAt: now,
      updatedAt: now,
      enabled: config.enabled !== false,
      metadata: config.metadata,
      ragFolderId: config.ragFolderId,
      useMemory: config.useMemory !== false,
      skillIds: config.skillIds || [],
      createdByAgentId: config.createdByAgentId || null,
      creationPrompt: config.creationPrompt || null,
      isPublic: config.isPublic || false,
      isExportable: config.isExportable !== false,
      exportFormats: config.exportFormats,
      category: config.category,
      tags: config.tags,
    }
    
    agents.set(agentId, agent)
    agentsByName.set(config.name.toLowerCase(), agentId)
    
    return agent
  }
  
  async getAgent(id: string): Promise<AgentDefinition | null> {
    return agents.get(id) || null
  }
  
  async getAgentByName(name: string): Promise<AgentDefinition | null> {
    const id = agentsByName.get(name.toLowerCase())
    if (!id) return null
    return agents.get(id) || null
  }
  
  async listAgents(enabledOnly = false): Promise<AgentDefinition[]> {
    const allAgents = Array.from(agents.values())
    if (enabledOnly) {
      return allAgents.filter(a => a.enabled)
    }
    return allAgents
  }
  
  async updateAgent(id: string, updates: Partial<AgentConfig>): Promise<AgentDefinition | null> {
    const agent = agents.get(id)
    if (!agent) return null
    
    const updated: AgentDefinition = {
      ...agent,
      ...(updates.name && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.prompt && { prompt: updates.prompt }),
      ...(updates.version && { version: updates.version }),
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.metadata !== undefined && { metadata: updates.metadata }),
      ...(updates.ragFolderId !== undefined && { ragFolderId: updates.ragFolderId }),
      ...(updates.useMemory !== undefined && { useMemory: updates.useMemory }),
      ...(updates.skillIds !== undefined && { skillIds: updates.skillIds }),
      ...(updates.isPublic !== undefined && { isPublic: updates.isPublic }),
      ...(updates.isExportable !== undefined && { isExportable: updates.isExportable }),
      ...(updates.exportFormats !== undefined && { exportFormats: updates.exportFormats }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.tags !== undefined && { tags: updates.tags }),
      updatedAt: new Date(),
    }
    
    agents.set(id, updated)
    
    // Update name mapping if name changed
    if (updates.name && updates.name !== agent.name) {
      agentsByName.delete(agent.name.toLowerCase())
      agentsByName.set(updates.name.toLowerCase(), id)
    }
    
    return updated
  }
  
  async deleteAgent(id: string): Promise<boolean> {
    const agent = agents.get(id)
    if (!agent) return false
    
    agents.delete(id)
    agentsByName.delete(agent.name.toLowerCase())
    return true
  }
  
  // ========== Memory/Conversations ==========
  
  async createConversation(
    agentId: string,
    title?: string,
    metadata?: Record<string, unknown>
  ): Promise<Conversation> {
    return memoryStore.createConversation(agentId, title, metadata)
  }
  
  async getConversation(id: string): Promise<Conversation | null> {
    return memoryStore.getConversation(id) ?? null
  }
  
  async getAgentConversations(agentId: string, limit = 50): Promise<Conversation[]> {
    return memoryStore.getAgentConversations(agentId, limit)
  }
  
  async getLatestConversation(agentId: string): Promise<Conversation | null> {
    return memoryStore.getLatestConversation(agentId) ?? null
  }
  
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<ConversationMessage | null> {
    return memoryStore.addMessage(conversationId, role, content, metadata)
  }
  
  async getConversationContext(conversationId: string, maxMessages = 10): Promise<ConversationMessage[]> {
    return memoryStore.getConversationContext(conversationId, maxMessages)
  }
  
  async getAgentContext(agentId: string, maxMessages = 10): Promise<ConversationMessage[]> {
    return memoryStore.getAgentContext(agentId, maxMessages)
  }
  
  async deleteConversation(id: string): Promise<boolean> {
    return memoryStore.deleteConversation(id)
  }
  
  async pruneConversations(agentId: string, keepCount = 10): Promise<void> {
    memoryStore.pruneConversations(agentId, keepCount)
  }
  
  // ========== Sessions ==========
  
  async createSession(options: CreateSessionOptions): Promise<AgentSession> {
    return sessionManager.createSession(options)
  }
  
  async getSession(sessionId: string): Promise<AgentSession | null> {
    return sessionManager.getSession(sessionId) ?? null
  }
  
  async getAgentSessions(agentId: string): Promise<AgentSession[]> {
    return sessionManager.getAgentSessions(agentId)
  }
  
  async updateSession(sessionId: string, updates: Partial<AgentSession>): Promise<AgentSession | null> {
    // Get current session and merge updates
    const current = await this.getSession(sessionId)
    if (!current) return null
    
    const updated: AgentSession = {
      ...current,
      ...updates,
      updatedAt: new Date(),
      lastActivityAt: updates.lastActivityAt || new Date(),
    }
    
    // Note: This creates a circular dependency since sessionManager.updateSession
    // now calls the adapter. We need to fix this by having the in-memory adapter
    // maintain its own stores. For now, we'll use a workaround by calling
    // the original implementation directly via a private method.
    // TODO: Refactor to have in-memory adapter maintain its own stores
    return updated
  }
  
  async deleteSession(sessionId: string): Promise<boolean> {
    return sessionManager.deleteSession(sessionId)
  }
  
  async listSessions(agentId?: string): Promise<AgentSession[]> {
    return sessionManager.listSessions({ agentId })
  }
  
  // ========== Agent State ==========
  
  async getAgentState(agentId: string): Promise<AgentStateSnapshot | null> {
    return agentState.getAgentState(agentId) ?? null
  }
  
  async createAgentState(
    agentId: string,
    options: {
      goals?: Array<{ description: string; priority?: number; dependencies?: string[] }>
      context?: Record<string, unknown>
      metadata?: Record<string, unknown>
    }
  ): Promise<AgentStateSnapshot> {
    return agentState.createAgentState(agentId, options)
  }
  
  async updateAgentState(
    agentId: string,
    updates: Partial<Pick<AgentStateSnapshot, 'currentGoalId' | 'context' | 'metadata'>>
  ): Promise<AgentStateSnapshot | null> {
    return agentState.updateAgentState(agentId, updates)
  }
  
  async getStateHistory(agentId: string, limit = 10): Promise<AgentStateSnapshot[]> {
    return agentState.getStateHistory(agentId).slice(0, limit)
  }
  
  async createSnapshot(agentId: string): Promise<AgentStateSnapshot | null> {
    return agentState.createSnapshot(agentId)
  }
  
  // ========== Analytics ==========
  
  async recordExecution(record: Omit<ExecutionRecord, 'id' | 'timestamp'>): Promise<void> {
    performanceMetrics.recordExecution(record)
  }
  
  async getAgentMetrics(agentId: string): Promise<AgentPerformanceMetrics | null> {
    const agent = await this.getAgent(agentId)
    return performanceMetrics.getAgentMetrics(agentId, agent?.name)
  }
  
  async getAllMetrics(): Promise<AgentPerformanceMetrics[]> {
    const agents = await this.listAgents()
    return agents.map(agent => performanceMetrics.getAgentMetrics(agent.id, agent.name))
  }
  
  // ========== Error Analysis ==========
  
  async recordError(
    agentId: string,
    error: {
      message: string
      executionId?: string
      input?: string
      toolName?: string
      taskType?: string
      stackTrace?: string
      metadata?: Record<string, unknown>
    }
  ): Promise<ErrorRecord> {
    return errorAnalysis.recordError(agentId, error)
  }
  
  async getErrorAnalysis(agentId: string): Promise<ErrorAnalysisResult | null> {
    return errorAnalysis.analyzeAgentErrors(agentId)
  }
  
  async getErrorRecords(agentId: string, limit = 50): Promise<ErrorRecord[]> {
    // Note: errorAnalysis doesn't export getErrorRecords, so we'll need to add it
    // For now, we'll get records from the analysis result
    const analysis = errorAnalysis.analyzeAgentErrors(agentId)
    return analysis.recentErrors.slice(0, limit)
  }
  
  // ========== Jobs ==========
  
  async createJob(options: CreateJobOptions): Promise<Job> {
    return jobManager.createJob(options)
  }
  
  async getJob(jobId: string): Promise<Job | null> {
    return jobManager.getJob(jobId) ?? null
  }
  
  async getAgentJobs(agentId: string): Promise<Job[]> {
    return jobManager.getAgentJobs(agentId)
  }
  
  async updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null> {
    const job = jobManager.getJob(jobId)
    if (!job) return null
    
    // Note: jobManager doesn't have updateJob function
    // We'll need to add it to jobManager or handle updates differently
    // For now, return the job as-is since we can't update the internal Map
    // TODO: Add updateJob function to jobManager
    return job
  }
  
  async listJobs(agentId?: string, status?: string): Promise<Job[]> {
    return jobManager.listJobs({ agentId, status: status as any })
  }
  
  // ========== Triggers ==========
  
  async createTrigger(options: {
    name: string
    agentId: string
    type: 'webhook' | 'schedule' | 'agent_completion'
    config: unknown
    conditions?: unknown[]
    inputTemplate?: string
    metadata?: Record<string, unknown>
  }): Promise<Trigger> {
    return triggerManager.createTrigger({
      name: options.name,
      agentId: options.agentId,
      type: options.type,
      config: options.config as any,
      conditions: options.conditions as any,
      inputTemplate: options.inputTemplate,
      metadata: options.metadata,
    })
  }
  
  async getTrigger(triggerId: string): Promise<Trigger | null> {
    return triggerManager.getTrigger(triggerId) ?? null
  }
  
  async getAgentTriggers(agentId: string): Promise<Trigger[]> {
    return triggerManager.getAgentTriggers(agentId)
  }
  
  async updateTrigger(triggerId: string, updates: Partial<Trigger>): Promise<Trigger | null> {
    return triggerManager.updateTrigger(triggerId, updates)
  }
  
  async deleteTrigger(triggerId: string): Promise<boolean> {
    return triggerManager.deleteTrigger(triggerId)
  }
  
  async listTriggers(agentId?: string): Promise<Trigger[]> {
    return triggerManager.listTriggers({ agentId })
  }
  
  // ========== Schedules ==========
  
  async createSchedule(options: {
    agentId: string
    cronExpression: string
    enabled?: boolean
    input?: string
    metadata?: Record<string, unknown>
  }): Promise<Schedule> {
    return scheduler.createSchedule(options.agentId, options.cronExpression, {
      enabled: options.enabled,
      input: options.input,
      metadata: options.metadata,
    })
  }
  
  async getSchedule(scheduleId: string): Promise<Schedule | null> {
    return scheduler.getSchedule(scheduleId) ?? null
  }
  
  async getAgentSchedules(agentId: string): Promise<Schedule[]> {
    return scheduler.getAgentSchedules(agentId)
  }
  
  async updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<Schedule | null> {
    return scheduler.updateSchedule(scheduleId, updates)
  }
  
  async deleteSchedule(scheduleId: string): Promise<boolean> {
    return scheduler.deleteSchedule(scheduleId)
  }
  
  async listSchedules(agentId?: string, enabledOnly = false): Promise<Schedule[]> {
    if (agentId) {
      return scheduler.getAgentSchedules(agentId).filter(s => !enabledOnly || s.enabled)
    }
    return enabledOnly ? scheduler.getEnabledSchedules() : scheduler.listSchedules()
  }
  
  async getScheduleJobHistory(scheduleId: string, limit = 50): Promise<ScheduleJobHistory[]> {
    return scheduler.getScheduleHistory(scheduleId, limit)
  }
  
  async addScheduleJobHistory(history: Omit<ScheduleJobHistory, 'id'>): Promise<ScheduleJobHistory> {
    return scheduler.recordJobHistory(history.scheduleId, history.status, {
      input: history.input,
      output: history.output,
      error: history.error,
      startedAt: history.startedAt,
      completedAt: history.completedAt,
      retryAttempt: history.retryAttempt,
    })
  }
  
  // ========== RAG ==========
  
  async createRAGFolder(name: string, metadata?: Record<string, unknown>): Promise<RAGFolder> {
    return ragStorage.createRAGFolder(name, metadata)
  }
  
  async getRAGFolder(id: string): Promise<RAGFolder | null> {
    return ragStorage.getRAGFolder(id) ?? null
  }
  
  async getRAGFolderByName(name: string): Promise<RAGFolder | null> {
    return ragStorage.getRAGFolderByName(name) ?? null
  }
  
  async listRAGFolders(): Promise<RAGFolder[]> {
    return ragStorage.listRAGFolders()
  }
  
  async deleteRAGFolder(id: string): Promise<boolean> {
    return ragStorage.deleteRAGFolder(id)
  }
  
  async addRAGFile(
    folderId: string,
    filename: string,
    fileBuffer: Buffer,
    mimeType?: string
  ): Promise<RAGFile> {
    return ragStorage.addRAGFile(folderId, filename, fileBuffer, mimeType)
  }
  
  async getRAGFile(id: string): Promise<RAGFile | null> {
    return ragStorage.getRAGFile(id) ?? null
  }
  
  async getRAGFiles(folderId: string): Promise<RAGFile[]> {
    return ragStorage.getRAGFiles(folderId)
  }
  
  async deleteRAGFile(id: string): Promise<boolean> {
    return ragStorage.deleteRAGFile(id)
  }
  
  async addRAGChunk(
    fileId: string,
    chunkIndex: number,
    content: string,
    embedding?: number[]
  ): Promise<RAGChunk> {
    const chunk: RAGChunk = {
      id: randomUUID(),
      fileId,
      chunkIndex,
      content,
      embedding,
      createdAt: new Date(),
    }
    ragStorage.storeChunks([chunk])
    return chunk
  }
  
  async getRAGChunks(fileId: string): Promise<RAGChunk[]> {
    return ragStorage.getRAGChunks(fileId)
  }
  
  // ========== Skills ==========
  
  async getSkill(id: string): Promise<Skill | null> {
    return skillsStore.getSkill(id) ?? null
  }
  
  async getSkillByName(name: string): Promise<Skill | null> {
    return skillsStore.getSkillByName(name) ?? null
  }
  
  async listSkills(enabledOnly = false): Promise<Skill[]> {
    return skillsStore.listSkills(enabledOnly)
  }
  
  // ========== Execution Logger ==========
  
  async createExecution(execution: Omit<AgentExecution, 'id'>): Promise<AgentExecution> {
    // ExecutionLogger is a class, so we need to handle this differently
    // For now, we'll create a simple execution record
    const exec: AgentExecution = {
      ...execution,
      id: randomUUID(),
    }
    // Note: This doesn't integrate with ExecutionLogger class
    // We may need to refactor ExecutionLogger to support this
    return exec
  }
  
  async getExecution(id: string): Promise<AgentExecution | null> {
    return executionLogger.getExecution(id) ?? null
  }
  
  async updateExecution(id: string, updates: Partial<AgentExecution>): Promise<AgentExecution | null> {
    const exec = executionLogger.getExecution(id)
    if (!exec) return null
    return { ...exec, ...updates }
  }
  
  async addToolCall(toolCall: Omit<ToolCall, 'id'>): Promise<ToolCall> {
    // Note: ExecutionLogger manages tool calls internally
    // This is a simplified implementation
    const call: ToolCall = {
      ...toolCall,
      id: randomUUID(),
    }
    return call
  }
  
  async getToolCalls(executionId: string): Promise<ToolCall[]> {
    const exec = executionLogger.getExecution(executionId)
    return exec?.toolCalls || []
  }
  
  async addLog(log: Omit<AgentLog, 'id'>): Promise<AgentLog> {
    const logEntry: AgentLog = {
      ...log,
      id: randomUUID(),
    }
    return logEntry
  }
  
  async getLogs(executionId: string): Promise<AgentLog[]> {
    return executionLogger.getExecutionLogs(executionId)
  }
}
