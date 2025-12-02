/**
 * Scheduler Manager
 * 
 * Enhanced scheduler with proper cron parsing, job history, and retry logic.
 * Part of Claude SDK Integration for autonomous operation.
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
  // New fields for enhanced scheduler
  input?: string // Default input for scheduled runs
  retryCount: number
  maxRetries: number
  lastError?: string
}

export type JobHistoryStatus = 'success' | 'failed' | 'skipped'

export interface ScheduleJobHistory {
  id: string
  scheduleId: string
  agentId: string
  status: JobHistoryStatus
  input?: string
  output?: string
  error?: string
  startedAt: Date
  completedAt?: Date
  durationMs?: number
  retryAttempt: number
}

// In-memory stores (will be replaced with database)
const schedules = new Map<string, Schedule>()
const agentSchedules = new Map<string, string[]>() // agentId -> scheduleIds
const jobHistory = new Map<string, ScheduleJobHistory>() // jobId -> history
const scheduleJobHistory = new Map<string, string[]>() // scheduleId -> jobIds

// Common cron aliases
const CRON_ALIASES: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@hourly': '0 * * * *',
  '@midnight': '0 0 * * *',
}

/**
 * Parse a cron field (handles *, ranges, lists, and steps)
 */
function parseCronField(field: string, min: number, max: number): number[] {
  const values: number[] = []

  // Handle wildcard
  if (field === '*') {
    for (let i = min; i <= max; i++) {
      values.push(i)
    }
    return values
  }

  // Handle step values (e.g., */5, 0-30/2)
  if (field.includes('/')) {
    const [range, step] = field.split('/')
    const stepValue = parseInt(step, 10)
    let rangeValues: number[]

    if (range === '*') {
      rangeValues = []
      for (let i = min; i <= max; i++) {
        rangeValues.push(i)
      }
    } else if (range.includes('-')) {
      const [start, end] = range.split('-').map(n => parseInt(n, 10))
      rangeValues = []
      for (let i = start; i <= end; i++) {
        rangeValues.push(i)
      }
    } else {
      rangeValues = [parseInt(range, 10)]
    }

    for (let i = 0; i < rangeValues.length; i += stepValue) {
      values.push(rangeValues[i])
    }
    return values
  }

  // Handle ranges (e.g., 1-5)
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(n => parseInt(n, 10))
    for (let i = start; i <= end; i++) {
      values.push(i)
    }
    return values
  }

  // Handle lists (e.g., 1,3,5)
  if (field.includes(',')) {
    return field.split(',').map(n => parseInt(n.trim(), 10))
  }

  // Single value
  values.push(parseInt(field, 10))
  return values
}

/**
 * Validate a cron expression
 */
export function validateCronExpression(expression: string): { valid: boolean; error?: string } {
  // Handle aliases
  const expr = CRON_ALIASES[expression.toLowerCase()] || expression
  const parts = expr.trim().split(/\s+/)

  if (parts.length < 5) {
    return { valid: false, error: 'Cron expression must have at least 5 fields (minute hour day month dayOfWeek)' }
  }

  const [minute, hour, day, month, dayOfWeek] = parts

  try {
    const mins = parseCronField(minute, 0, 59)
    const hours = parseCronField(hour, 0, 23)
    const days = parseCronField(day, 1, 31)
    const months = parseCronField(month, 1, 12)
    const daysOfWeek = parseCronField(dayOfWeek, 0, 6)

    if (mins.some(v => v < 0 || v > 59)) return { valid: false, error: 'Invalid minute value (0-59)' }
    if (hours.some(v => v < 0 || v > 23)) return { valid: false, error: 'Invalid hour value (0-23)' }
    if (days.some(v => v < 1 || v > 31)) return { valid: false, error: 'Invalid day value (1-31)' }
    if (months.some(v => v < 1 || v > 12)) return { valid: false, error: 'Invalid month value (1-12)' }
    if (daysOfWeek.some(v => v < 0 || v > 6)) return { valid: false, error: 'Invalid day of week value (0-6)' }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Failed to parse cron expression' }
  }
}

/**
 * Calculate the next run time from a cron expression
 * Proper implementation that iterates forward until a match is found
 */
