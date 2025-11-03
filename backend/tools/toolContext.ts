/**
 * Tool Context
 * 
 * Provides a way for tools to access the current execution context,
 * specifically the agent ID of the agent calling the tool.
 */

let currentAgentId: string | undefined

/**
 * Set the current agent ID for tool execution context
 */
export function setToolContext(agentId?: string): void {
  currentAgentId = agentId
}

/**
 * Get the current agent ID from tool execution context
 */
export function getCurrentAgentId(): string | undefined {
  return currentAgentId
}

/**
 * Clear the tool context
 */
export function clearToolContext(): void {
  currentAgentId = undefined
}

