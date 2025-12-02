/**
 * Backend Adapter Factory
 * 
 * Environment-based adapter selection:
 * - BACKEND_TYPE='inMemory' (default) -> InMemoryAdapter
 * - BACKEND_TYPE='remote' -> RemoteAdapter (requires BACKEND_API_URL)
 */

import type { BackendAdapter } from './interface'
import { InMemoryAdapter } from './inMemory'
import { RemoteAdapter } from './remote'
import { getEnvConfig } from '../config/env'

let adapterInstance: BackendAdapter | null = null

/**
 * Get the backend adapter instance (singleton)
 */
export function getBackendAdapter(): BackendAdapter {
  if (adapterInstance) {
    return adapterInstance
  }

  const config = getEnvConfig()
  const backendType = (config.BACKEND_TYPE || 'inMemory').toLowerCase()

  if (backendType === 'remote') {
    const apiUrl = config.BACKEND_API_URL
    if (!apiUrl) {
      throw new Error('BACKEND_API_URL is required when BACKEND_TYPE=remote')
    }

    adapterInstance = new RemoteAdapter({
      apiUrl,
      apiKey: config.BACKEND_API_KEY,
      timeout: config.BACKEND_TIMEOUT ? parseInt(config.BACKEND_TIMEOUT, 10) : undefined,
    })
  } else {
    // Default to in-memory
    adapterInstance = new InMemoryAdapter()
  }

  return adapterInstance
}

/**
 * Reset the adapter instance (useful for testing)
 */
export function resetBackendAdapter(): void {
  adapterInstance = null
}




