/**
 * Scheduler Manager
 * 
 * Manages cron-based scheduling for agents
 */

import { randomUUID } from 'crypto'

export interface Schedule {
  id: string
  agentId: string
  cronExpression: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  lastRunAt?: Date
  nextRunAt?: Date
  metadata?: Record<string, unknown>
}

// In-memory stores (will be replaced with database)
const schedules = new Map<string, Schedule>()
const agentSchedules = new Map<string, string[]>() // agentId -> scheduleIds

/**
 * Parse cron expression and calculate next run time
 * Simple implementation - for production, use a proper cron parser like `node-cron`
 */
function calculateNextRun(cronExpression: string, fromDate: Date = new Date()): Date {
  // Basic cron parsing (supports: minute hour day month dayOfWeek)
  // For now, parse simple formats like "0 9 * * *" (every day at 9 AM)
  const parts = cronExpression.trim().split(/\s+/)
  
  if (parts.length < 5) {
    throw new Error('Invalid cron expression. Expected format: minute hour day month dayOfWeek')
  }

  const [minute, hour, day, month, dayOfWeek] = parts
  
  const next = new Date(fromDate)
  next.setSeconds(0)
  next.setMilliseconds(0)

  // Simple implementation: add 1 hour for now
  // TODO: Use proper cron parser (e.g., node-cron)
  next.setHours(next.getHours() + 1)
  
  return next
}

/**
 * Create a new schedule
 */
export function createSchedule(
  agentId: string,
  cronExpression: string,
  enabled: boolean = true,
  metadata?: Record<string, unknown>
): Schedule {
  const now = new Date()
  const schedule: Schedule = {
    id: randomUUID(),
    agentId,
    cronExpression,
    enabled,
    createdAt: now,
    updatedAt: now,
    nextRunAt: calculateNextRun(cronExpression, now),
    metadata,
  }

  schedules.set(schedule.id, schedule)
  
  // Track schedule for agent
  const agentScheds = agentSchedules.get(agentId) || []
  agentSchedules.set(agentId, [...agentScheds, schedule.id])

  return schedule
}

/**
 * Get schedule by ID
 */
export function getSchedule(id: string): Schedule | undefined {
  return schedules.get(id)
}

/**
 * Get schedules for an agent
 */
export function getAgentSchedules(agentId: string): Schedule[] {
  const scheduleIds = agentSchedules.get(agentId) || []
  return scheduleIds
    .map(id => schedules.get(id))
    .filter((sched): sched is Schedule => sched !== undefined)
}

/**
 * Get all enabled schedules
 */
export function getEnabledSchedules(): Schedule[] {
  return Array.from(schedules.values())
    .filter(s => s.enabled)
}

/**
 * Get schedules that are due to run
 */
export function getDueSchedules(): Schedule[] {
  const now = new Date()
  return getEnabledSchedules()
    .filter(s => s.nextRunAt && s.nextRunAt <= now)
}

/**
 * Update schedule
 */
export function updateSchedule(
  id: string,
  updates: Partial<Pick<Schedule, 'cronExpression' | 'enabled' | 'metadata'>>
): Schedule | null {
  const schedule = schedules.get(id)
  if (!schedule) return null

  const updated: Schedule = {
    ...schedule,
    ...updates,
    updatedAt: new Date(),
  }

  // Recalculate next run if cron expression changed
  if (updates.cronExpression) {
    updated.nextRunAt = calculateNextRun(updates.cronExpression)
  }

  schedules.set(id, updated)
  return updated
}

/**
 * Mark schedule as run
 */
export function markScheduleRun(id: string): void {
  const schedule = schedules.get(id)
  if (!schedule) return

  schedule.lastRunAt = new Date()
  schedule.nextRunAt = calculateNextRun(schedule.cronExpression, schedule.lastRunAt)
  schedule.updatedAt = new Date()
  schedules.set(id, schedule)
}

/**
 * Delete schedule
 */
export function deleteSchedule(id: string): boolean {
  const schedule = schedules.get(id)
  if (!schedule) return false

  // Remove from agent's schedule list
  const agentScheds = agentSchedules.get(schedule.agentId) || []
  agentSchedules.set(
    schedule.agentId,
    agentScheds.filter(schedId => schedId !== id)
  )

  return schedules.delete(id)
}

/**
 * Enable/disable schedule
 */
export function setScheduleEnabled(id: string, enabled: boolean): boolean {
  return updateSchedule(id, { enabled }) !== null
}

/**
 * List all schedules
 */
export function listSchedules(): Schedule[] {
  return Array.from(schedules.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

