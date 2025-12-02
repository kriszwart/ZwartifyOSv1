/**
 * Remote Backend Adapter
 * 
 * Connects to a remote backend service via HTTP REST API.
 * This adapter allows you to use your own backend (Convex/PostgreSQL/Redis)
 * while keeping the codebase open source.
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

interface RemoteAdapterConfig {
  apiUrl: string
  apiKey?: string
  timeout?: number
}

/**
 * Remote Backend Adapter Implementation
 */
export class RemoteAdapter implements BackendAdapter {
  private apiUrl: string
  private apiKey?: string
  private timeout: number

  constructor(config: RemoteAdapterConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '') // Remove trailing slash
    this.apiKey = config.apiKey
    this.timeout = config.timeout || 30000 // 30 seconds default
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.apiUrl}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Backend API error: ${error.message || response.statusText}`)
      }

      // Handle empty responses
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined as T
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`)
      }
      throw error
    }
  }

  // ========== Agents ==========
  
  async createAgent(config: AgentConfig, id?: string): Promise<AgentDefinition> {
    return this.request<AgentDefinition>('POST', '/api/backend/agents', { ...config, id })
  }
  
  async getAgent(id: string): Promise<AgentDefinition | null> {
    return this.request<AgentDefinition | null>('GET', `/api/backend/agents/${id}`)
  }
  
  async getAgentByName(name: string): Promise<AgentDefinition | null> {
    return this.request<AgentDefinition | null>('GET', `/api/backend/agents/by-name/${encodeURIComponent(name)}`)
  }
  
  async listAgents(enabledOnly = false): Promise<AgentDefinition[]> {
    return this.request<AgentDefinition[]>('GET', `/api/backend/agents?enabledOnly=${enabledOnly}`)
  }
  
  async updateAgent(id: string, updates: Partial<AgentConfig>): Promise<AgentDefinition | null> {
    return this.request<AgentDefinition | null>('PATCH', `/api/backend/agents/${id}`, updates)
  }
  
  async deleteAgent(id: string): Promise<boolean> {
    return this.request<boolean>('DELETE', `/api/backend/agents/${id}`)
  }
  
  // ========== Memory/Conversations ==========
  
  async createConversation(
    agentId: string,
    title?: string,
    metadata?: Record<string, unknown>
  ): Promise<Conversation> {
    return this.request<Conversation>('POST', '/api/backend/conversations', { agentId, title, metadata })
  }
  
  async getConversation(id: string): Promise<Conversation | null> {
    return this.request<Conversation | null>('GET', `/api/backend/conversations/${id}`)
  }
  
  async getAgentConversations(agentId: string, limit = 50): Promise<Conversation[]> {
    return this.request<Conversation[]>('GET', `/api/backend/conversations?agentId=${agentId}&limit=${limit}`)
  }
  
  async getLatestConversation(agentId: string): Promise<Conversation | null> {
    return this.request<Conversation | null>('GET', `/api/backend/conversations/latest/${agentId}`)
  }
  
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<ConversationMessage | null> {
    return this.request<ConversationMessage | null>('POST', `/api/backend/conversations/${conversationId}/messages`, {
      role,
      content,
      metadata,
    })
  }
  
  async getConversationContext(conversationId: string, maxMessages = 10): Promise<ConversationMessage[]> {
    return this.request<ConversationMessage[]>('GET', `/api/backend/conversations/${conversationId}/context?maxMessages=${maxMessages}`)
  }
  
  async getAgentContext(agentId: string, maxMessages = 10): Promise<ConversationMessage[]> {
    return this.request<ConversationMessage[]>('GET', `/api/backend/conversations/agent/${agentId}/context?maxMessages=${maxMessages}`)
  }
  
  async deleteConversation(id: string): Promise<boolean> {
    return this.request<boolean>('DELETE', `/api/backend/conversations/${id}`)
  }
  
  async pruneConversations(agentId: string, keepCount = 10): Promise<void> {
    await this.request<void>('POST', `/api/backend/conversations/prune`, { agentId, keepCount })
  }
  
  // ========== Sessions ==========
  
  async createSession(options: CreateSessionOptions): Promise<AgentSession> {
    return this.request<AgentSession>('POST', '/api/backend/sessions', options)
  }
  
  async getSession(sessionId: string): Promise<AgentSession | null> {
    return this.request<AgentSession | null>('GET', `/api/backend/sessions/${sessionId}`)
  }
  
  async getAgentSessions(agentId: string): Promise<AgentSession[]> {
    return this.request<AgentSession[]>('GET', `/api/backend/sessions?agentId=${agentId}`)
  }
  
  async updateSession(sessionId: string, updates: Partial<AgentSession>): Promise<AgentSession | null> {
    return this.request<AgentSession | null>('PATCH', `/api/backend/sessions/${sessionId}`, updates)
  }
  
  async deleteSession(sessionId: string): Promise<boolean> {
    return this.request<boolean>('DELETE', `/api/backend/sessions/${sessionId}`)
  }
  
  async listSessions(agentId?: string): Promise<AgentSession[]> {
    const path = agentId ? `/api/backend/sessions?agentId=${agentId}` : '/api/backend/sessions'
    return this.request<AgentSession[]>('GET', path)
  }
  
  // ========== Agent State ==========
  
  async getAgentState(agentId: string): Promise<AgentStateSnapshot | null> {
    return this.request<AgentStateSnapshot | null>('GET', `/api/backend/agent-state/${agentId}`)
  }
  
  async createAgentState(
    agentId: string,
    options: {
      goals?: Array<{ description: string; priority?: number; dependencies?: string[] }>
      context?: Record<string, unknown>
      metadata?: Record<string, unknown>
    }
  ): Promise<AgentStateSnapshot> {
    return this.request<AgentStateSnapshot>('POST', `/api/backend/agent-state`, { agentId, ...options })
  }
  
  async updateAgentState(
    agentId: string,
    updates: Partial<Pick<AgentStateSnapshot, 'currentGoalId' | 'context' | 'metadata'>>
  ): Promise<AgentStateSnapshot | null> {
    return this.request<AgentStateSnapshot | null>('PATCH', `/api/backend/agent-state/${agentId}`, updates)
  }
  
  async getStateHistory(agentId: string, limit = 10): Promise<AgentStateSnapshot[]> {
    return this.request<AgentStateSnapshot[]>('GET', `/api/backend/agent-state/${agentId}/history?limit=${limit}`)
  }
  
  async createSnapshot(agentId: string): Promise<AgentStateSnapshot | null> {
    return this.request<AgentStateSnapshot | null>('POST', `/api/backend/agent-state/${agentId}/snapshot`)
  }
  
  // ========== Analytics ==========
  
  async recordExecution(record: Omit<ExecutionRecord, 'id' | 'timestamp'>): Promise<void> {
    await this.request<void>('POST', '/api/backend/analytics/executions', record)
  }
  
  async getAgentMetrics(agentId: string): Promise<AgentPerformanceMetrics | null> {
    return this.request<AgentPerformanceMetrics | null>('GET', `/api/backend/analytics/agents/${agentId}/metrics`)
  }
  
  async getAllMetrics(): Promise<AgentPerformanceMetrics[]> {
    return this.request<AgentPerformanceMetrics[]>('GET', '/api/backend/analytics/metrics')
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
    return this.request<ErrorRecord>('POST', `/api/backend/analytics/errors`, { agentId, ...error })
  }
  
  async getErrorAnalysis(agentId: string): Promise<ErrorAnalysisResult | null> {
    return this.request<ErrorAnalysisResult | null>('GET', `/api/backend/analytics/agents/${agentId}/errors`)
  }
  
  async getErrorRecords(agentId: string, limit = 50): Promise<ErrorRecord[]> {
    return this.request<ErrorRecord[]>('GET', `/api/backend/analytics/agents/${agentId}/error-records?limit=${limit}`)
  }
  
  // ========== Jobs ==========
  
  async createJob(options: CreateJobOptions): Promise<Job> {
    return this.request<Job>('POST', '/api/backend/jobs', options)
  }
  
  async getJob(jobId: string): Promise<Job | null> {
    return this.request<Job | null>('GET', `/api/backend/jobs/${jobId}`)
  }
  
  async getAgentJobs(agentId: string): Promise<Job[]> {
    return this.request<Job[]>('GET', `/api/backend/jobs?agentId=${agentId}`)
  }
  
  async updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null> {
    return this.request<Job | null>('PATCH', `/api/backend/jobs/${jobId}`, updates)
  }
  
  async listJobs(agentId?: string, status?: string): Promise<Job[]> {
    const params = new URLSearchParams()
    if (agentId) params.append('agentId', agentId)
    if (status) params.append('status', status)
    const query = params.toString()
    return this.request<Job[]>('GET', `/api/backend/jobs${query ? `?${query}` : ''}`)
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
    return this.request<Trigger>('POST', '/api/backend/triggers', options)
  }
  
  async getTrigger(triggerId: string): Promise<Trigger | null> {
    return this.request<Trigger | null>('GET', `/api/backend/triggers/${triggerId}`)
  }
  
  async getAgentTriggers(agentId: string): Promise<Trigger[]> {
    return this.request<Trigger[]>('GET', `/api/backend/triggers?agentId=${agentId}`)
  }
  
  async updateTrigger(triggerId: string, updates: Partial<Trigger>): Promise<Trigger | null> {
    return this.request<Trigger | null>('PATCH', `/api/backend/triggers/${triggerId}`, updates)
  }
  
  async deleteTrigger(triggerId: string): Promise<boolean> {
    return this.request<boolean>('DELETE', `/api/backend/triggers/${triggerId}`)
  }
  
  async listTriggers(agentId?: string): Promise<Trigger[]> {
    const path = agentId ? `/api/backend/triggers?agentId=${agentId}` : '/api/backend/triggers'
    return this.request<Trigger[]>('GET', path)
  }
  
  // ========== Schedules ==========
  
  async createSchedule(options: {
    agentId: string
    cronExpression: string
    enabled?: boolean
    input?: string
    metadata?: Record<string, unknown>
  }): Promise<Schedule> {
    return this.request<Schedule>('POST', '/api/backend/schedules', options)
  }
  
  async getSchedule(scheduleId: string): Promise<Schedule | null> {
    return this.request<Schedule | null>('GET', `/api/backend/schedules/${scheduleId}`)
  }
  
  async getAgentSchedules(agentId: string): Promise<Schedule[]> {
    return this.request<Schedule[]>('GET', `/api/backend/schedules?agentId=${agentId}`)
  }
  
  async updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<Schedule | null> {
    return this.request<Schedule | null>('PATCH', `/api/backend/schedules/${scheduleId}`, updates)
  }
  
  async deleteSchedule(scheduleId: string): Promise<boolean> {
    return this.request<boolean>('DELETE', `/api/backend/schedules/${scheduleId}`)
  }
  
  async listSchedules(agentId?: string, enabledOnly = false): Promise<Schedule[]> {
    const params = new URLSearchParams()
    if (agentId) params.append('agentId', agentId)
    if (enabledOnly) params.append('enabledOnly', 'true')
    const query = params.toString()
    return this.request<Schedule[]>('GET', `/api/backend/schedules${query ? `?${query}` : ''}`)
  }
  
  async getScheduleJobHistory(scheduleId: string, limit = 50): Promise<ScheduleJobHistory[]> {
    return this.request<ScheduleJobHistory[]>('GET', `/api/backend/schedules/${scheduleId}/history?limit=${limit}`)
  }
  
  async addScheduleJobHistory(history: Omit<ScheduleJobHistory, 'id'>): Promise<ScheduleJobHistory> {
    return this.request<ScheduleJobHistory>('POST', `/api/backend/schedules/${history.scheduleId}/history`, history)
  }
  
  // ========== RAG ==========
  
  async createRAGFolder(name: string, metadata?: Record<string, unknown>): Promise<RAGFolder> {
    return this.request<RAGFolder>('POST', '/api/backend/rag/folders', { name, metadata })
  }
  
  async getRAGFolder(id: string): Promise<RAGFolder | null> {
    return this.request<RAGFolder | null>('GET', `/api/backend/rag/folders/${id}`)
  }
  
  async getRAGFolderByName(name: string): Promise<RAGFolder | null> {
    return this.request<RAGFolder | null>('GET', `/api/backend/rag/folders/by-name/${encodeURIComponent(name)}`)
  }
  
  async listRAGFolders(): Promise<RAGFolder[]> {
    return this.request<RAGFolder[]>('GET', '/api/backend/rag/folders')
  }
  
  async deleteRAGFolder(id: string): Promise<boolean> {
    return this.request<boolean>('DELETE', `/api/backend/rag/folders/${id}`)
  }
  
  async addRAGFile(
    folderId: string,
    filename: string,
    fileBuffer: Buffer,
    mimeType?: string
  ): Promise<RAGFile> {
    // Convert buffer to base64 for JSON transport
    const base64 = fileBuffer.toString('base64')
    return this.request<RAGFile>('POST', `/api/backend/rag/folders/${folderId}/files`, {
      filename,
      content: base64,
      mimeType,
    })
  }
  
  async getRAGFile(id: string): Promise<RAGFile | null> {
    return this.request<RAGFile | null>('GET', `/api/backend/rag/files/${id}`)
  }
  
  async getRAGFiles(folderId: string): Promise<RAGFile[]> {
    return this.request<RAGFile[]>('GET', `/api/backend/rag/folders/${folderId}/files`)
  }
  
  async deleteRAGFile(id: string): Promise<boolean> {
    return this.request<boolean>('DELETE', `/api/backend/rag/files/${id}`)
  }
  
  async addRAGChunk(
    fileId: string,
    chunkIndex: number,
    content: string,
    embedding?: number[]
  ): Promise<RAGChunk> {
    return this.request<RAGChunk>('POST', `/api/backend/rag/files/${fileId}/chunks`, {
      chunkIndex,
      content,
      embedding,
    })
  }
  
  async getRAGChunks(fileId: string): Promise<RAGChunk[]> {
    return this.request<RAGChunk[]>('GET', `/api/backend/rag/files/${fileId}/chunks`)
  }
  
  // ========== Skills ==========
  
  async getSkill(id: string): Promise<Skill | null> {
    return this.request<Skill | null>('GET', `/api/backend/skills/${id}`)
  }
  
  async getSkillByName(name: string): Promise<Skill | null> {
    return this.request<Skill | null>('GET', `/api/backend/skills/by-name/${encodeURIComponent(name)}`)
  }
  
  async listSkills(enabledOnly = false): Promise<Skill[]> {
    return this.request<Skill[]>('GET', `/api/backend/skills?enabledOnly=${enabledOnly}`)
  }
  
  // ========== Execution Logger ==========
  
  async createExecution(execution: Omit<AgentExecution, 'id'>): Promise<AgentExecution> {
    return this.request<AgentExecution>('POST', '/api/backend/executions', execution)
  }
  
  async getExecution(id: string): Promise<AgentExecution | null> {
    return this.request<AgentExecution | null>('GET', `/api/backend/executions/${id}`)
  }
  
  async updateExecution(id: string, updates: Partial<AgentExecution>): Promise<AgentExecution | null> {
    return this.request<AgentExecution | null>('PATCH', `/api/backend/executions/${id}`, updates)
  }
  
  async addToolCall(toolCall: Omit<ToolCall, 'id'>): Promise<ToolCall> {
    return this.request<ToolCall>('POST', `/api/backend/executions/${toolCall.executionId}/tool-calls`, toolCall)
  }
  
  async getToolCalls(executionId: string): Promise<ToolCall[]> {
    return this.request<ToolCall[]>('GET', `/api/backend/executions/${executionId}/tool-calls`)
  }
  
  async addLog(log: Omit<AgentLog, 'id'>): Promise<AgentLog> {
    return this.request<AgentLog>('POST', `/api/backend/executions/${log.executionId}/logs`, log)
  }
  
  async getLogs(executionId: string): Promise<AgentLog[]> {
    return this.request<AgentLog[]>('GET', `/api/backend/executions/${executionId}/logs`)
  }
}



