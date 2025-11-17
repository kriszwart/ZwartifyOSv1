/**
 * MCP Server Registry
 *
 * Manages MCP server connections, health checks, and routing
 * Provides centralized access to all available MCP servers
 */

import {
  type MCPServerConfig,
  discoverMCPServers,
  suggestServerConfig,
  detectRequiredServers,
} from '../config/mcpConfig'

export interface ServerHealthStatus {
  serverName: string
  healthy: boolean
  lastChecked: Date
  latency?: number
  error?: string
}

class MCPRegistry {
  private servers: Map<string, MCPServerConfig> = new Map()
  private healthStatus: Map<string, ServerHealthStatus> = new Map()
  private healthCheckInterval?: NodeJS.Timeout
  private initialized = false

  /**
   * Initialize the registry with auto-discovery
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    console.log('[MCP Registry] Initializing...')

    // Discover servers from environment variables
    const discoveredServers = discoverMCPServers()
    for (const [name, config] of discoveredServers) {
      this.servers.set(name, config)
    }

    console.log(`[MCP Registry] Discovered ${this.servers.size} server(s)`)

    // Perform initial health check
    await this.checkAllServersHealth()

    // Start periodic health checks (every 5 minutes)
    this.startHealthChecks(5 * 60 * 1000)

    this.initialized = true
  }

  /**
   * Register a new MCP server dynamically
   */
  registerServer(config: MCPServerConfig): void {
    console.log(`[MCP Registry] Registering server: ${config.name}`)
    this.servers.set(config.name, config)

    // Initialize health status
    this.healthStatus.set(config.name, {
      serverName: config.name,
      healthy: false,
      lastChecked: new Date(),
    })

    // Check health of new server
    this.checkServerHealth(config.name).catch(console.error)
  }

  /**
   * Get a server configuration by name
   */
  getServer(name: string): MCPServerConfig | null {
    return this.servers.get(name.toLowerCase()) || null
  }

  /**
   * Get all available servers
   */
  getAllServers(): MCPServerConfig[] {
    return Array.from(this.servers.values())
  }

  /**
   * Get all healthy servers
   */
  getHealthyServers(): MCPServerConfig[] {
    return Array.from(this.servers.values()).filter(server => {
      const health = this.healthStatus.get(server.name)
      return health?.healthy && server.enabled
    })
  }

  /**
   * Get servers by capability
   */
  getServersByCapability(capability: string): MCPServerConfig[] {
    return Array.from(this.servers.values()).filter(
      server =>
        server.enabled &&
        server.capabilities?.includes(capability)
    )
  }

  /**
   * Auto-detect and suggest servers based on input
   */
  async autoConfigureServers(input: string): Promise<string[]> {
    const detectedPlatforms = detectRequiredServers(input)
    const configuredServers: string[] = []

    for (const platform of detectedPlatforms) {
      // Check if server already exists
      if (this.servers.has(platform)) {
        console.log(`[MCP Registry] Server ${platform} already configured`)
        configuredServers.push(platform)
        continue
      }

      // Suggest configuration
      const suggestedConfig = suggestServerConfig(platform)
      if (!suggestedConfig || !suggestedConfig.name) {
        console.warn(`[MCP Registry] Could not suggest config for ${platform}`)
        continue
      }

      console.log(`[MCP Registry] Auto-configuring server for ${platform}`)
      console.log(`[MCP Registry] Note: Server endpoint needs to be set via environment variables`)
      console.log(`[MCP Registry] Add: MCP_${platform.toUpperCase()}_ENDPOINT=<your-endpoint>`)

      // Don't register without endpoint - just log the suggestion
      // The user needs to set environment variables
      configuredServers.push(platform)
    }

    return configuredServers
  }

  /**
   * Check health of a specific server
   */
  async checkServerHealth(serverName: string): Promise<ServerHealthStatus> {
    const server = this.servers.get(serverName)
    if (!server) {
      const status: ServerHealthStatus = {
        serverName,
        healthy: false,
        lastChecked: new Date(),
        error: 'Server not found in registry',
      }
      this.healthStatus.set(serverName, status)
      return status
    }

    const startTime = Date.now()

    try {
      // Try to connect to server endpoint
      // For now, we do a simple fetch to check if the endpoint responds
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000) // 5s timeout

      const response = await fetch(server.endpoint, {
        method: 'GET',
        headers: server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {},
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const latency = Date.now() - startTime
      const healthy = response.ok || response.status === 401 // 401 means endpoint exists but needs auth

      const status: ServerHealthStatus = {
        serverName,
        healthy,
        lastChecked: new Date(),
        latency,
        error: healthy ? undefined : `HTTP ${response.status}`,
      }

      this.healthStatus.set(serverName, status)
      return status
    } catch (error) {
      const status: ServerHealthStatus = {
        serverName,
        healthy: false,
        lastChecked: new Date(),
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }

      this.healthStatus.set(serverName, status)
      return status
    }
  }

  /**
   * Check health of all servers
   */
  async checkAllServersHealth(): Promise<void> {
    const checks = Array.from(this.servers.keys()).map(name =>
      this.checkServerHealth(name)
    )

    await Promise.all(checks)

    const healthyCount = Array.from(this.healthStatus.values()).filter(
      s => s.healthy
    ).length

    console.log(
      `[MCP Registry] Health check complete: ${healthyCount}/${this.servers.size} servers healthy`
    )
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(intervalMs: number): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(() => {
      this.checkAllServersHealth().catch(console.error)
    }, intervalMs)
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = undefined
    }
  }

  /**
   * Get health status for all servers
   */
  getHealthStatus(): ServerHealthStatus[] {
    return Array.from(this.healthStatus.values())
  }

  /**
   * Get health status for a specific server
   */
  getServerHealth(serverName: string): ServerHealthStatus | null {
    return this.healthStatus.get(serverName) || null
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }
}

// Singleton instance
export const mcpRegistry = new MCPRegistry()

// Auto-initialize on module load (only in server-side context)
if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  mcpRegistry.initialize().catch(error => {
    console.error('[MCP Registry] Initialization failed:', error)
  })
}
