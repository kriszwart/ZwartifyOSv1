/**
 * Tool Context
 * 
 * Provides a way for tools to access the current execution context,
 * specifically the agent ID of the agent calling the tool and the original user prompt.
 */

let currentAgentId: string | undefined
let originalPrompt: string | undefined

/**
 * Set the tool execution context with agent ID and original prompt
 */
export function setToolContext(agentId?: string, prompt?: string): void {
  currentAgentId = agentId
  originalPrompt = prompt
}

/**
 * Get the current agent ID from tool execution context
 */
export function getCurrentAgentId(): string | undefined {
  return currentAgentId
}

/**
 * Get the original user prompt from tool execution context
 */
export function getOriginalPrompt(): string | undefined {
  return originalPrompt
}

/**
 * Set the original prompt in tool context
 */
export function setOriginalPrompt(prompt?: string): void {
  originalPrompt = prompt
}

/**
 * Clear the tool context
 */
export function clearToolContext(): void {
  currentAgentId = undefined
  originalPrompt = undefined
}

