# MCP Auto-Configuration

## Overview

ZwartifyOS now supports **automatic MCP server discovery and configuration**. When G-SAC creates an agent, it automatically detects which platforms are needed (Slack, Discord, Twitter, etc.) and configures the appropriate MCP servers from a pre-configured registry.

## How It Works

### 1. Environment Variable Auto-Discovery

MCP servers are automatically discovered from environment variables on startup:

```bash
# In your .env.local or environment
MCP_SLACK_URL=https://your-slack-mcp-server.com
MCP_DISCORD_URL=https://your-discord-mcp-server.com
MCP_TWITTER_URL=https://your-twitter-mcp-server.com
```

The registry automatically scans for patterns like `MCP_<PLATFORM>_URL` and registers them.

### 2. Platform Detection

When G-SAC creates an agent, it analyzes the agent description and prompt to detect platform requirements:

- **"Create a customer support agent for Slack"** → Detects `slack`
- **"Build a social media agent that posts to Twitter"** → Detects `twitter`
- **"Agent that manages Discord communities"** → Detects `discord`

### 3. Auto-Configuration

The `createAgent` tool automatically:
1. Detects platform requirements from the agent description/prompt
2. Looks up matching MCP servers in the registry
3. Configures the agent with the appropriate MCP server URLs
4. Enables the `callMCP` tool if platforms are detected

### 4. Manual Override

You can still manually specify MCP servers if needed:

```typescript
{
  metadata: {
    mcpServers: ["https://custom-mcp-server.com"]
  }
}
```

## Example Flow

**User Request:**
```
"Create an agent that sends notifications to Slack when new leads come in"
```

**G-SAC Process:**
1. Detects platform requirement: `slack` (from keywords "Slack", "notifications")
2. Looks up MCP registry: Finds `MCP_SLACK_URL` from environment
3. Creates agent with:
   - `tools: ["callMCP"]`
   - `metadata.mcpServers: ["https://your-slack-mcp-server.com"]`

**Result:**
Agent is created with Slack MCP automatically configured. No manual URL specification needed.

## API Endpoints

### Get MCP Registry Status

```bash
GET /api/mcp/registry
```

Returns all registered MCP servers and their status.

## Supported Platforms

The platform detector recognizes:
- Slack
- Discord
- Twitter/X
- LinkedIn
- Email
- Calendar
- CRM (Salesforce, HubSpot, etc.)
- GitHub
- Google Sheets
- Notion
- Jira
- And more...

## Future Enhancements

- **Health Monitoring**: Automatic health checks for MCP servers
- **Dynamic Registration**: Add/remove MCP servers at runtime
- **Platform Aliases**: Support for multiple names (e.g., "X" = "Twitter")
- **Confidence Scoring**: Better platform detection with confidence levels

