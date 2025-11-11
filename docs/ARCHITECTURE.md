# Architecture Deep Dive

## The Operating System Metaphor

ZwartifyOS coordinates intelligence the way Unix coordinated programs:

- **Agents** are userland programs
- **Tools** are capabilities
- **Interactions** are processes
- **You** are root

This is not just a framework—it's an operating system for building intelligent products.

## ACCV Stack

**Agents. Cursor. Claude. Vercel.**

The convergence of these tools creates something unprecedented:

- **Cursor** - Local code generation and editing
- **Claude Code for Web** - Code review and commits
- **Claude API** - Powers intelligent agents (standard Anthropic SDK)
- **GitHub** - Version control and collaboration
- **Vercel** - Instant deployment

This creates a continuous development loop where code evolves through AI-assisted workflows.

### The Development Loop

1. **Edit code** in Cursor for local generation and refactoring
2. **Test agents** via the `/agent` interface
3. **Review changes** with Claude Code for Web
4. **Auto-sync Claude's changes** back to local (see Sync section)
5. **Deploy** to Vercel automatically on push

### The Convergence

Until late 2024 or early 2025, you could:
- Generate code locally
- Deploy manually
- Prototype with scattered tools

But you could not do the following reliably:
- Have AI plan a full multi-file codebase
- Edit, diff, and commit to GitHub directly from a model
- Build with agent tools that self-extend capability
- Trigger end-to-end deployment from single intention

**This was not possible weeks ago in unified form.**

Only now do Cursor Plan, Claude Code for Web, and Claude API converge.

This is not "AI helping you code"

This is **"AI helping you build systems that build systems"**.

Like giving the apprentice a workshop, then watching it assemble its own apprentices.

## System Architecture

### Core Components

- **Agent Management** - Full CRUD operations for agents
- **RAG System** - Upload documents, build knowledge bases
- **Memory & Context** - Conversation persistence
- **Scheduling** - Cron-based automated runs
- **Skills System** - Domain expertise modules
- **Tool Registry** - Extensible tool system
- **Execution Logging** - Complete observability
- **Token Tracking** - Usage and cost monitoring

### Project Structure

```
/app
  /agent
    page.tsx         # Agent interface UI
  /api/agent
    route.ts         # API route handler
  /docs
    page.tsx         # Documentation page
  page.tsx           # Homepage
  globals.css        # Global styles
/backend
  /agents
    agentClient.ts   # Claude SDK client
    mainAgent.ts     # Main agent implementation
    expertAgent.ts   # Example expert persona
  /tools
    index.ts         # Tool registry
    helloTool.ts     # Example tool
    markdownFormatter.ts  # Markdown formatting tool
    screenshotDescription.ts  # Screenshot analysis tool
/styles
  animations.css     # Custom animations
.env.example        # Environment template
LICENSE             # MIT License
README.md           # Project documentation
VERSION             # Version file
```

## Why ZwartifyOS is Special

It is opinionated only where required.

It is agnostic where helpful.

You are not forced into a heavy framework.

Instead you start with:
- Next.js
- Shadcn
- Tailwind
- Claude API (standard Anthropic SDK)
- Tool registry
- (Future: Claude Agent SDK for dedicated servers)

And from there you spawn anything.

**The OS metaphor is intentional.**

ZwartifyOS coordinates intelligence the way Unix coordinated programs.

Each tool is a capability.

Each agent is a userland program.

Each interaction is a process.

**You are root.**

## Using Claude Agents

ZwartifyOS uses the **standard Anthropic SDK** (`@anthropic-ai/sdk`) to power intelligent agents:

```typescript
import { agentClient } from "./agentClient"
import { getTools } from "../tools"

export async function myAgent(input: string) {
  const tools = await getTools()
  const result = await agentClient.run(input, { tools })
  return { text: result.output_text }
}
```

**Current Implementation (Next.js/Vercel):**
- Uses standard Anthropic SDK for direct API calls
- Works in serverless environments
- Supports tools via API
- No CLI dependencies

**Future: Claude Agent SDK**
- For dedicated Node.js servers (not Next.js)
- Full agent capabilities: file operations, bash, MCP servers
- Requires Claude Code CLI installation
- See `/backend/agents/agentClient.ts` for current implementation and future plans

See `/backend/agents/agentClient.ts` for implementation details.

## Building Tools

Tools automatically register when you add them to `/backend/tools/`.

Each tool must export an object with `name`, `description`, and `execute`:

```typescript
export const myTool = {
  name: "myTool",
  description: "Does something useful",
  execute: async (args?: any) => {
    // Your tool logic here
    return "Tool result"
  }
}
```

Then add the import to `/backend/tools/index.ts`:

```typescript
const toolModules = [
  import("./helloTool"),
  import("./markdownFormatter"),
  import("./screenshotDescription"),
  import("./myTool"),  // Add your tool here
]
```

## Building Agents

Agents live in `/backend/agents/`. To create a new agent:

```typescript
import { agentClient } from "./agentClient"
import { getTools } from "../tools"

export async function myAgent(input: string) {
  try {
    const tools = await getTools()
    const result = await agentClient.run(input, { tools })
    return {
      text: result.output_text || "No response generated"
    }
  } catch (error) {
    return {
      text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}
```

See `expertAgent.ts` for a persona-based example.

---

**See [Philosophy](philosophy.md) for our approach and beliefs.**

