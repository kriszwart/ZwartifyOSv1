/**
 * Trigger Manager
 * 
 * Manages event-driven triggers for agents:
 * - Webhook triggers (incoming HTTP)
 * - Schedule triggers (via scheduler)
 * - Agent completion triggers (agent A triggers agent B)
 * 
 * Part of Claude SDK Integration for autonomous operation.
 */

import { randomUUID } from 'crypto'

export type TriggerType = 'webhook' | 'schedule' | 'agent_completion'
export type TriggerStatus = 'active' | 'paused' | 'disabled'

export interface TriggerCondition {
  field: string
  operator: 'equals' | 'contains' | 'matches' | 'exists' | 'greater_than' | 'less_than'
  value?: string | number
}

export interface Trigger {
  id: string
  name: string
  agentId: string
  type: TriggerType
  status: TriggerStatus
  createdAt: Date
  updatedAt: Date
  lastTriggeredAt?: Date
  triggerCount: number
  
  // Type-specific configuration
  config: WebhookConfig | ScheduleConfig | AgentCompletionConfig
  
  // Optional conditions that must be met
  conditions?: TriggerCondition[]
  
  // Transform input before sending to agent
  inputTemplate?: string // e.g., "Process this webhook: {{payload}}"
  
  metadata?: Record<string, unknown>
}

export interface WebhookConfig {
  type: 'webhook'
  secret?: string // For validating webhook signatures
  allowedMethods?: ('GET' | 'POST' | 'PUT')[]
  allowedOrigins?: string[]
}

export interface ScheduleConfig {
  type: 'schedule'
  scheduleId: string // Reference to a schedule in scheduler/manager
}

export interface AgentCompletionConfig {
  type: 'agent_completion'
  sourceAgentId: string // The agent that triggers this
  onStatus?: 'success' | 'failure' | 'any'
  outputConditions?: TriggerCondition[]
}

export interface TriggerEvent {
  id: string
  triggerId: string
  type: TriggerType
  status: 'pending' | 'processing' | 'completed' | 'failed'
  payload: unknown
  agentInput?: string
  agentOutput?: string
  error?: string
  createdAt: Date
  processedAt?: Date
}

// In-memory stores
const triggers = new Map<string, Trigger>()
const agentTriggers = new Map<string, string[]>() // agentId -> triggerIds
const triggerEvents = new Map<string, TriggerEvent>()
const triggerEventHistory = new Map<string, string[]>() // triggerId -> eventIds

// Event handlers for agent completion triggers
const completionListeners = new Map<string, Set<string>>() // sourceAgentId -> Set<triggerId>

/**
 * Create a new trigger
 */
export function createTrigger(options: {
  name: string
  agentId: string
  type: TriggerType
  config: WebhookConfig | ScheduleConfig | AgentCompletionConfig
  conditions?: TriggerCondition[]
  inputTemplate?: string
  metadata?: Record<string, unknown>
}): Trigger {
  const now = new Date()
  
  const trigger: Trigger = {
    id: randomUUID(),
    name: options.name,
    agentId: options.agentId,
    type: options.type,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    triggerCount: 0,
    config: options.config,
    conditions: options.conditions,
    inputTemplate: options.inputTemplate,
    metadata: options.metadata,
  }

  triggers.set(trigger.id, trigger)

  // Track trigger for agent
  const existing = agentTriggers.get(options.agentId) || []
  agentTriggers.set(options.agentId, [...existing, trigger.id])

  // Register completion listener if applicable
  if (options.type === 'agent_completion') {
    const config = options.config as AgentCompletionConfig
    const listeners = completionListeners.get(config.sourceAgentId) || new Set()
    listeners.add(trigger.id)
    completionListeners.set(config.sourceAgentId, listeners)
  }

  return trigger
}

/**
 * Get trigger by ID
 */
export function getTrigger(id: string): Trigger | undefined {
  return triggers.get(id)
}

/**
 * Get triggers for an agent
 */
export function getAgentTriggers(agentId: string): Trigger[] {
  const triggerIds = agentTriggers.get(agentId) || []
  return triggerIds
    .map(id => triggers.get(id))
    .filter((t): t is Trigger => t !== undefined)
}

/**
 * Get triggers by type
 */
