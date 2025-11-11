# ZwartifyOS

![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-v1.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

**ZwartifyOS is a production-ready framework for building and deploying AI agents with Claude.**

Build, deploy, and scale AI agents in hours, not months. Open-source. MIT-licensed. Bring your own API keys.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kriszwart/ZwartifyOSv1)

---

## What is ZwartifyOS?

ZwartifyOS is an open-source agent framework built on Claude API, Next.js, and TypeScript. It provides everything you need to build, deploy, and manage AI agents:

- **Agent Management** - Create, configure, and monitor agents
- **RAG System** - Knowledge base management for contextual agents
- **Memory & Context** - Conversation persistence and context management
- **Scheduling** - Automated agent runs with cron expressions
- **G-SAC** - Growth Strategy Agent Creator (agents that create agents)
- **Token Tracking** - Comprehensive usage and cost monitoring
- **Production-Ready** - Auth, rate limiting, health checks, error logging

### Quick Start

```bash
# Clone the repository
git clone https://github.com/kriszwart/ZwartifyOSv1.git
cd ZwartifyOSv1

# Install dependencies
npm install

# Set your API key
echo "CLAUDE_API_KEY=your-key-here" > .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` to get started.

**See [Quick Start Guide](docs/quick-start.md) for detailed setup instructions.**

---

## ✨ New in v1.0.0

**Production-Ready Release** - ZwartifyOS v1.0.0 brings enterprise-grade features:

- **Token Usage Tracking** - Automatic tracking of input/output tokens for every API call
- **Cost Monitoring** - Real-time cost calculation and analytics dashboard
- **API Versioning** - Structured API versioning support
- **Authentication** - Optional API key authentication with multiple auth methods
- **Rate Limiting** - Configurable rate limiting for API protection
- **Health Checks** - Production-ready health check endpoints (`/api/health`, `/api/ready`)
- **Environment Validation** - Startup validation prevents misconfiguration errors
- **Structured Error Logging** - Comprehensive error tracking with stack traces
- **Interactive Demo** - New `/demo` page showcasing G-SAC workflow

See [CHANGELOG.md](CHANGELOG.md) for complete release notes.

---

## 🌟 G-SAC: Growth Strategy Agent Creator

**G-SAC is ZwartifyOS's meta-agent that creates other agents from a single natural language prompt.**

Instead of manually configuring agents, tools, and integrations, simply describe what you want:

```
"Create an agent that qualifies sales leads and schedules demos"
"Build a customer support agent for Slack and Discord"
"Create a content creator agent that posts to Twitter and LinkedIn"
```

G-SAC autonomously:
1. Analyzes your business goal
2. Selects appropriate tools and skills
3. Configures platform integration via MCP
4. Drafts a comprehensive agent prompt
5. Deploys the agent instantly

**See [G-SAC Documentation](docs/g-sac.md) for complete details and examples.**

---

## 🏗️ Architecture

ZwartifyOS coordinates intelligence the way Unix coordinated programs:

- **Agents** are userland programs
- **Tools** are capabilities
- **Interactions** are processes
- **You** are root

### ACCV Stack

**Agents. Cursor. Claude. Vercel.**

- **Cursor** - Local code generation and editing
- **Claude Code for Web** - Code review and commits
- **Claude API** - Powers intelligent agents (standard Anthropic SDK)
- **GitHub** - Version control and collaboration
- **Vercel** - Instant deployment

This creates a continuous development loop where code evolves through AI-assisted workflows.

---

## 🌱 Why Open Source?

ZwartifyOS is open source because we believe:

- **Agent platforms should be transparent and auditable** - You should know exactly what your agents are doing
- **Users should own their agents and data, not rent them** - No vendor lock-in, no monthly fees for basic functionality
- **Innovation comes from open collaboration, not walled gardens** - The best ideas come from the community
- **Middlemen who add no value beyond access control are rip-off merchants** - If you can run it yourself, you should be able to

If you're building an agent system, make it open source. Let users self-host.
Don't be a gatekeeper charging for access to something they can run themselves.
The value is in the code, the tools, the architecture—not in artificial scarcity.

---

## 🎯 What is ZwartifyOS Good For?

**ZwartifyOS is a production-ready template for building AI agent platforms.**

### **Perfect For:**

1. **Building AI-Powered SaaS Products**
   - Customer support automation
   - Knowledge base assistants
   - Content generation platforms
   - Data analysis services

2. **Adding AI to Existing Applications**
   - Integrate agents via API
   - Add chat interfaces
   - Automate workflows
   - Enhance user experiences

3. **Creating White-Label Solutions**
   - Deploy for clients
   - Custom branding
   - Multi-tenant support
   - Agent marketplaces

4. **Rapid Prototyping & MVPs**
   - Test agent ideas quickly
   - Validate concepts
   - Build proof-of-concepts
   - Launch MVPs fast

