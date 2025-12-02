/**
 * Memory Store
 * 
 * Persists conversation history and context for agents
 * Now uses backend adapter for storage (in-memory or remote)
 */

import { getBackendAdapter } from '../adapters'

export interface ConversationMessage {
  id: string
  agentId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface Conversation {
  id: string
  agentId: string
  title?: string
  messages: ConversationMessage[]
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, unknown>
}

/**
 * Create a new conversation
 */
export async function createConversation(
  agentId: string,
  title?: string,
  metadata?: Record<string, unknown>
): Promise<Conversation> {
  const adapter = getBackendAdapter()
  return adapter.createConversation(agentId, title, metadata)
}

/**
 * Get conversation by ID
 */
export async function getConversation(id: string): Promise<Conversation | undefined> {
  const adapter = getBackendAdapter()
  return adapter.getConversation(id) ?? undefined
}

/**
 * Get conversations for an agent
 */
export async function getAgentConversations(agentId: string, limit = 50): Promise<Conversation[]> {
  const adapter = getBackendAdapter()
  return adapter.getAgentConversations(agentId, limit)
}

/**
 * Get latest conversation for an agent
 */
export async function getLatestConversation(agentId: string): Promise<Conversation | undefined> {
  const adapter = getBackendAdapter()
  return adapter.getLatestConversation(agentId) ?? undefined
}

/**
 * Add message to conversation
 */
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, unknown>
): Promise<ConversationMessage | null> {
  const adapter = getBackendAdapter()
  return adapter.addMessage(conversationId, role, content, metadata)
}

/**
 * Get conversation history for context (last N messages)
 */
export async function getConversationContext(
  conversationId: string,
  maxMessages: number = 10
): Promise<ConversationMessage[]> {
  const adapter = getBackendAdapter()
  return adapter.getConversationContext(conversationId, maxMessages)
}

/**
 * Get conversation history for agent (last N messages across all conversations)
 */
export async function getAgentContext(
  agentId: string,
  maxMessages: number = 10
): Promise<ConversationMessage[]> {
  const adapter = getBackendAdapter()
  return adapter.getAgentContext(agentId, maxMessages)
}

/**
 * Delete conversation
 */
export async function deleteConversation(id: string): Promise<boolean> {
  const adapter = getBackendAdapter()
  return adapter.deleteConversation(id)
}

/**
 * Prune old conversations (keep only last N per agent)
 */
export async function pruneConversations(agentId: string, keepCount: number = 10): Promise<void> {
  const adapter = getBackendAdapter()
  return adapter.pruneConversations(agentId, keepCount)
}

/**
 * Build conversation context string for prompt
 */
export async function buildConversationContext(
  agentId: string,
  maxMessages: number = 10
): Promise<string> {
  const messages = await getAgentContext(agentId, maxMessages)
  
  if (messages.length === 0) {
    return ''
  }

  return messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n')
}

