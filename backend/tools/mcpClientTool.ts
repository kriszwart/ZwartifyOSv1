/**
 * MCP Client Tool
 * 
 * Generic Model Context Protocol (MCP) communication tool.
 * Allows agents to interact with external MCP servers for multi-platform support.
 */

export interface MCPCallInput {
  service: string // MCP service name or identifier
  method: string // MCP method to call
  params?: Record<string, unknown> // Parameters for the method
  endpoint?: string // Optional custom endpoint (overrides service-based endpoint)
}

interface MCPConfig {
  endpoint: string
  apiKey?: string
  timeout?: number
}

// MCP server configurations
// Can be extended to support multiple MCP servers
const MCP_SERVERS: Record<string, MCPConfig> = {}

/**
 * Get MCP server configuration
 */
function getMCPServerConfig(service: string, customEndpoint?: string): MCPConfig {
  // If custom endpoint provided, use it
  if (customEndpoint) {
    return {
      endpoint: customEndpoint,
      timeout: 30000, // 30 seconds default
    }
  }

  // Check if service has a configured endpoint
  const config = MCP_SERVERS[service]
  if (config) {
    return config
  }

  // Fallback: use environment variable or default pattern
  const envKey = `MCP_${service.toUpperCase()}_ENDPOINT`
  const endpoint = process.env[envKey] || process.env.MCP_ENDPOINT

  if (!endpoint) {
    throw new Error(
      `MCP server endpoint not configured for service "${service}". ` +
      `Set ${envKey} environment variable or provide endpoint parameter.`
    )
  }

  return {
    endpoint,
    timeout: 30000,
  }
}

/**
 * Make an MCP call
 */
async function callMCPServer(
  service: string,
  method: string,
  params: Record<string, unknown> = {},
  customEndpoint?: string
): Promise<unknown> {
  const config = getMCPServerConfig(service, customEndpoint)

  const url = `${config.endpoint}/mcp/${method}`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add API key if configured
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  } else if (process.env.MCP_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.MCP_API_KEY}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        service,
        method,
        params,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `MCP server error (${response.status}): ${errorText || response.statusText}`
      )
    }

    const result = await response.json()
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`MCP call timeout after ${config.timeout || 30000}ms`)
    }
    
    throw error
  }
}

export const mcpClientTool = {
  name: "callMCP",
  description: `Call a Model Context Protocol (MCP) server to interact with external platforms and services.
  
Parameters:
- service: The MCP service name or identifier (e.g., "slack", "discord", "twitter")
- method: The MCP method to call (e.g., "sendMessage", "createChannel", "postTweet")
- params: Optional parameters object for the method
- endpoint: Optional custom endpoint URL (overrides service-based endpoint)

The tool automatically handles authentication and error responses. MCP servers must be configured via environment variables or the endpoint parameter.

Example:
{
  "service": "slack",
  "method": "sendMessage",
  "params": {
    "channel": "#general",
    "text": "Hello from ZwartifyOS"
  }
}`,
  execute: async (input: MCPCallInput | { service: string; method: string; params?: Record<string, unknown>; endpoint?: string }) => {
    try {
      // Handle both wrapped and direct input
      const callInput = 'service' in input ? input : input as MCPCallInput

      if (!callInput.service || typeof callInput.service !== 'string') {
        throw new Error('Invalid input: service is required and must be a string')
      }

      if (!callInput.method || typeof callInput.method !== 'string') {
        throw new Error('Invalid input: method is required and must be a string')
      }

      const params = callInput.params || {}
      const endpoint = callInput.endpoint

      // Make the MCP call
      const result = await callMCPServer(
        callInput.service,
        callInput.method,
        params,
        endpoint
      )

      return {
        success: true,
        service: callInput.service,
        method: callInput.method,
        result,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        service: (input as any).service,
        method: (input as any).method,
        error: errorMessage,
      }
    }
  },
}

/**
 * Register an MCP server configuration
 * This allows runtime configuration of MCP servers
 */
export function registerMCPServer(service: string, config: MCPConfig): void {
  MCP_SERVERS[service] = config
}

/**
 * Get all registered MCP servers
 */
export function getRegisteredMCPServers(): Record<string, MCPConfig> {
  return { ...MCP_SERVERS }
}