5. **Internal Company Tools**
   - Employee assistants
   - Document Q&A systems
   - Automated reporting
   - Knowledge management

### **Why This Template?**

✅ **Complete System** - Not just chat, but full agent platform (RAG, memory, scheduling, logging)  
✅ **Real Features** - PDF processing, document analysis, code review (actually works)  
✅ **Production-Ready** - Error handling, timeouts, observability built-in  
✅ **7 Example Agents** - PDF Processor, Data Analyst, Code Reviewer, Content Writer, Email Assistant, Research Assistant, Customer Support  
✅ **7 Built-in Skills** - Domain expertise ready to use  
✅ **Deploy Anywhere** - Vercel, Docker, serverless, API-first  

**Time to Value:** Minutes to hours, not weeks to months.

See **[TEMPLATE_OVERVIEW.md](docs/TEMPLATE_OVERVIEW.md)** for complete use cases and deployment options.

**Cursor + Claude Code for Web + Claude API + Vercel is a historic moment for solo builders.**

This combination unlocks something that was effectively impossible until very recently.

**Claude Code for Web** can review, write, patch, and commit code directly into GitHub.

**Cursor** can generate, refactor, and plan code locally.

**Claude API** enables intelligent agents that can build and extend systems.

ZwartifyOS unifies all of this.

**This is the closest we have ever been to a one-person full-stack AI engineering team.**

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

---

## 📋 Features & Capabilities

### Core Stack: ACCV

**Agents. Cursor. Claude. Vercel.**

The leap is not in better autocomplete.

It is in model orchestrated code evolution.

- **Cursor** plans and edits
- **Claude** studies and commits
- **Claude API agents** introspect and extend
- **GitHub** is the backbone
- **Vercel** is the crystallisation

The system becomes extensible and self improving.

### What You Can Build

• 🤖 **Build WordPress-assistant tool** - Auto-generate CPTs, REST endpoints, React components

• 💼 **Build SaaS admin generator** - Stripe integration, CRUD models, dashboard UI

• 👥 **Build multi-agent collaboration** - Agents that work together

• 🔨 **Auto-build CRUD pages** - Generate complete admin interfaces

• 🔌 **Auto-connect to APIs** - Seamless third-party integrations

• 🚀 **Auto-commit + deploy to Vercel** - End-to-end automation

• 🎭 **Build expert personas** - Domain-specific intelligent assistants

• 🏗️ **Teach agents to scaffold microservices** - System architecture generation

• 🧠 **Build planning and critique loops** - Self-improving workflows

• 🌿 **Branch safety** - Git-aware agent operations

• ⚙️ **CI hooks** - Automated testing and deployment

### 🤖 Single-Prompt Autonomous Agent Creation (G-SAC)

**ZwartifyOS includes the Growth Strategy Agent Creator (G-SAC) - an AI agent that creates other AI agents.**

G-SAC can autonomously create fully configured agents from a single natural language prompt. This revolutionary feature enables:

- **Single-Prompt Creation**: Describe what you want, G-SAC builds it
- **Platform-Agnostic Design**: Agents work across multiple platforms via MCP
- **Autonomous Configuration**: G-SAC selects tools, skills, and capabilities automatically
- **Lineage Tracking**: See which agents created which agents
- **Meta-Skills System**: BusinessGoalTranslator, ToolIntegrator, PlatformIntegrator

**Example Usage:**
```
"Create an agent that qualifies sales leads and schedules demos"
"Build a customer support agent for Slack and Discord"
"Create a content creator agent that posts to Twitter and LinkedIn"
```

Visit `/create-agent` to try it yourself. G-SAC will:
1. Analyse your requirements
2. Translate business goals into agent specifications
3. Select appropriate tools and skills
4. Configure platform support (if needed)
5. Create a production-ready agent

**Key Innovation**: This is "agents creating agents" - a meta-level capability that enables rapid agent ecosystem growth.

---

## 🚀 Quick Start

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/kriszwart/ZwartifyOSv1.git
cd ZwartifyOSv1
```

2. **Copy environment variables:**
```bash
cp .env.example .env.local
```

### Environment Variables

**Required:**
```
CLAUDE_API_KEY=your_anthropic_api_key_here
```

**Note:** ZwartifyOS is open source. You bring your own API key. All API calls use your Anthropic API key, and you have full visibility into token usage and costs.

**Optional (Security & Rate Limiting):**
```
# Enable API key authentication
API_KEY=your-secret-api-key-here

# Enable rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

4. **Install dependencies:**
```bash
npm install
```

5. **Run development server:**
```bash
npm run dev
```

6. **View the demo:**
   - Visit `/demo` to see an interactive walkthrough of how G-SAC creates agents
   - The demo works without an API key and shows token usage tracking

## 📊 Token Usage & Cost Tracking

