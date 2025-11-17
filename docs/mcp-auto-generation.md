# MCP Server Auto-Generation

ZwartifyOS now supports **automatic MCP (Model Context Protocol) server configuration** for agents. This allows agents to dynamically connect to external platforms like Slack, Discord, Twitter, GitHub, Notion, and Linear without manual server setup for each agent.

## Overview

The MCP auto-generation system includes:

1. **Auto-Discovery**: Automatically detects MCP servers from environment variables
2. **Dynamic Configuration**: Agents can specify which platforms they need
3. **Smart Routing**: Filters tools based on agent configuration
4. **Health Checks**: Monitors server availability and performance
5. **G-SAC Integration**: Automatically configures MCP for new agents

## How It Works

### 1. Environment-Based Discovery

MCP servers are discovered from environment variables following this pattern:

```bash
# Server endpoint (required)
MCP_SLACK_ENDPOINT=https://api.slack.com/mcp

# API key (optional)
MCP_SLACK_API_KEY=xoxb-your-slack-token

# Server enabled (optional, defaults to true)
MCP_SLACK_ENABLED=true

# Server type (optional, defaults to http)
MCP_SLACK_TYPE=http

# Capabilities (optional)
MCP_SLACK_CAPABILITIES=messaging,channels,users
```

Supported platforms:
- Slack
- Discord
- Twitter
- GitHub
- Notion
- Linear
- Custom platforms (any name)

### 2. Agent Configuration

Agents can specify which MCP servers they need in their configuration:

```json
{
  "name": "slack-bot",
  "description": "Customer support bot for Slack",
  "prompt": "You are a helpful customer support agent...",
  "tools": ["callMCP", "markdownFormatter"],
  "metadata": {
    "mcpServers": ["slack"]
  }
}
```

### 3. G-SAC Auto-Configuration

When you ask G-SAC to create an agent that needs platform integration, it automatically:

1. Detects which platforms are mentioned (e.g., "Slack", "Discord")
2. Adds those platforms to the `mcpServers` array
3. Enables the `callMCP` tool
4. Includes platform-agnostic instructions in the agent prompt

**Example:**

```
User: "Create a bot that posts updates to Slack and Discord"

G-SAC will create an agent with:
- tools: ["callMCP"]
- metadata: { mcpServers: ["slack", "discord"] }
```

### 4. Tool Filtering

The system automatically filters tools based on agent configuration:

- If an agent specifies `tools: ["callMCP", "markdownFormatter"]`, it only gets those tools
- If an agent specifies `mcpServers: ["slack"]`, the system ensures the MCP client is available
- If no tools are specified, all tools are available (backward compatibility)

### 5. Health Monitoring

MCP servers are automatically monitored for health:

- Initial health check on startup
- Periodic checks every 5 minutes
- Manual checks via API: `POST /api/mcp/health-check`
- Server latency tracking
- Error reporting

## Setup Instructions

### Step 1: Configure Environment Variables

Add MCP server configurations to your `.env.local` file:

```bash
# Slack
MCP_SLACK_ENDPOINT=https://api.slack.com/mcp
MCP_SLACK_API_KEY=xoxb-your-token

# Discord
MCP_DISCORD_ENDPOINT=https://discord.com/api/mcp
MCP_DISCORD_API_KEY=your-bot-token

# GitHub
MCP_GITHUB_ENDPOINT=https://api.github.com/mcp
MCP_GITHUB_API_KEY=ghp_your-token

# Add more platforms as needed...
```

### Step 2: Restart the Application

The MCP registry initializes on startup and discovers all configured servers:

```bash
npm run dev
```

You'll see logs like:

```
[MCP Registry] Initializing...
[MCP] Discovered server: slack at https://api.slack.com/mcp
[MCP] Discovered server: discord at https://discord.com/api/mcp
[MCP Registry] Discovered 2 server(s)
[MCP Registry] Health check complete: 2/2 servers healthy
```

### Step 3: Create Agents with Platform Support

Use G-SAC to create agents:

```
User: "Create a customer support agent for Slack"

G-SAC will:
1. Detect "Slack" in the request
2. Create an agent with mcpServers: ["slack"]
3. Enable the callMCP tool
4. Generate a platform-agnostic prompt
```

### Step 4: Monitor MCP Status

Check MCP server status via API:

```bash
# Get all server status
curl http://localhost:3000/api/mcp/status

# Trigger health check
curl -X POST http://localhost:3000/api/mcp/health-check

# Auto-detect servers from input
curl -X POST http://localhost:3000/api/mcp/auto-detect \
  -H "Content-Type: application/json" \
  -d '{"input": "I need to post to Slack and Twitter"}'
```

## API Reference

### GET /api/mcp/status

Returns the status of all configured MCP servers.

**Response:**

```json
{
  "success": true,
  "servers": [
    {
      "name": "slack",
      "endpoint": "https://api.slack.com/mcp",
      "type": "http",
      "enabled": true,
      "capabilities": ["messaging", "channels", "users"],
      "health": {
        "healthy": true,
        "lastChecked": "2025-01-17T12:00:00Z",
        "latency": 150
      }
    }
  ],
  "summary": {
    "total": 1,
    "healthy": 1,
    "unhealthy": 0
  }
}
```

### POST /api/mcp/health-check

Triggers a health check for all servers or a specific server.

**Request:**

