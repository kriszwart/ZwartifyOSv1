/**
 * MCP Registry
 * 
 * Manages a registry of MCP servers mapped to platforms
 * Supports auto-discovery from environment variables
 */

export interface MCPServerConfig {
  platform: string // e.g., "slack", "discord", "twitter"
  serverUrl: string
  name: string
  description?: string
  healthCheckUrl?: string
  enabled: boolean
}

class MCPRegistry {
  private servers: Map<string, MCPServerConfig> = new Map()
  private platformMap: Map<string, string[]> = new Map() // platform -> server IDs

  /**
   * Register an MCP server
   */
  register(config: MCPServerConfig): void {
    const serverId = this.generateServerId(config.platform, config.name)
    this.servers.set(serverId, config)
    
    // Update platform mapping
    const existing = this.platformMap.get(config.platform) || []
    if (!existing.includes(serverId)) {
      this.platformMap.set(config.platform, [...existing, serverId])
    }
  }

  /**
   * Get MCP server URLs for a platform
   */
  getServersForPlatform(platform: string): MCPServerConfig[] {
    const serverIds = this.platformMap.get(platform.toLowerCase()) || []
    return serverIds
      .map(id => this.servers.get(id))
      .filter((config): config is MCPServerConfig => config !== undefined && config.enabled)
  }

  /**
   * Get all enabled servers
   */
  getAllServers(): MCPServerConfig[] {
    return Array.from(this.servers.values()).filter(s => s.enabled)
  }

  /**
   * Find servers by keyword (for fuzzy matching)
   */
  findServersByKeyword(keyword: string): MCPServerConfig[] {
    const lowerKeyword = keyword.toLowerCase()
    const results: MCPServerConfig[] = []
    
    for (const server of this.servers.values()) {
      if (!server.enabled) continue
      
      const platformMatch = server.platform.toLowerCase().includes(lowerKeyword)
      const nameMatch = server.name.toLowerCase().includes(lowerKeyword)
      
      if (platformMatch || nameMatch) {
        results.push(server)
      }
    }
    
    return results
  }

  /**
   * Auto-discover MCP servers from environment variables
   * Looks for patterns like:
   * - MCP_SLACK_URL=https://...
   * - MCP_DISCORD_URL=https://...
   * - MCP_TWITTER_URL=https://...
   */
  autoDiscoverFromEnv(): void {
    if (typeof process === 'undefined' || !process.env) {
      return
    }

    const env = process.env
    const mcpPattern = /^MCP_(\w+)_URL$/i

    for (const [key, value] of Object.entries(env)) {
      const match = key.match(mcpPattern)
      if (match && value) {
        const platform = match[1].toLowerCase()
        const serverUrl = value.trim()
        
        // Skip if already registered
        const existing = this.findServersByKeyword(platform)
        if (existing.some(s => s.serverUrl === serverUrl)) {
          continue
        }

        this.register({
          platform,
          serverUrl,
          name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} MCP Server`,
          description: `Auto-discovered ${platform} MCP server from environment`,
          enabled: true,
        })
      }
    }
  }

  /**
   * Generate a unique server ID
   */
  private generateServerId(platform: string, name: string): string {
    return `${platform}-${name.toLowerCase().replace(/\s+/g, '-')}`
  }

  /**
   * Get server configuration by URL
   */
  getServerByUrl(url: string): MCPServerConfig | undefined {
    for (const server of this.servers.values()) {
      if (server.serverUrl === url && server.enabled) {
        return server
      }
    }
    return undefined
  }

  /**
   * Get first server for a platform
   */
  getServerByPlatform(platform: string): MCPServerConfig | undefined {
    const servers = this.getServersForPlatform(platform)
    return servers.length > 0 ? servers[0] : undefined
  }

  /**
   * Check health of a server (if healthCheckUrl is provided)
   */
  async checkHealth(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId)
    if (!server || !server.healthCheckUrl) {
      return true // Assume healthy if no health check URL
    }

    try {
      const response = await fetch(server.healthCheckUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Singleton instance
export const mcpRegistry = new MCPRegistry()

// Auto-discover on module load (server-side only)
if (typeof window === 'undefined') {
  mcpRegistry.autoDiscoverFromEnv()
}