export function calculateNextRun(cronExpression: string, fromDate: Date = new Date()): Date {
  // Handle aliases
  const expr = CRON_ALIASES[cronExpression.toLowerCase()] || cronExpression
  const parts = expr.trim().split(/\s+/)

  if (parts.length < 5) {
    throw new Error('Invalid cron expression. Expected format: minute hour day month dayOfWeek')
  }

  const [minute, hour, day, month, dayOfWeek] = parts

  const validMinutes = parseCronField(minute, 0, 59)
  const validHours = parseCronField(hour, 0, 23)
  const validDays = parseCronField(day, 1, 31)
  const validMonths = parseCronField(month, 1, 12)
  const validDaysOfWeek = parseCronField(dayOfWeek, 0, 6)

  // Start from the next minute
  const next = new Date(fromDate)
  next.setSeconds(0)
  next.setMilliseconds(0)
  next.setMinutes(next.getMinutes() + 1)

  // Maximum iterations to prevent infinite loops
  const maxIterations = 366 * 24 * 60 // One year of minutes
  let iterations = 0

  while (iterations < maxIterations) {
    iterations++

    const m = next.getMinutes()
    const h = next.getHours()
    const d = next.getDate()
    const mon = next.getMonth() + 1 // JavaScript months are 0-indexed
    const dow = next.getDay()

    // Check if current time matches cron expression
    const matchesMonth = validMonths.includes(mon)
    const matchesDay = validDays.includes(d)
    const matchesDayOfWeek = validDaysOfWeek.includes(dow)
    const matchesHour = validHours.includes(h)
    const matchesMinute = validMinutes.includes(m)

    // Day matching: if both day and dayOfWeek are specified (not *), match either
    const daySpecified = day !== '*'
    const dowSpecified = dayOfWeek !== '*'
    const matchesDayCondition = daySpecified && dowSpecified
      ? matchesDay || matchesDayOfWeek
      : matchesDay && matchesDayOfWeek

    if (matchesMonth && matchesDayCondition && matchesHour && matchesMinute) {
      return next
    }

    // Advance time intelligently
    if (!matchesMonth) {
      // Jump to start of next valid month
      next.setMonth(next.getMonth() + 1)
      next.setDate(1)
      next.setHours(0)
      next.setMinutes(0)
    } else if (!matchesDayCondition) {
      // Jump to next day
      next.setDate(next.getDate() + 1)
      next.setHours(0)
      next.setMinutes(0)
    } else if (!matchesHour) {
      // Jump to next hour
      next.setHours(next.getHours() + 1)
      next.setMinutes(0)
    } else {
      // Jump to next minute
      next.setMinutes(next.getMinutes() + 1)
    }
  }

  // Fallback: return 1 hour from now
  const fallback = new Date(fromDate)
  fallback.setHours(fallback.getHours() + 1)
  return fallback
}

/**
 * Describe a cron expression in human-readable format
 */
export function describeCronExpression(expression: string): string {
  // Handle aliases
  const aliasName = Object.keys(CRON_ALIASES).find(k => CRON_ALIASES[k] === expression)
  if (aliasName) {
    const descriptions: Record<string, string> = {
      '@yearly': 'Once a year at midnight on January 1st',
      '@annually': 'Once a year at midnight on January 1st',
      '@monthly': 'Once a month at midnight on the 1st',
      '@weekly': 'Once a week at midnight on Sunday',
      '@daily': 'Once a day at midnight',
      '@hourly': 'Once an hour at minute 0',
      '@midnight': 'Once a day at midnight',
    }
    return descriptions[aliasName] || expression
  }

  const parts = expression.trim().split(/\s+/)
  if (parts.length < 5) return expression

  const [minute, hour, day, month, dayOfWeek] = parts

  const pieces: string[] = []

  // Minute
  if (minute === '*') {
    pieces.push('every minute')
  } else if (minute.includes('/')) {
    pieces.push(`every ${minute.split('/')[1]} minutes`)
  } else {
    pieces.push(`at minute ${minute}`)
  }

  // Hour
  if (hour !== '*') {
    if (hour.includes('/')) {
      pieces.push(`every ${hour.split('/')[1]} hours`)
    } else {
      pieces.push(`at ${hour}:00`)
    }
  }

  // Day/DayOfWeek
  if (day !== '*' && dayOfWeek !== '*') {
    pieces.push(`on day ${day} and ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(dayOfWeek)] || dayOfWeek}`)
  } else if (day !== '*') {
    pieces.push(`on day ${day}`)
  } else if (dayOfWeek !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    pieces.push(`on ${days[parseInt(dayOfWeek)] || dayOfWeek}`)
  }

  // Month
  if (month !== '*') {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    pieces.push(`in ${months[parseInt(month)] || month}`)
  }

  return pieces.join(', ')
}

/**
 * Create a new schedule
 */