export function getTriggersByType(type: TriggerType): Trigger[] {
  return Array.from(triggers.values())
    .filter(t => t.type === type && t.status === 'active')
}

/**
 * Evaluate trigger conditions against payload
 */
export function evaluateConditions(
  conditions: TriggerCondition[] | undefined,
  payload: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) return true

  return conditions.every(condition => {
    const value = getNestedValue(payload, condition.field)

    switch (condition.operator) {
      case 'exists':
        return value !== undefined
      case 'equals':
        return value === condition.value
      case 'contains':
        return typeof value === 'string' && 
               typeof condition.value === 'string' && 
               value.includes(condition.value)
      case 'matches':
        return typeof value === 'string' && 
               typeof condition.value === 'string' && 
               new RegExp(condition.value).test(value)
      case 'greater_than':
        return typeof value === 'number' && 
               typeof condition.value === 'number' && 
               value > condition.value
      case 'less_than':
        return typeof value === 'number' && 
               typeof condition.value === 'number' && 
               value < condition.value
      default:
        return false
    }
  })
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Apply input template with payload substitution
 */
export function applyInputTemplate(template: string | undefined, payload: unknown): string {
  if (!template) {
    return typeof payload === 'string' ? payload : JSON.stringify(payload)
  }

  // Replace {{field}} placeholders with values from payload
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
    if (typeof payload !== 'object' || payload === null) {
      return path === 'payload' ? String(payload) : ''
    }
    const value = getNestedValue(payload as Record<string, unknown>, path)
    return value !== undefined ? String(value) : ''
  })
}

/**
 * Fire a trigger with payload
 * Returns a trigger event that can be processed
 */
export function fireTrigger(
  triggerId: string,
  payload: unknown
): TriggerEvent | null {
  const trigger = triggers.get(triggerId)
  if (!trigger || trigger.status !== 'active') return null

  // Evaluate conditions if webhook
  if (trigger.type === 'webhook' && trigger.conditions) {
    if (!evaluateConditions(trigger.conditions, payload as Record<string, unknown>)) {
      return null
    }
  }

  const now = new Date()
  
  // Create event
  const event: TriggerEvent = {
    id: randomUUID(),
    triggerId,
    type: trigger.type,
    status: 'pending',
    payload,
    agentInput: applyInputTemplate(trigger.inputTemplate, payload),
    createdAt: now,
  }

  triggerEvents.set(event.id, event)

  // Track event for trigger
  const history = triggerEventHistory.get(triggerId) || []
  triggerEventHistory.set(triggerId, [...history, event.id])

  // Update trigger stats
  trigger.lastTriggeredAt = now
  trigger.triggerCount++
  trigger.updatedAt = now
  triggers.set(triggerId, trigger)

  return event
}

/**
 * Mark event as processed
 */
export function markEventProcessed(
  eventId: string,
  status: 'completed' | 'failed',
  options: { output?: string; error?: string } = {}
): void {
  const event = triggerEvents.get(eventId)
  if (!event) return

  event.status = status
  event.processedAt = new Date()
  event.agentOutput = options.output
  event.error = options.error

  triggerEvents.set(eventId, event)
}

/**
 * Get pending events for a trigger
 */
export function getPendingEvents(triggerId?: string): TriggerEvent[] {
  let events = Array.from(triggerEvents.values())
    .filter(e => e.status === 'pending')

  if (triggerId) {
    events = events.filter(e => e.triggerId === triggerId)
  }

  return events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}

/**
 * Get event history for a trigger
 */
export function getTriggerEventHistory(triggerId: string, limit?: number): TriggerEvent[] {
  const eventIds = triggerEventHistory.get(triggerId) || []
  let events = eventIds
    .map(id => triggerEvents.get(id))
    .filter((e): e is TriggerEvent => e !== undefined)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  if (limit) {
    events = events.slice(0, limit)
  }

  return events
}

/**
 * Notify completion triggers when an agent finishes
 */
