# ZwartifyOS

![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-v1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

**Build & deploy AI agents in hours, not months.**

ZwartifyOS is an open-source operating system for AI agents. One-prompt agent creation. Built-in RAG + memory. Token tracking. Deploy on Vercel in minutes. MIT-licensed. Bring your own API keys.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kriszwart/ZwartifyOSv1)

---

## 📸 Screenshot / Demo

> **TODO:** Add a GIF or screenshot showing:
> - G-SAC creating an agent from a prompt
> - Dashboard with token usage
> - Agent playground in action
>
> **Recommended:** Record a 30-second screen capture of the `/create-agent` flow and convert to GIF.

---

## ✨ Why ZwartifyOS?

- **🤖 Agents Create Agents** - G-SAC creates fully configured agents from natural language prompts
- **🚀 Production-Ready** - Built-in RAG, memory, scheduling, token tracking, and cost monitoring
- **⚡ Deploy Instantly** - One-click Vercel deployment, works out of the box
- **🔓 Open Source** - MIT license, bring your own API keys, full transparency

---

## 🚀 Quick Start

# 1. Clone the repository
git clone https://github.com/kriszwart/ZwartifyOSv1.git
cd ZwartifyOSv1

# 2. Install dependencies
npm install

# 3. Add your API key
echo "CLAUDE_API_KEY=your-key-here" > .env.local

# 4. Start the server
npm run devVisit `http://localhost:3000` → Go to `/settings` → Add your Anthropic API key → Start building agents.

**See [Quick Start Guide](docs/quick-start.md) for detailed setup.**

---

## 🎯 Core Features

- **Agent Management** - Create, configure, and monitor agents via web UI
- **G-SAC** - Growth Strategy Agent Creator (agents that create agents)
- **RAG System** - Knowledge base management for contextual agents
- **Memory & Context** - Conversation persistence and context management
- **Scheduling** - Automated agent runs with cron expressions
- **Token Tracking** - Real-time usage and cost monitoring dashboard
- **7 Example Agents** - PDF Processor, Data Analyst, Code Reviewer, Content Writer, Email Assistant, Research Assistant, Customer Support
- **7 Built-in Skills** - Domain expertise modules ready to use

---

## 🌟 G-SAC: Agents That Create Agents

**G-SAC is ZwartifyOS's meta-agent that creates other agents from a single natural language prompt.**

Instead of manually configuring agents, tools, and integrations, simply describe what you want:

"Create an agent that qualifies sales leads and schedules demos"
"Build a customer support agent for Slack and Discord"
"Create a content creator agent that posts to Twitter and LinkedIn") for complete details and examples.**

---

## 🏗️ Architecture

<details>
<summary><strong>ACCV Stack: Agents. Cursor. Claude. Vercel.</strong></summary>

ZwartifyOS coordinates intelligence the way Unix coordinated programs:

- **Agents** are userland programs
- **Tools** are capabilities
- **Interactions** are processes
- **You** are root

**The ACCV Stack:**
- **Cursor** - Local code generation and editing
- **Claude Code for Web** - Code review and commits
- **Claude API** - Powers intelligent agents (standard Anthropic SDK)
- **GitHub** - Version control and collaboration
- **Vercel** - Instant deployment

This creates a continuous development loop where code evolves through AI-assisted workflows.

**See [Architecture Documentation](docs/ARCHITECTURE.md) for deep dive.**
</details>

---

## 📊 Comparison

## 📊 Comparison

| Feature                  | ZwartifyOS | LangChain | CrewAI | AutoGen |
|--------------------------|------------|-----------|--------|---------|
| **Agents create agents** | ✅         | ❌        | ❌     | ❌      |
| **Built-in Web UI**      | ✅         | ❌        | ⚠️     | ❌      |
| **Cost + token tracking**| ✅         | ❌        | ❌     | ❌      |
| **Vercel-native**        | ✅         | ❌        | ❌     | ❌      |
| **MIT License**          | ✅         | ✅        | ✅     | ✅      |
| **G-SAC meta agent**     | ✅         | ❌        | ❌     | ❌      |
| **RAG + Memory built-in**| ✅         | ⚠️        | ⚠️     | ⚠️      |
| **One-click deployment** | ✅         | ❌        | ❌     | ❌      |

---

## 🎯 Use Cases

- **AI-Powered SaaS Products** - Customer support automation, knowledge base assistants, content generation platforms
- **Rapid Prototyping** - Test agent ideas quickly, validate concepts, launch MVPs fast
- **Internal Tools** - Employee assistants, document Q&A systems, automated reporting
- **White-Label Solutions** - Deploy for clients, custom branding, agent marketplaces

**See [Use Cases & Examples](docs/EXAMPLES.md) for detailed walkthroughs.**

---

## 🗺️ Roadmap

**Phase 1-3: Foundation & Enhancement** ✅
- Core agent system, G-SAC, RAG, memory, scheduling, token tracking

**Phase 4: Production Readiness** ✅
- Authentication, rate limiting, health checks, error logging

**Next: Performance & UX**
- Streaming responses, caching layer, enhanced analytics

**See [Full Roadmap](app/roadmap/page.tsx) for complete timeline.**

---

## 📖 Documentation

- **[Quick Start Guide](docs/quick-start.md)** - Get started in minutes
- **[G-SAC Documentation](docs/g-sac.md)** - Learn about agent creation
- **[Feature Usage Guide](docs/feature-usage.md)** - Complete feature reference
- **[Architecture Deep Dive](docs/ARCHITECTURE.md)** - System design and ACCV stack
- **[Examples & Use Cases](docs/EXAMPLES.md)** - Real-world examples and walkthroughs
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Philosophy](docs/philosophy.md)** - Our approach and beliefs
- **[CHANGELOG](CHANGELOG.md)** - Version history and release notes

---

## 📄 License

MIT License - Copyright (c) 2025 ZwartifyOS

See [LICENSE](./LICENSE) file for full license text.

---

**ZwartifyOS. The operating system for building intelligent products.**

**Built with Cursor. Reviewed by Claude. Deployed on Vercel.**

**You are the conductor.**