ZwartifyOS includes comprehensive token usage tracking and cost monitoring:

- **Automatic Tracking**: Every API call tracks input/output tokens
- **Cost Calculation**: Real-time cost estimates based on Claude Sonnet 4 pricing
- **Dashboard Analytics**: View total tokens, costs, and per-agent breakdowns
- **Execution Details**: See token usage for each agent execution
- **Usage API**: Programmatic access to usage statistics via `/api/usage/stats`

**Pricing (Claude Sonnet 4):**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

View usage stats in the Dashboard (`/dashboard`) or check individual execution logs.

## 🔐 Security & Production Features

### Environment Validation ✅
- Validates required environment variables on startup
- Clear error messages if missing
- Prevents runtime errors

### Health Check Endpoints ✅
- `GET /api/health` - Basic health check
- `GET /api/ready` - Readiness probe (checks dependencies)

### API Key Authentication ✅ (Optional)
- Enable by setting `API_KEY` environment variable
- Supports multiple auth methods:
  - `Authorization: Bearer <api-key>` header
  - `X-API-Key: <api-key>` header
  - `?apiKey=<api-key>` query parameter

### Rate Limiting ✅ (Optional)
- Enable by setting `RATE_LIMIT_ENABLED=true`
- Configurable limits and windows
- Rate limit headers in responses

### Request Size Limits ✅
- Maximum request size: 10MB
- Prevents abuse from large payloads

See **[PHASE3_IMPLEMENTATION.md](docs/PHASE3_IMPLEMENTATION.md)** for details.

### Local Development

The development workflow:

1. **Edit code** in Cursor for local generation and refactoring
2. **Test agents** via the `/agent` interface
3. **Review changes** with Claude Code for Web
4. **Auto-sync Claude's changes** back to local (see Sync section)
5. **Deploy** to Vercel automatically on push

### Claude Code for Web Sync

ZwartifyOS includes automatic sync to pull changes made by Claude Code for Web back to your local codebase.

**Quick Start:**

```bash
# Start automatic sync watcher (in separate terminal)
npm run sync:watch

# Or check for changes manually
npm run sync:check

# Pull all Claude branches
npm run sync:pull
```

**Configuration** (in `.env.local`):
```
SYNC_ENABLED=true          # Enable/disable auto-sync
SYNC_INTERVAL=30000        # Polling interval in ms (default: 30s)
```

**How it works:**
- Watches for branches matching `claude/*` pattern
- Periodically checks for new commits
- Automatically pulls changes when detected
- Only syncs when working directory is clean (safe)

See the [Sync Workflow Guide](docs/sync-workflow.md) for detailed instructions.

---

## 🔗 Claude Code for Web Connection

### Setup Steps

1. **Install Claude Code for Web** browser extension
2. **Connect to your GitHub repository**
3. **Grant permissions** for code review and commits
4. **Use in your workflow:**
   - Open PRs in Claude Code for Web
   - Request code reviews
   - Let Claude commit directly to GitHub
   - Review and merge changes

Claude Code for Web can:
- Review your ZwartifyOS code
- Suggest improvements
- Write patches
- Commit directly to your repository
- Create pull requests

This creates a continuous improvement loop where your system evolves through AI-assisted code reviews.

---

## 🤖 Using Claude Agents

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

---

## 📚 Examples

### Example 1: WordPress Build Assistant

**Tools:**
- WP JSON REST helper
- Media uploader
- SEO schema generator

**User:** "Build a kitchen portfolio section. Filter by colour and style."

**Agent:**
- Generates CPT schema
- Creates REST endpoints
- Builds grid React components
- Deploys
- Suggests SEO metadata

**Workflow:** Cursor performs local code work → Claude Code for Web commits and refs → Vercel ships

### Example 2: SaaS Boilerplate Generator

**Tools:**
- Stripe helper
- CRUD model creator
- Shadcn UI pack
- Supabase helper

**User:** "Make a subscription product with admin dashboard and event logs."

**Agent:**
- Generates DB schema
- Writes API handlers
- Creates dashboard UI
- Integrates Stripe
- Commits to GitHub
- Deploys

**You simply approve. Reality updates.**

### Example 3: Expert Persona Builder

**Tools:**
- Knowledge embedder
- Memory store
- Persona interpreter

**User:** "Make me an expert on UK probate. Provide templates and calculators."

**Agent:**
- Pulls primary source rules
- Creates calculators
- Wraps persona
- Creates docs route
- Commits to GitHub

**You receive a complete expert in a box, online, within minutes.**

### Example 4: WordPress to React Migration

**User:** "Migrate blog posts from WP to a static Next front end and transform images to WebP. Deploy and hand me RSS output."

**Agent:**
- Reads WP JSON
- Transforms to MDX
- Creates blog route
- Converts images
- Builds RSS
- Commits
- Deploys

