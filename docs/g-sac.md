# G-SAC: Growth Strategy Agent Creator

**G-SAC (Growth Strategy Agent Creator) is ZwartifyOS's meta-agent that creates other agents from a single natural language prompt.**

## Overview

G-SAC transforms high-level business requirements into fully functional, production-ready AI agents. Instead of manually configuring agents, tools, and integrations, you simply describe what you want, and G-SAC handles the rest.

## How It Works

### Single-Prompt Agent Creation

G-SAC uses a multi-step reasoning process to transform your request into a complete agent:

1. **Business Goal Translation** - Analyzes your requirements and translates them into agent specifications
2. **Tool Selection** - Identifies and selects appropriate tools from the registry
3. **Platform Integration** - Configures MCP (Model Context Protocol) for platform-agnostic support
4. **Prompt Engineering** - Drafts a comprehensive agent prompt with domain expertise
5. **Deployment** - Creates and deploys the agent instantly

### Example: Real Prompt-to-Agent Flow

**User Input:**
```
"Create an agent that qualifies sales leads and schedules demos"
```

**G-SAC Reasoning Process:**

1. **Business Goal Analysis:**
   - Primary objective: Qualify sales leads
   - Secondary objective: Schedule demos
   - Domain: Sales and lead generation
   - Required capabilities: Lead scoring, calendar integration, communication

2. **Tool Selection:**
   - `callMCP` - For platform integration (Slack, email, calendar)
   - Custom logic for lead qualification scoring
   - No `createAgent` needed (this agent won't create others)

3. **Platform Integration:**
   - Slack integration for notifications
   - Calendar API for scheduling
   - Email for follow-ups
   - CRM integration via MCP

4. **Agent Prompt Generation:**
   ```
   You are a Sales Lead Qualification Agent specialized in identifying 
   high-value prospects and scheduling product demonstrations.
   
   Your responsibilities:
   - Analyze incoming leads based on company size, industry, and engagement
   - Score leads using BANT framework (Budget, Authority, Need, Timeline)
   - Schedule demos for qualified leads
   - Send follow-up communications
   
   Use the MCP client to integrate with Slack, calendar, and email systems.
   ```

5. **Deployment:**
   - Agent created with ID: `sales-lead-qualifier`
   - Tools configured and ready
   - Platform integrations active
   - Available immediately in `/agents`

## Internal Reasoning Process

G-SAC uses three specialized meta-skills:

### 1. BusinessGoalTranslator
- Analyzes natural language requirements
- Extracts business objectives and constraints
- Identifies domain expertise needed
- Maps requirements to agent capabilities

### 2. ToolIntegrator
- Reviews available tools in the registry
- Selects appropriate tools for the task
- Configures tool parameters
- Ensures compatibility

### 3. PlatformIntegrator
- Configures MCP (Model Context Protocol) client
- Sets up platform integrations (Slack, email, calendar, CRM, etc.)
- Ensures platform-agnostic design
- Enables cross-platform agent portability

## Agent Lineage System

Every agent created by G-SAC tracks its lineage:

- **createdByAgentId**: The ID of the agent that created it (G-SAC's ID)
- **creationPrompt**: The original user prompt that led to creation
- **reasoningSteps**: The internal reasoning process used
- **toolSelection**: Which tools were selected and why
- **platformConfig**: Platform integrations configured

This creates a transparent, auditable chain of creation where you can see exactly how each agent was built.

## Domain Expertise

G-SAC is trained on the **Zwartify-Growth-Playbooks** RAG, a knowledge base containing:

- Proven business growth strategies
- Sales frameworks (BANT, MEDDIC, etc.)
- Lead generation best practices
- Customer qualification techniques
- Platform integration patterns

This ensures every agent created is not just functional, but embodies expert-level domain knowledge.

## Platform-Agnostic Design

Every agent created by G-SAC automatically includes:

- **MCP Client Tool**: Universal platform integration
- **Cross-Platform Support**: Works with Slack, Discord, email, calendar, CRM, etc.
- **Future-Proof**: New platform integrations require only MCP server configuration

## Usage

### Via Web Interface

1. Navigate to `/create-agent`
2. Enter your agent description in plain language
3. Watch G-SAC's reasoning process in real-time
4. Review the created agent
5. Start using it immediately

### Example Prompts

- "Create an agent that qualifies sales leads and schedules demos"
- "Build a customer support agent for Slack and Discord"
- "Create a content creator agent that posts to Twitter and LinkedIn"
- "Make an agent that analyzes customer feedback and generates reports"
- "Build an agent that monitors social media and alerts on brand mentions"

## Technical Details

### Token Usage

G-SAC agent creation typically uses:
- **Input tokens**: ~2,000-5,000 (depending on prompt complexity)
- **Output tokens**: ~1,500-3,000 (agent configuration and reasoning)
- **Cost**: ~$0.01-0.05 per agent creation (Claude Sonnet 4 pricing)

Token usage is tracked and displayed during the creation process.

### Agent Configuration Format

Created agents follow the standard ZwartifyOS agent format:

```typescript
{
  id: string
  name: string
  description: string
  prompt: string  // Generated by G-SAC
  version: string
  tools: string[]  // Selected by ToolIntegrator
  skills: string[] // Domain expertise applied
  ragFolders: string[] // Knowledge bases assigned
  platformIntegrations: {
    mcp: boolean
    slack?: boolean
    email?: boolean
    calendar?: boolean
  }
  createdByAgentId: string // G-SAC's ID
  creationPrompt: string // Original user prompt
}
```

## Best Practices

1. **Be Specific**: More detailed prompts lead to better agents
   - Good: "Create an agent that qualifies B2B SaaS leads using BANT framework"
   - Less ideal: "Make a sales agent"

2. **Specify Platforms**: Mention which platforms you want integrated
   - "Create an agent for Slack and email"
   - "Build a CRM integration agent"

3. **Define Scope**: Clarify what the agent should and shouldn't do
   - "Create an agent that handles customer support but escalates billing issues"

4. **Iterate**: Start simple, then refine based on results
   - Create a basic agent first
   - Test it
   - Request improvements or create specialized variants

## Limitations

- G-SAC creates agents based on available tools and skills
- Complex multi-agent workflows may require manual configuration
- Platform integrations depend on MCP server availability
- Agent quality depends on prompt clarity and domain knowledge in RAG

## Future Enhancements

- Multi-agent orchestration (agents that create agent teams)
- Agent templates and presets
- Agent marketplace
- Visual agent builder interface
- Agent performance analytics

## See Also

- [Quick Start Guide](../quick-start.md) - Get started with ZwartifyOS
- [Agent Management](../feature-usage.md#agent-management) - Managing created agents
- [WHAT_ZWARTIFYOS_IS.md](../WHAT_ZWARTIFYOS_IS.md) - Complete value proposition
- [Demo Page](/demo) - Interactive walkthrough

---

**G-SAC makes agent creation as simple as describing what you want. This is "agents creating agents" - the meta-level capability that enables rapid agent ecosystem growth.**

