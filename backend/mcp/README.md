# MCP (Model Context Protocol) Backend

This directory contains the MCP server integration system for ZwartifyOS. The MCP system enables agents to interact with external platforms (Slack, Discord, Twitter, GitHub, etc.) in a platform-agnostic way.

## Architecture

```
backend/mcp/
├── mcpClient.ts       # HTTP/SSE client for calling MCP servers
├── mcpRegistry.ts     # Server registry and health monitoring
└── README.md          # This file

backend/config/
└── mcpConfig.ts       # Configuration and auto-discovery logic

backend/tools/
├── mcpClientTool.ts   # Agent-facing tool for MCP calls
└── toolFilter.ts      # Tool filtering based on agent config
```

## Components

### 1. mcpConfig.ts

**Purpose**: Configuration management and server discovery

**Key Functions**:
- `discoverMCPServers()`: Discovers servers from environment variables
- `detectRequiredServers(input)`: Detects platforms mentioned in user input
- `suggestServerConfig(platform)`: Suggests configuration for a platform
- `generateEnvTemplate(serverName)`: Generates environment variable template

**Environment Variable Pattern**:
```bash
MCP_{SERVER_NAME}_{PROPERTY}=value

Examples:
MCP_SLACK_ENDPOINT=https://api.slack.com/mcp
MCP_SLACK_API_KEY=xoxb-token
MCP_SLACK_ENABLED=true
MCP_SLACK_TYPE=http
```

### 2. mcpRegistry.ts

**Purpose**: Centralized server registry and health monitoring

**Key Features**:
- Singleton registry for all MCP servers
- Auto-initialization on module load
- Periodic health checks (every 5 minutes)
- Server capability tracking
- Dynamic server registration

**Key Methods**:
- `initialize()`: Initialize registry with auto-discovery
- `registerServer(config)`: Register a new server
- `getServer(name)`: Get server configuration
- `getAllServers()`: Get all servers
- `getHealthyServers()`: Get only healthy servers
- `checkServerHealth(name)`: Check specific server health
- `autoConfigureServers(input)`: Auto-detect and suggest servers

**Health Check System**:
- Checks server endpoint availability
- Measures latency
- Tracks errors
- Updates status periodically

### 3. mcpClient.ts

**Purpose**: HTTP/SSE client for calling MCP servers

**Key Features**:
- HTTP POST requests to MCP servers
- Authorization header injection
- Timeout handling (30s default)
- Error handling and reporting
- Latency tracking

**Key Methods**:
- `call(server, method, params)`: Call MCP server method
- `listMethods(server)`: List available methods
- `getCapabilities(server)`: Get server capabilities

**Request Format**:
```json
{
  "method": "send_message",
  "params": {
    "channel": "general",
    "text": "Hello!"
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "data": {...},
  "metadata": {
    "server": "slack",
    "latency": 150,
    "timestamp": "2025-01-17T12:00:00Z"
  }
}
```

### 4. mcpClientTool.ts

**Purpose**: Agent-facing tool for calling MCP servers

**Tool Interface**:
```typescript
{
  name: "callMCP",
  description: "Call an MCP server...",
  execute: async (params: {
    server: string
    method: string
    arguments?: Record<string, unknown>
  }) => {...}
}
```

**Features**:
- Validates server availability
- Provides helpful error messages
- Suggests environment variable configuration
- Lists available servers

### 5. toolFilter.ts

**Purpose**: Filter tools based on agent configuration

**Key Features**:
- Filters tools by enabled tools list
- Validates MCP server configuration
- Auto-detects servers from user input
- Backward compatibility (no filtering if not configured)

**Filter Options**:
```typescript
{
  enabledTools?: string[]       // Specific tools to enable
  mcpServers?: string[]          // Required MCP servers
  autoDetectMCP?: boolean        // Auto-detect from input
  userInput?: string             // Input for auto-detection
}
```

## Usage Examples

### Example 1: Configure MCP Servers

```bash
# .env.local
MCP_SLACK_ENDPOINT=https://api.slack.com/mcp
MCP_SLACK_API_KEY=xoxb-your-token
MCP_DISCORD_ENDPOINT=https://discord.com/api/mcp
MCP_DISCORD_API_KEY=your-bot-token
```

### Example 2: Agent with MCP Support

```json
{
  "name": "slack-bot",
  "prompt": "You are a Slack bot...",
  "tools": ["callMCP"],
  "metadata": {
    "mcpServers": ["slack"]
  }
}
```

### Example 3: Call MCP from Agent

The agent uses the `callMCP` tool:

```javascript
// Agent decides to call MCP
await callMCP({
  server: "slack",
  method: "send_message",
  arguments: {
    channel: "general",
    text: "Hello from ZwartifyOS!"
  }
})
```

### Example 4: Check Server Status