```json
{
  "serverName": "slack"  // Optional - check specific server
}
```

**Response:**

```json
{
  "success": true,
  "healthStatus": [
    {
      "serverName": "slack",
      "healthy": true,
      "lastChecked": "2025-01-17T12:00:00Z",
      "latency": 150
    }
  ],
  "summary": {
    "total": 1,
    "healthy": 1,
    "unhealthy": 0
  }
}
```

### POST /api/mcp/auto-detect

Auto-detects which MCP servers are needed based on input.

**Request:**

```json
{
  "input": "Create a bot that posts to Slack and Discord"
}
```

**Response:**

```json
{
  "success": true,
  "input": "Create a bot that posts to Slack and Discord",
  "detectedServers": [
    {
      "name": "slack",
      "configured": true,
      "healthy": true,
      "suggestion": {
        "name": "slack",
        "type": "http",
        "capabilities": ["messaging", "channels", "users"]
      }
    },
    {
      "name": "discord",
      "configured": false,
      "healthy": false,
      "envTemplate": "# Discord MCP Server\nMCP_DISCORD_ENDPOINT=https://api.discord.com/mcp\n..."
    }
  ],
  "summary": {
    "total": 2,
    "configured": 1,
    "needsConfiguration": 1
  }
}
```

## Architecture

### Components

1. **mcpConfig.ts**: Configuration and auto-discovery logic
   - Environment variable parsing
   - Platform detection from user input
   - Well-known server patterns

2. **mcpRegistry.ts**: Server registry and health monitoring
   - Server registration and management
   - Health check system
   - Server capability tracking

3. **mcpClient.ts**: HTTP/SSE client for MCP communication
   - HTTP request handling
   - Error handling and retries
   - Response parsing

4. **mcpClientTool.ts**: Tool integration
   - Agent-facing tool for calling MCP servers
   - Error messages and suggestions
   - Automatic server discovery prompts

5. **toolFilter.ts**: Tool filtering system
   - Filters tools based on agent configuration
   - MCP server validation
   - Auto-detection integration

### Data Flow

```
User Request
    ↓
mainAgent (loads agent config)
    ↓
filterTools (filters based on config)
    ↓
agentClient.run (passes filtered tools)
    ↓
Agent decides to use callMCP tool
    ↓
mcpClientTool (validates server)
    ↓
mcpClient (makes HTTP request)
    ↓
MCP Server (external platform)
    ↓
Response back to agent
```

## Best Practices

### 1. Environment Security

- Never commit API keys to version control
- Use `.env.local` for development
- Use platform secret management for production (Vercel, AWS, etc.)

### 2. Server Configuration

- Always set health check endpoints
- Configure appropriate timeouts
- Monitor server latency and availability

### 3. Agent Design

- Keep agents platform-agnostic
- Use MCP for all platform interactions
- Handle platform errors gracefully
- Test with multiple platforms

### 4. Performance

- Enable only required MCP servers per agent
- Use tool filtering to reduce overhead
- Monitor health checks and disable unhealthy servers

## Troubleshooting

### Server Not Found

**Error:** `MCP server 'slack' not found`

**Solution:**
1. Check environment variables are set correctly
2. Restart the application to reload config
3. Check server name matches environment variable pattern

### Server Unhealthy

**Error:** `MCP server 'slack' is unhealthy: Connection timeout`

**Solution:**
1. Check server endpoint is correct
2. Verify API key is valid
3. Check network connectivity
4. Review server logs for errors

### Tool Not Available

**Error:** `Tool 'callMCP' not available`

**Solution:**
1. Add `"callMCP"` to agent's `tools` array
2. Ensure agent metadata includes `mcpServers`
3. Check tool filtering configuration

## Examples

### Example 1: Slack Bot

```json
{
  "name": "slack-support-bot",
  "description": "Customer support bot for Slack",
  "prompt": "You are a customer support agent. Use the callMCP tool to interact with Slack...",
  "tools": ["callMCP", "markdownFormatter"],
  "metadata": {
    "mcpServers": ["slack"],
    "category": "support"
  }
}
```

### Example 2: Multi-Platform Social Media Manager

```json
{
  "name": "social-media-manager",
  "description": "Posts content across Twitter, LinkedIn, and Discord",
  "prompt": "You manage social media accounts. Use callMCP to post to different platforms...",
  "tools": ["callMCP"],
  "metadata": {
    "mcpServers": ["twitter", "discord"],
    "category": "marketing"
  }
}
```

### Example 3: Developer Assistant

```json
{
  "name": "dev-assistant",
  "description": "Helps with GitHub and Linear project management",
  "prompt": "You are a developer assistant. Use callMCP to interact with GitHub and Linear...",
  "tools": ["callMCP", "markdownFormatter"],
  "metadata": {
    "mcpServers": ["github", "linear"],
    "category": "development"
  }
}
```

## Future Enhancements

- [ ] Server-Sent Events (SSE) support for streaming
- [ ] Dynamic server registration via UI
- [ ] Server capability discovery
- [ ] Advanced health checks with custom validation
- [ ] Rate limiting per server
- [ ] Request/response caching
- [ ] Server failover and retry logic
- [ ] Metrics and analytics dashboard

## Related Documentation

- [Agent Configuration Schema](./agent-schema.md)
- [Tool System](./tools.md)
- [G-SAC Meta-Agent](./g-sac.md)
- [Environment Configuration](./environment.md)
