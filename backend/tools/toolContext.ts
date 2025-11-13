/**
 * Tool Context Module
 * 
 * Manages context for tool execution (agent ID, user prompt, etc.)
 */

let currentAgentId: string | undefined
let currentUserPrompt: string | undefined

/**
 * Set tool context
 * @param agentId - Current agent ID
 * @param userPrompt - Original user prompt
 */
export function setToolContext(agentId?: string, userPrompt?: string): void {
  currentAgentId = agentId
  currentUserPrompt = userPrompt
}

/**
 * Clear tool context
 */
export function clearToolContext(): void {
  currentAgentId = undefined
  currentUserPrompt = undefined
}

/**
 * Get current agent ID
 */
export function getCurrentAgentId(): string | undefined {
  return currentAgentId
}

/**
 * Get current user prompt
 */
export function getCurrentUserPrompt(): string | undefined {
  return currentUserPrompt
}

