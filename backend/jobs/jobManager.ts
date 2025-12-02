/**
 * Job Manager
 * 
 * Manages background job execution for long-running agent tasks.
 * Part of Claude SDK Integration for autonomous operation.
 */

import { randomUUID } from 'crypto'
import { agentClient, AgentRunOptions, AutonomousRunResult } from '../agents/agentClient'

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface JobResult {
  output?: string
  toolChain?: Array<{
    toolName: string
    durationMs: number
  }>
  iterationCount?: number
  error?: string
}

export interface Job {
  id: string
  agentId: string
  status: JobStatus
  input: string
  options: Omit<AgentRunOptions, 'userApiKey'> // Don't store API keys
  result?: JobResult
  progress: number // 0-100
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
  metadata?: Record<string, unknown>
}

export interface CreateJobOptions {
  agentId: string
  input: string
  options?: AgentRunOptions
  metadata?: Record<string, unknown>
}

// In-memory job store (can be upgraded to Redis/database later)
const jobs = new Map<string, Job>()
const agentJobs = new Map<string, string[]>() // agentId -> jobIds

// Job processing queue
const jobQueue: string[] = []
let isProcessing = false
const MAX_CONCURRENT_JOBS = 3
let activeJobCount = 0

/**
 * Create a new background job
 */
export function createJob(options: CreateJobOptions): Job {
  const now = new Date()
  
  // Remove API key from stored options for security
  const { userApiKey, ...safeOptions } = options.options || {}
  
  const job: Job = {
    id: randomUUID(),
    agentId: options.agentId,
    status: 'pending',
    input: options.input,
    options: safeOptions,
    progress: 0,
    createdAt: now,
    metadata: options.metadata,
  }

  jobs.set(job.id, job)
  
  // Track job for agent
  const existingJobs = agentJobs.get(options.agentId) || []
  agentJobs.set(options.agentId, [...existingJobs, job.id])

  // Add to queue
  jobQueue.push(job.id)
  
  // Start processing if not already running
  processQueue()

  return job
}

/**
 * Get job by ID
 */
export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId)
}

/**
 * Get jobs for an agent
 */
export function getAgentJobs(agentId: string): Job[] {
  const jobIds = agentJobs.get(agentId) || []
  return jobIds
    .map(id => jobs.get(id))
    .filter((j): j is Job => j !== undefined)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Cancel a pending job
 */
export function cancelJob(jobId: string): boolean {
  const job = jobs.get(jobId)
  if (!job) return false
  
  if (job.status !== 'pending') {
    return false // Can only cancel pending jobs
  }

  job.status = 'cancelled'
  job.completedAt = new Date()
  jobs.set(jobId, job)

  // Remove from queue
  const queueIndex = jobQueue.indexOf(jobId)
  if (queueIndex !== -1) {
    jobQueue.splice(queueIndex, 1)
  }

  return true
}

/**
 * Delete a completed/failed/cancelled job
 */
export function deleteJob(jobId: string): boolean {
  const job = jobs.get(jobId)
  if (!job) return false

  // Can only delete finished jobs
  if (job.status === 'running') return false

  // Remove from agent's job list
  const agentJobIds = agentJobs.get(job.agentId) || []
  agentJobs.set(
    job.agentId,
    agentJobIds.filter(id => id !== jobId)
  )

  return jobs.delete(jobId)
}

/**
 * List jobs with optional filters
 */
export function listJobs(options?: {
  status?: JobStatus
  agentId?: string
  limit?: number
}): Job[] {
  let result = Array.from(jobs.values())

  if (options?.status) {
    result = result.filter(j => j.status === options.status)
  }

  if (options?.agentId) {
    result = result.filter(j => j.agentId === options.agentId)
  }

  // Sort by creation time (newest first)
  result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  if (options?.limit) {
    result = result.slice(0, options.limit)
  }

  return result
}

/**
 * Get queue status
 */
export function getQueueStatus(): {
  pending: number
  running: number
  completed: number
  failed: number
  queueLength: number
} {
  const allJobs = Array.from(jobs.values())
  
  return {
    pending: allJobs.filter(j => j.status === 'pending').length,
    running: allJobs.filter(j => j.status === 'running').length,
    completed: allJobs.filter(j => j.status === 'completed').length,
    failed: allJobs.filter(j => j.status === 'failed').length,
    queueLength: jobQueue.length,
  }
}

/**
 * Process the job queue
 */
async function processQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true

  while (jobQueue.length > 0 && activeJobCount < MAX_CONCURRENT_JOBS) {
    const jobId = jobQueue.shift()
    if (!jobId) continue

    const job = jobs.get(jobId)
    if (!job || job.status !== 'pending') continue

    // Start job execution (don't await - run in background)
    executeJob(jobId).catch(err => {
      console.error(`Error executing job ${jobId}:`, err)
    })
  }

  isProcessing = false
}

/**
 * Execute a single job
 */
async function executeJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId)
  if (!job) return

  activeJobCount++

  try {
    // Update job status
    job.status = 'running'
    job.startedAt = new Date()
    job.progress = 10
    jobs.set(jobId, job)

    // Get API key from environment for background execution
    const { getEnvConfig } = await import('../config/env')
    const config = getEnvConfig()
    
    if (!config.CLAUDE_API_KEY) {
      throw new Error('API key not configured for background jobs')
    }

    // Run the agent
    job.progress = 20
    jobs.set(jobId, job)

    // Use autonomous mode if enabled, otherwise regular run
    let result: AutonomousRunResult | { output_text: string; executionId?: string }
    
    if (job.options.autonomousMode) {
      result = await agentClient.runAutonomous(job.input, {
        ...job.options,
        userApiKey: config.CLAUDE_API_KEY,
      })
      
      job.result = {
        output: result.output_text,
        toolChain: (result as AutonomousRunResult).toolChain?.map(t => ({
          toolName: t.toolName,
          durationMs: t.durationMs,
        })),
        iterationCount: (result as AutonomousRunResult).iterationCount,
      }
    } else {
      result = await agentClient.run(job.input, {
        ...job.options,
        userApiKey: config.CLAUDE_API_KEY,
      })
      
      job.result = {
        output: result.output_text,
      }
    }

    // Update job as completed
    job.status = 'completed'
    job.progress = 100
    job.completedAt = new Date()
    jobs.set(jobId, job)

  } catch (error) {
    // Update job as failed
    job.status = 'failed'
    job.progress = 0
    job.completedAt = new Date()
    job.error = error instanceof Error ? error.message : String(error)
    jobs.set(jobId, job)
  } finally {
    activeJobCount--
    
    // Continue processing queue
    processQueue()
  }
}

/**
 * Retry a failed job
 */
export function retryJob(jobId: string): Job | null {
  const job = jobs.get(jobId)
  if (!job) return null
  
  if (job.status !== 'failed') {
    return null // Can only retry failed jobs
  }

  // Reset job state
  job.status = 'pending'
  job.progress = 0
  job.startedAt = undefined
  job.completedAt = undefined
  job.error = undefined
  job.result = undefined
  jobs.set(jobId, job)

  // Add back to queue
  jobQueue.push(jobId)
  processQueue()

  return job
}

/**
 * Clean up old completed/failed jobs
 */
export function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const cutoff = new Date(Date.now() - maxAgeMs)
  let cleaned = 0

  for (const [jobId, job] of jobs.entries()) {
    if (
      (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
      job.completedAt &&
      job.completedAt < cutoff
    ) {
      deleteJob(jobId)
      cleaned++
    }
  }

  return cleaned
}