export function notifyAgentCompletion(
  agentId: string,
  status: 'success' | 'failure',
  output: string
): TriggerEvent[] {
  const listeners = completionListeners.get(agentId)
  if (!listeners) return []

  const events: TriggerEvent[] = []

  for (const triggerId of listeners) {
    const trigger = triggers.get(triggerId)
    if (!trigger || trigger.status !== 'active') continue

    const config = trigger.config as AgentCompletionConfig

    // Check status condition
    if (config.onStatus && config.onStatus !== 'any' && config.onStatus !== status) {
      continue
    }

    // Check output conditions
    if (config.outputConditions) {
      if (!evaluateConditions(config.outputConditions, { output, status })) {
        continue
      }
    }

    // Fire the trigger
    const event = fireTrigger(triggerId, { output, status, sourceAgentId: agentId })
    if (event) {
      events.push(event)
    }
  }

  return events
}

/**
 * Update trigger
 */
export function updateTrigger(
  id: string,
  updates: Partial<Pick<Trigger, 'name' | 'status' | 'conditions' | 'inputTemplate' | 'metadata'>>
): Trigger | null {
  const trigger = triggers.get(id)
  if (!trigger) return null

  const updated: Trigger = {
    ...trigger,
    ...updates,
    updatedAt: new Date(),
  }

  triggers.set(id, updated)
  return updated
}

/**
 * Delete trigger
 */
export function deleteTrigger(id: string): boolean {
  const trigger = triggers.get(id)
  if (!trigger) return false

  // Remove from agent's trigger list
  const agentTriggerIds = agentTriggers.get(trigger.agentId) || []
  agentTriggers.set(
    trigger.agentId,
    agentTriggerIds.filter(tId => tId !== id)
  )

  // Remove from completion listeners
  if (trigger.type === 'agent_completion') {
    const config = trigger.config as AgentCompletionConfig
    const listeners = completionListeners.get(config.sourceAgentId)
    if (listeners) {
      listeners.delete(id)
    }
  }

  return triggers.delete(id)
}

/**
 * List all triggers
 */
export function listTriggers(options?: {
  type?: TriggerType
  status?: TriggerStatus
  agentId?: string
}): Trigger[] {
  let result = Array.from(triggers.values())

  if (options?.type) {
    result = result.filter(t => t.type === options.type)
  }

  if (options?.status) {
    result = result.filter(t => t.status === options.status)
  }

  if (options?.agentId) {
    result = result.filter(t => t.agentId === options.agentId)
  }

  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Generate webhook URL for a trigger
 */
export function getWebhookUrl(triggerId: string, baseUrl: string): string {
  return `${baseUrl}/api/webhook/${triggerId}`
}

/**
 * Validate webhook request
 */
export function validateWebhookRequest(
  triggerId: string,
  method: string,
  origin?: string,
  signature?: string
): { valid: boolean; error?: string } {
  const trigger = triggers.get(triggerId)
  if (!trigger) {
    return { valid: false, error: 'Trigger not found' }
  }

  if (trigger.type !== 'webhook') {
    return { valid: false, error: 'Not a webhook trigger' }
  }

  if (trigger.status !== 'active') {
    return { valid: false, error: 'Trigger is not active' }
  }

  const config = trigger.config as WebhookConfig

  // Validate method
  if (config.allowedMethods && !config.allowedMethods.includes(method as 'GET' | 'POST' | 'PUT')) {
    return { valid: false, error: `Method ${method} not allowed` }
  }

  // Validate origin
  if (config.allowedOrigins && origin && !config.allowedOrigins.includes(origin)) {
    return { valid: false, error: 'Origin not allowed' }
  }

  // Validate signature if secret is configured
  // Note: Actual signature validation would need the request body
  // This is a placeholder for the structure
  if (config.secret && !signature) {
    return { valid: false, error: 'Webhook signature required' }
  }

  return { valid: true }
}

/**
 * Clean up old trigger events
 */
export function cleanupTriggerEvents(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): number {
  const cutoff = new Date(Date.now() - maxAgeMs)
  let cleaned = 0

  for (const [eventId, event] of triggerEvents.entries()) {
    if (event.createdAt < cutoff) {
      // Remove from trigger's history
      const history = triggerEventHistory.get(event.triggerId) || []
      triggerEventHistory.set(
        event.triggerId,
        history.filter(id => id !== eventId)
      )

      triggerEvents.delete(eventId)
      cleaned++
    }
  }

  return cleaned
}