export function createSchedule(
  agentId: string,
  cronExpression: string,
  options: {
    enabled?: boolean
    input?: string
    maxRetries?: number
    metadata?: Record<string, unknown>
  } = {}
): Schedule {
  // Validate cron expression
  const validation = validateCronExpression(cronExpression)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const now = new Date()
  const schedule: Schedule = {
    id: randomUUID(),
    agentId,
    cronExpression,
    enabled: options.enabled !== false,
    createdAt: now,
    updatedAt: now,
    nextRunAt: calculateNextRun(cronExpression, now),
    input: options.input,
    retryCount: 0,
    maxRetries: options.maxRetries ?? 3,
    metadata: options.metadata,
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
  updates: Partial<Pick<Schedule, 'cronExpression' | 'enabled' | 'input' | 'maxRetries' | 'metadata'>>
): Schedule | null {
  const schedule = schedules.get(id)
  if (!schedule) return null

  // Validate new cron expression if provided
  if (updates.cronExpression) {
    const validation = validateCronExpression(updates.cronExpression)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
  }

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
 * Record schedule job history
 */
export function recordJobHistory(
  scheduleId: string,
  status: JobHistoryStatus,
  options: {
    input?: string
    output?: string
    error?: string
    startedAt: Date
    completedAt?: Date
    retryAttempt?: number
  }
): ScheduleJobHistory {
  const schedule = schedules.get(scheduleId)
  if (!schedule) throw new Error(`Schedule not found: ${scheduleId}`)

  const durationMs = options.completedAt 
    ? options.completedAt.getTime() - options.startedAt.getTime()
    : undefined

  const history: ScheduleJobHistory = {
    id: randomUUID(),
    scheduleId,
    agentId: schedule.agentId,
    status,
    input: options.input,
    output: options.output,
    error: options.error,
    startedAt: options.startedAt,
    completedAt: options.completedAt,
    durationMs,
    retryAttempt: options.retryAttempt ?? 0,
  }

  jobHistory.set(history.id, history)

  // Track history for schedule
  const scheduleHistory = scheduleJobHistory.get(scheduleId) || []
  scheduleJobHistory.set(scheduleId, [...scheduleHistory, history.id])

  return history
}

/**
 * Mark schedule as run (success or failure)
 */
export function markScheduleRun(
  id: string,
  status: 'success' | 'failed',
  options: {
    output?: string
    error?: string
    startedAt?: Date
  } = {}
): void {
  const schedule = schedules.get(id)
  if (!schedule) return

  const now = new Date()
  const startedAt = options.startedAt || schedule.lastRunAt || now

  // Record in history
  recordJobHistory(id, status, {
    input: schedule.input,
    output: options.output,
    error: options.error,
    startedAt,
    completedAt: now,
    retryAttempt: schedule.retryCount,
  })

  // Update schedule
  schedule.lastRunAt = now
  schedule.updatedAt = now

  if (status === 'failed') {
    schedule.retryCount++
    schedule.lastError = options.error

    // If under max retries, schedule retry (5 minutes later)
    if (schedule.retryCount < schedule.maxRetries) {
      schedule.nextRunAt = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes
    } else {
      // Max retries exceeded, schedule normal next run
      schedule.nextRunAt = calculateNextRun(schedule.cronExpression, now)
      schedule.retryCount = 0 // Reset for next normal run
    }
  } else {
    // Success - reset retry count and schedule next run
    schedule.retryCount = 0
    schedule.lastError = undefined
    schedule.nextRunAt = calculateNextRun(schedule.cronExpression, now)
  }

  schedules.set(id, schedule)
}

/**
 * Get job history for a schedule
 */
export function getScheduleHistory(scheduleId: string, limit?: number): ScheduleJobHistory[] {
  const historyIds = scheduleJobHistory.get(scheduleId) || []
  let history = historyIds
    .map(id => jobHistory.get(id))
    .filter((h): h is ScheduleJobHistory => h !== undefined)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

  if (limit) {
    history = history.slice(0, limit)
  }

  return history
}

/**
 * Get all job history
 */
export function getAllJobHistory(options?: {
  status?: JobHistoryStatus
  agentId?: string
  limit?: number
}): ScheduleJobHistory[] {
  let result = Array.from(jobHistory.values())

  if (options?.status) {
    result = result.filter(h => h.status === options.status)
  }

  if (options?.agentId) {
    result = result.filter(h => h.agentId === options.agentId)
  }

  // Sort by start time (newest first)
  result.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

  if (options?.limit) {
    result = result.slice(0, options.limit)
  }

  return result
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

  // Note: We keep job history for audit purposes

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

/**
 * Clean up old job history
 */
export function cleanupJobHistory(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): number {
  const cutoff = new Date(Date.now() - maxAgeMs)
  let cleaned = 0

  for (const [historyId, history] of jobHistory.entries()) {
    if (history.startedAt < cutoff) {
      // Remove from schedule's history list
      const scheduleHistory = scheduleJobHistory.get(history.scheduleId) || []
      scheduleJobHistory.set(
        history.scheduleId,
        scheduleHistory.filter(id => id !== historyId)
      )

      jobHistory.delete(historyId)
      cleaned++
    }
  }

  return cleaned
}