```typescript
import { mcpRegistry } from '@/backend/mcp/mcpRegistry'

// Get all servers
const servers = mcpRegistry.getAllServers()

// Check health
const health = await mcpRegistry.checkServerHealth('slack')

// Get healthy servers only
const healthy = mcpRegistry.getHealthyServers()
```

### Example 5: Auto-Detect Servers

```typescript
import { mcpRegistry } from '@/backend/mcp/mcpRegistry'

const detectedServers = await mcpRegistry.autoConfigureServers(
  "I need to post updates to Slack and Twitter"
)
// Returns: ["slack", "twitter"]
```

## Data Flow

### Initialization Flow

```
Application Start
    ↓
mcpConfig.discoverMCPServers()
    ↓
Parse environment variables
    ↓
Create server configs
    ↓
mcpRegistry.initialize()
    ↓
Register all discovered servers
    ↓
Run initial health checks
    ↓
Start periodic health monitoring
```

### Request Flow

```
Agent Request
    ↓
mainAgent (loads agent config)
    ↓
filterTools (applies agent config)
    ↓
Agent decides to use callMCP tool
    ↓
mcpClientTool.execute()
    ↓
Validate server exists
    ↓
Check server health
    ↓
mcpClient.call()
    ↓
HTTP POST to server
    ↓
Parse response
    ↓
Return to agent
```

## Configuration Reference

### Server Configuration Object

```typescript
interface MCPServerConfig {
  name: string                    // Server identifier (e.g., "slack")
  endpoint: string                // Server URL
  apiKey?: string                 // Optional API key
  enabled: boolean                // Enable/disable server
  type: 'http' | 'sse'           // Connection type
  capabilities?: string[]         // Server capabilities
  metadata?: Record<string, any>  // Additional metadata
}
```

### Agent Metadata Format

```typescript
{
  tools: string[]                 // Enabled tool names
  mcpServers: string[]           // Required MCP servers
  [key: string]: any             // Other metadata
}
```

## Health Check System

### Health Status Object

```typescript
interface ServerHealthStatus {
  serverName: string              // Server identifier
  healthy: boolean                // Is server responding?
  lastChecked: Date               // Last check timestamp
  latency?: number               // Response time (ms)
  error?: string                 // Error message if unhealthy
}
```

### Health Check Process

1. Send GET request to server endpoint
2. Measure response time
3. Check status code (200 OK or 401 Unauthorized = healthy)
4. Update health status in registry
5. Log results

### Health Check Schedule

- **Initial**: On application startup
- **Periodic**: Every 5 minutes
- **Manual**: Via API endpoint

## Error Handling

### Common Errors

1. **Server Not Found**
   - Cause: Server not in registry
   - Solution: Check environment variables and restart

2. **Server Unhealthy**
   - Cause: Endpoint not responding or wrong URL
   - Solution: Verify endpoint and API key

3. **Timeout**
   - Cause: Server taking too long to respond (>30s)
   - Solution: Check network and server performance

4. **Authentication Failed**
   - Cause: Invalid or missing API key
   - Solution: Verify API key in environment variables

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "suggestion": "Environment variable template...",
  "availableServers": ["slack", "discord"]
}
```

## Testing

### Manual Testing

```bash
# 1. Start application
npm run dev

# 2. Check server status
curl http://localhost:3000/api/mcp/status

# 3. Trigger health check
curl -X POST http://localhost:3000/api/mcp/health-check

# 4. Auto-detect servers
curl -X POST http://localhost:3000/api/mcp/auto-detect \
  -H "Content-Type: application/json" \
  -d '{"input": "I need to post to Slack"}'
```

### Unit Testing (Future)

```typescript
// Example test structure
describe('MCP Registry', () => {
  it('should discover servers from environment', () => {
    // Test server discovery
  })

  it('should check server health', async () => {
    // Test health checks
  })

  it('should auto-detect servers from input', async () => {
    // Test auto-detection
  })
})
```

## Performance Considerations

1. **Health Checks**: Run every 5 minutes (configurable)
2. **Request Timeout**: 30 seconds default
3. **Registry Initialization**: Once on startup
4. **Lazy Loading**: Servers initialized only when needed

## Security

1. **API Keys**: Stored in environment variables, never in code
2. **Authorization**: Added to request headers automatically
3. **HTTPS**: Recommended for all server endpoints
4. **Validation**: Server names and configs validated before use

## Future Enhancements

- [ ] Server-Sent Events (SSE) support
- [ ] Request/response caching
- [ ] Rate limiting per server
- [ ] Advanced retry logic
- [ ] Server capability discovery
- [ ] Metrics and analytics
- [ ] WebSocket support
- [ ] Server failover

## Related Documentation

- [MCP Auto-Generation Guide](../../docs/mcp-auto-generation.md)
- [Agent Configuration](../../docs/agent-schema.md)
- [Tool System](../../docs/tools.md)
