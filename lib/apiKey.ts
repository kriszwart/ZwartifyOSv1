/**
 * API Key Utility
 * 
 * Manages user-provided API keys stored in localStorage
 */

const STORAGE_KEY = 'claude_api_key'

/**
 * Get the user's API key from localStorage
 */
export function getUserApiKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

/**
 * Set the user's API key in localStorage
 */
export function setUserApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, apiKey.trim())
}

/**
 * Clear the user's API key from localStorage
 */
export function clearUserApiKey(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Check if user has an API key set
 */
export function hasUserApiKey(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(STORAGE_KEY)
}

/**
 * Get headers for API requests, including user API key if available
 */
export function getApiHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  const userApiKey = getUserApiKey()
  if (userApiKey) {
    headers['X-User-API-Key'] = userApiKey
  }
  
  return headers
}

