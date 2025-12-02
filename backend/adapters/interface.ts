/**
 * Backend Adapter Interface
 * 
 * Defines the interface for backend storage adapters.
 * Allows switching between in-memory (default) and remote backend (your service).
 * 
 * All methods are async to support remote backend calls.
 */

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

/**
 * Backend Adapter Interface
 * 
 * All storage operations go through this interface.
 * Implementations can be in-memory (default) or remote (your backend service).
 */
export interface BackendAdapter {
  // ========== Agents ==========
  
  /**
   * Create a new agent
   */
  createAgent(config: AgentConfig, id?: string): Promise<AgentDefinition>
  
  /**
   * Get agent by ID
   */
  getAgent(id: string): Promise<AgentDefinition | null>
  
  /**
   * Get agent by name
   */
  getAgentByName(name: string): Promise<AgentDefinition | null>
  
  /**
   * List all agents
   */
  listAgents(enabledOnly?: boolean): Promise<AgentDefinition[]>
  
  /**
   * Update agent
   */
  updateAgent(id: string, updates: Partial<AgentConfig>): Promise<AgentDefinition | null>
  
  /**
   * Delete agent
   */
  deleteAgent(id: string): Promise<boolean>
  
  // ========== Memory/Conversations ==========
  
  /**
   * Create a new conversation
   */
  createConversation(
    agentId: string,
    title?: string,
    metadata?: Record<string, unknown>
  ): Promise<Conversation>
  
  /**
   * Get conversation by ID
   */
  getConversation(id: string): Promise<Conversation | null>
  
  /**
   * Get conversations for an agent
   */
  getAgentConversations(agentId: string, limit?: number): Promise<Conversation[]>
  
  /**
   * Get latest conversation for an agent
   */
  getLatestConversation(agentId: string): Promise<Conversation | null>
  
  /**
   * Add message to conversation
   */
  addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<ConversationMessage | null>
  
  /**
   * Get conversation context (last N messages)
   */
  getConversationContext(conversationId: string, maxMessages?: number): Promise<ConversationMessage[]>
  
  /**
   * Get agent context (last N messages across all conversations)
   */
  getAgentContext(agentId: string, maxMessages?: number): Promise<ConversationMessage[]>
  
  /**
   * Delete conversation
   */
  deleteConversation(id: string): Promise<boolean>
  
  /**
   * Prune old conversations (keep only last N per agent)
   */
  pruneConversations(agentId: string, keepCount?: number): Promise<void>
  
  // ========== Sessions ==========
  
  /**
   * Create a new agent session
   */
  createSession(options: CreateSessionOptions): Promise<AgentSession>
  
  /**
   * Get session by ID
   */
  getSession(sessionId: string): Promise<AgentSession | null>
  
  /**
   * Get sessions for an agent
   */
  getAgentSessions(agentId: string): Promise<AgentSession[]>
  
  /**
   * Update session
   */
  updateSession(sessionId: string, updates: Partial<AgentSession>): Promise<AgentSession | null>
  
  /**
   * Delete session
   */
  deleteSession(sessionId: string): Promise<boolean>
  
  /**
   * List all active sessions
   */
  listSessions(agentId?: string): Promise<AgentSession[]>
  
  // ========== Agent State ==========
  
  /**
   * Get current state for an agent
   */
  getAgentState(agentId: string): Promise<AgentStateSnapshot | null>
  
  /**
   * Create initial state for an agent
   */
  createAgentState(
    agentId: string,
    options: {
      goals?: Array<{ description: string; priority?: number; dependencies?: string[] }>
      context?: Record<string, unknown>
      metadata?: Record<string, unknown>
    }
  ): Promise<AgentStateSnapshot>
  
  /**
   * Update agent state
   */
  updateAgentState(
    agentId: string,
    updates: Partial<Pick<AgentStateSnapshot, 'currentGoalId' | 'context' | 'metadata'>>
  ): Promise<AgentStateSnapshot | null>
  
  /**
   * Get state history for an agent
   */
  getStateHistory(agentId: string, limit?: number): Promise<AgentStateSnapshot[]>
  
  /**
   * Create state snapshot
   */
  createSnapshot(agentId: string): Promise<AgentStateSnapshot | null>
  
  // ========== Analytics ==========
  
  /**
   * Record execution for analytics
   */
  recordExecution(record: Omit<ExecutionRecord, 'id' | 'timestamp'>): Promise<void>
  
  /**
   * Get performance metrics for an agent
   */
  getAgentMetrics(agentId: string): Promise<AgentPerformanceMetrics | null>
  
  /**
   * Get all agent metrics
   */
  getAllMetrics(): Promise<AgentPerformanceMetrics[]>
  
  // ========== Error Analysis ==========
  
  /**
   * Record an error for analysis
   */
  recordError(
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
  ): Promise<ErrorRecord>
  
  /**
   * Get error analysis for an agent
   */
  getErrorAnalysis(agentId: string): Promise<ErrorAnalysisResult | null>
  
  /**
   * Get error records for an agent
   */
  getErrorRecords(agentId: string, limit?: number): Promise<ErrorRecord[]>
  
  // ========== Jobs ==========
  
  /**
   * Create a new background job
   */
  createJob(options: CreateJobOptions): Promise<Job>
  
