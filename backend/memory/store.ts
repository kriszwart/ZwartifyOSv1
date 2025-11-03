/**
 * Memory Store
 * 
 * Persists conversation history and context for agents
 */

import { randomUUID } from 'crypto'

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

// In-memory stores (will be replaced with database)
const conversations = new Map<string, Conversation>()
const agentConversations = new Map<string, string[]>() // agentId -> conversationIds

/**
 * Create a new conversation
 */
export function createConversation(
  agentId: string,
  title?: string,
  metadata?: Record<string, unknown>
): Conversation {
  const conversation: Conversation = {
    id: randomUUID(),
    agentId,
    title,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata,
  }

  conversations.set(conversation.id, conversation)
  
  // Track conversation for agent
  const agentConvs = agentConversations.get(agentId) || []
  agentConversations.set(agentId, [...agentConvs, conversation.id])

  return conversation
}

/**
 * Get conversation by ID
 */
export function getConversation(id: string): Conversation | undefined {
  return conversations.get(id)
}

/**
 * Get conversations for an agent
 */
export function getAgentConversations(agentId: string, limit = 50): Conversation[] {
  const conversationIds = agentConversations.get(agentId) || []
  return conversationIds
    .map(id => conversations.get(id))
    .filter((conv): conv is Conversation => conv !== undefined)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit)
}

/**
 * Get latest conversation for an agent
 */
export function getLatestConversation(agentId: string): Conversation | undefined {
  const convs = getAgentConversations(agentId, 1)
  return convs[0]
}

/**
 * Add message to conversation
 */
export function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, unknown>
): ConversationMessage | null {
  const conversation = conversations.get(conversationId)
  if (!conversation) return null

  const message: ConversationMessage = {
    id: randomUUID(),
    agentId: conversation.agentId,
    role,
    content,
    timestamp: new Date(),
    metadata,
  }

  conversation.messages.push(message)
  conversation.updatedAt = new Date()
  conversations.set(conversationId, conversation)

  return message
}

/**
 * Get conversation history for context (last N messages)
 */
export function getConversationContext(
  conversationId: string,
  maxMessages: number = 10
): ConversationMessage[] {
  const conversation = conversations.get(conversationId)
  if (!conversation) return []

  return conversation.messages.slice(-maxMessages)
}

/**
 * Get conversation history for agent (last N messages across all conversations)
 */
export function getAgentContext(
  agentId: string,
  maxMessages: number = 10
): ConversationMessage[] {
  const convs = getAgentConversations(agentId, 5) // Get last 5 conversations
  const allMessages: ConversationMessage[] = []

  for (const conv of convs) {
    allMessages.push(...conv.messages)
  }

  // Sort by timestamp and return last N
  return allMessages
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .slice(-maxMessages)
}

/**
 * Delete conversation
 */
export function deleteConversation(id: string): boolean {
  const conversation = conversations.get(id)
  if (!conversation) return false

  // Remove from agent's conversation list
  const agentConvs = agentConversations.get(conversation.agentId) || []
  agentConversations.set(
    conversation.agentId,
    agentConvs.filter(convId => convId !== id)
  )

  return conversations.delete(id)
}

/**
 * Prune old conversations (keep only last N per agent)
 */
export function pruneConversations(agentId: string, keepCount: number = 10): void {
  const convs = getAgentConversations(agentId, keepCount * 2) // Get more than needed
  
  if (convs.length > keepCount) {
    const toDelete = convs.slice(keepCount)
    toDelete.forEach(conv => deleteConversation(conv.id))
  }
}

/**
 * Build conversation context string for prompt
 */
export function buildConversationContext(
  agentId: string,
  maxMessages: number = 10
): string {
  const messages = getAgentContext(agentId, maxMessages)
  
  if (messages.length === 0) {
    return ''
  }

  return messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n')
}