**You sip tea. The world rewrites itself.**

---

## 🏗️ Project Structure

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

---

## 🛠️ Building Tools

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

---

## 🤖 Building Agents

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

## 📖 Documentation

- **[Quick Start Guide](docs/quick-start.md)** - Get started in minutes
- **[G-SAC Documentation](docs/g-sac.md)** - Learn about agent creation
- **[Feature Usage Guide](docs/feature-usage.md)** - Complete feature reference
- **[System Overview](docs/system-overview.md)** - Architecture and design
- **[Philosophy](docs/philosophy.md)** - Our approach and beliefs
- **[CHANGELOG](CHANGELOG.md)** - Version history and release notes

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- Core agent system
- Tool registry
- Basic UI
- GitHub integration

### Phase 2: Enhancement ✅
- Enhanced documentation
- Example tools and agents (7 agents, 7 skills)
- Claude Code for Web workflows
- Manifesto and positioning
- RAG system
- Memory system
- Scheduling system
- Skills system

### Phase 3: Autonomous Agent Creation ✅
- Single-prompt agent creation (G-SAC)
- Meta-skills system (BusinessGoalTranslator, ToolIntegrator, PlatformIntegrator)
- Agent lineage tracking
- MCP (Model Context Protocol) support
- Platform-agnostic agent design

### Phase 4: Production Readiness (Next Priority)
- Authentication & API keys
- Rate limiting & security
- Error tracking & monitoring
- Environment validation
- Comprehensive testing
- Health check endpoints
- API versioning

### Phase 4: Performance & UX (Planned)
- Streaming responses
- Caching layer
- Enhanced analytics
- Export functionality
- Webhooks

### Phase 5: Advanced Features (Future)
- Multi-tenancy support
- Advanced RAG (vector databases)
- Agent marketplace
- Docker & deployment guides
- Multi-agent orchestration

See **[IMPROVEMENTS.md](docs/IMPROVEMENTS.md)** for detailed improvement plan.

---

## 🎨 Styling Theme

ZwartifyOS uses a futuristic quantum aesthetic:
- **Color Scheme**: Black base (#000000) with neon green accents (#00ff00)
- **Effects**: Glitch animations, holographic gradients, scanline overlays
- **Typography**: Monospace fonts for terminal/tech feel
- **Animations**: Lightweight CSS animations

See `/styles/animations.css` for custom effects.

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import repository on [Vercel](https://vercel.com)
3. Add environment variables:
   - `CLAUDE_API_KEY` (required)
   - `NEXT_PUBLIC_API_URL` (optional)
4. Deploy automatically on every push

The ACCV stack means:
- **Agents** work
- **Cursor** codes locally
- **Claude** reviews and commits
- **Vercel** deploys instantly

---

## 💡 Why ZwartifyOS is Special

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

---

## 🎯 Key Features

### Core Capabilities

- **Agent Management** - Full CRUD operations for agents
- **RAG System** - Upload documents, build knowledge bases
- **Memory & Context** - Conversation persistence
- **Scheduling** - Cron-based automated runs
- **Skills System** - Domain expertise modules
- **Tool Registry** - Extensible tool system
- **Execution Logging** - Complete observability
- **Token Tracking** - Usage and cost monitoring

### Example Agents Included

1. **PDF Processor** - Document analysis and extraction
2. **Data Analyst** - Data analysis and reporting
3. **Code Reviewer** - Code review and suggestions
4. **Content Writer** - Content generation
5. **Email Assistant** - Email management
6. **Research Assistant** - Research and summarization
7. **Customer Support** - Customer service automation

See [Quick Start Guide](docs/quick-start.md#example-agents-ready-to-test) for details.

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kriszwart/ZwartifyOSv1)

1. Click the button above or import repository on [Vercel](https://vercel.com)
2. Add environment variables:
   - `CLAUDE_API_KEY` (required)
   - `API_KEY` (optional, for API authentication)
   - `RATE_LIMIT_ENABLED` (optional, for rate limiting)
3. Deploy automatically on every push

### Other Platforms

ZwartifyOS works on any platform that supports Next.js:
- Docker containers
- Serverless functions
- Traditional servers

See [Deployment Guide](docs/feature-usage.md#deployment) for details.

---

## 📄 License

MIT License - Copyright (c) 2025 ZwartifyOS

See [LICENSE](./LICENSE) file for full license text.

---

## 🔗 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk/overview) (for future dedicated server implementation)
- [Anthropic API Documentation](https://docs.anthropic.com/en/api/messages) (currently used)
- [Claude Code for Web](https://claude.ai/code)
- [Cursor IDE](https://cursor.sh)

---

**ZwartifyOS. The operating system for building intelligent products.**

**Built with Cursor. Reviewed by Claude. Deployed on Vercel.**

**You are the conductor.**