  /**
   * Get job by ID
   */
  getJob(jobId: string): Promise<Job | null>
  
  /**
   * Get jobs for an agent
   */
  getAgentJobs(agentId: string): Promise<Job[]>
  
  /**
   * Update job
   */
  updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null>
  
  /**
   * List all jobs
   */
  listJobs(agentId?: string, status?: string): Promise<Job[]>
  
  // ========== Triggers ==========
  
  /**
   * Create a new trigger
   */
  createTrigger(options: {
    name: string
    agentId: string
    type: 'webhook' | 'schedule' | 'agent_completion'
    config: unknown
    conditions?: unknown[]
    inputTemplate?: string
    metadata?: Record<string, unknown>
  }): Promise<Trigger>
  
  /**
   * Get trigger by ID
   */
  getTrigger(triggerId: string): Promise<Trigger | null>
  
  /**
   * Get triggers for an agent
   */
  getAgentTriggers(agentId: string): Promise<Trigger[]>
  
  /**
   * Update trigger
   */
  updateTrigger(triggerId: string, updates: Partial<Trigger>): Promise<Trigger | null>
  
  /**
   * Delete trigger
   */
  deleteTrigger(triggerId: string): Promise<boolean>
  
  /**
   * List all triggers
   */
  listTriggers(agentId?: string): Promise<Trigger[]>
  
  // ========== Schedules ==========
  
  /**
   * Create a new schedule
   */
  createSchedule(options: {
    agentId: string
    cronExpression: string
    enabled?: boolean
    input?: string
    metadata?: Record<string, unknown>
  }): Promise<Schedule>
  
  /**
   * Get schedule by ID
   */
  getSchedule(scheduleId: string): Promise<Schedule | null>
  
  /**
   * Get schedules for an agent
   */
  getAgentSchedules(agentId: string): Promise<Schedule[]>
  
  /**
   * Update schedule
   */
  updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<Schedule | null>
  
  /**
   * Delete schedule
   */
  deleteSchedule(scheduleId: string): Promise<boolean>
  
  /**
   * List all schedules
   */
  listSchedules(agentId?: string, enabledOnly?: boolean): Promise<Schedule[]>
  
  /**
   * Get job history for a schedule
   */
  getScheduleJobHistory(scheduleId: string, limit?: number): Promise<ScheduleJobHistory[]>
  
  /**
   * Add job history entry
   */
  addScheduleJobHistory(history: Omit<ScheduleJobHistory, 'id'>): Promise<ScheduleJobHistory>
  
  // ========== RAG ==========
  
  /**
   * Create a RAG folder
   */
  createRAGFolder(name: string, metadata?: Record<string, unknown>): Promise<RAGFolder>
  
  /**
   * Get RAG folder by ID
   */
  getRAGFolder(id: string): Promise<RAGFolder | null>
  
  /**
   * Get RAG folder by name
   */
  getRAGFolderByName(name: string): Promise<RAGFolder | null>
  
  /**
   * List all RAG folders
   */
  listRAGFolders(): Promise<RAGFolder[]>
  
  /**
   * Delete RAG folder
   */
  deleteRAGFolder(id: string): Promise<boolean>
  
  /**
   * Add file to RAG folder
   */
  addRAGFile(
    folderId: string,
    filename: string,
    fileBuffer: Buffer,
    mimeType?: string
  ): Promise<RAGFile>
  
  /**
   * Get RAG file by ID
   */
  getRAGFile(id: string): Promise<RAGFile | null>
  
  /**
   * Get files in a folder
   */
  getRAGFiles(folderId: string): Promise<RAGFile[]>
  
  /**
   * Delete RAG file
   */
  deleteRAGFile(id: string): Promise<boolean>
  
  /**
   * Add chunk to RAG file
   */
  addRAGChunk(
    fileId: string,
    chunkIndex: number,
    content: string,
    embedding?: number[]
  ): Promise<RAGChunk>
  
  /**
   * Get chunks for a file
   */
  getRAGChunks(fileId: string): Promise<RAGChunk[]>
  
  // ========== Skills ==========
  
  /**
   * Get skill by ID
   */
  getSkill(id: string): Promise<Skill | null>
  
  /**
   * Get skill by name
   */
  getSkillByName(name: string): Promise<Skill | null>
  
  /**
   * List all skills
   */
  listSkills(enabledOnly?: boolean): Promise<Skill[]>
  
  // ========== Execution Logger ==========
  
  /**
   * Create execution record
   */
  createExecution(execution: Omit<AgentExecution, 'id'>): Promise<AgentExecution>
  
  /**
   * Get execution by ID
   */
  getExecution(id: string): Promise<AgentExecution | null>
  
  /**
   * Update execution
   */
  updateExecution(id: string, updates: Partial<AgentExecution>): Promise<AgentExecution | null>
  
  /**
   * Add tool call to execution
   */
  addToolCall(toolCall: Omit<ToolCall, 'id'>): Promise<ToolCall>
  
  /**
   * Get tool calls for an execution
   */
  getToolCalls(executionId: string): Promise<ToolCall[]>
  
  /**
   * Add log entry to execution
   */
  addLog(log: Omit<AgentLog, 'id'>): Promise<AgentLog>
  
  /**
   * Get logs for an execution
   */
  getLogs(executionId: string): Promise<AgentLog[]>
}
