# ACCV Stack: Implementation Plan

## What's Missing & How to Fix It

This plan completes the ACCV stack workflow with webhook-based sync, test gating, autonomous agents, and shared context.

---

## Priority 1: Webhook-Based Sync ⚡

**Problem:** Polling GitHub every 30s is slow and wasteful
**Solution:** GitHub webhooks for instant sync

### Implementation

**1. Create webhook endpoint**

File: `app/api/webhook/github/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import crypto from 'crypto'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-hub-signature-256')
  const body = await request.text()

  // Verify GitHub signature
  const secret = process.env.GITHUB_WEBHOOK_SECRET!
  const hash = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')

  if (signature !== hash) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)
  const branch = payload.ref.replace('refs/heads/', '')

  // Only sync claude/* branches
  if (!branch.startsWith('claude/')) {
    return NextResponse.json({ skipped: true, reason: 'Not a claude branch' })
  }

  try {
    // Run sync
    await execAsync('npm run sync:pull')
    return NextResponse.json({ success: true, branch })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**2. Update sync script**

File: `scripts/sync-claude-changes.js` (add at top)
```javascript
const mode = process.argv[2] || 'check'

if (mode === 'webhook') {
  console.log('Webhook mode - use /api/webhook/github endpoint instead')
  process.exit(0)
}
```

**3. GitHub webhook setup**
- Go to: `https://github.com/kriszwart/zwartifyos/settings/hooks`
- Add webhook: `https://your-domain.vercel.app/api/webhook/github`
- Content type: `application/json`
- Secret: Generate random string, add to `.env` as `GITHUB_WEBHOOK_SECRET`
- Events: Select "Just the push event"
- Active: ✓

**4. Environment variables**
```bash
GITHUB_WEBHOOK_SECRET=your-random-secret-here
```

**Time:** 2-3 hours
**Impact:** Instant sync instead of 30s delay

---

## Priority 2: Test Gating 🛡️

**Problem:** Auto-sync can pull broken code
**Solution:** Run tests before syncing, abort if they fail

### Implementation

**1. Create test suite**

File: `tests/agent.test.ts`
```typescript
import { describe, it, expect } from '@jest/globals'

describe('Agent API', () => {
  it('should respond to POST /api/agent', async () => {
    const response = await fetch('http://localhost:3000/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'test' })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('text')
  })
})
```

**2. Update sync script with test gate**

File: `scripts/sync-claude-changes.js` (update pullChanges function)
```javascript
async function pullChanges(branch) {
  console.log(`Running tests before pulling ${branch}...`)

  try {
    // Run tests
    execSync('npm test', { stdio: 'inherit' })
    console.log('✓ Tests passed')
  } catch (error) {
    console.error('✗ Tests failed - aborting sync')
    logToFile(`SYNC BLOCKED: Tests failed for ${branch}`)
    return false
  }

  // Tests passed, proceed with pull
  execSync(`git pull origin ${branch}`, { stdio: 'inherit' })
  console.log(`✓ Pulled ${branch}`)
  return true
}

function logToFile(message) {
  const fs = require('fs')
  const timestamp = new Date().toISOString()
  fs.appendFileSync('.sync-log.txt', `${timestamp}: ${message}\n`)
}
```

**3. Install test framework**

```bash
npm install --save-dev jest @jest/globals @types/jest ts-jest
```

**4. Add test script**

File: `package.json`
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node"
  }
}
```

**Time:** 3-4 hours
**Impact:** Safety net prevents broken code from auto-syncing

---

## Priority 3: Agent GitHub Integration 🤖

**Problem:** Agents can't create PRs or merge autonomously
**Solution:** GitHub tool for agents

### Implementation

**1. Install Octokit**

```bash
npm install @octokit/rest
```

**2. Create GitHub tool**

File: `backend/tools/github.ts`
```typescript
import { Octokit } from '@octokit/rest'
import { z } from 'zod'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
const [owner, repo] = process.env.GITHUB_REPO!.split('/')

export const githubTools = [
  {
    name: 'create_pull_request',
    description: 'Create a pull request on GitHub',
    input_schema: z.object({
      title: z.string(),
      body: z.string(),
      head: z.string().describe('Source branch'),
      base: z.string().describe('Target branch (usually main)'),
    }),
    async execute({ title, body, head, base }) {
      const result = await octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base,
      })

      return {
        pr_number: result.data.number,
        url: result.data.html_url,
      }
    },
  },

  {
    name: 'merge_pull_request',
    description: 'Merge a pull request (only if tests pass)',
    input_schema: z.object({
      pr_number: z.number(),
      merge_method: z.enum(['merge', 'squash', 'rebase']).default('squash'),
    }),
    async execute({ pr_number, merge_method }) {
      // Check if tests pass
      const checks = await octokit.checks.listForRef({
        owner,
        repo,
        ref: `pull/${pr_number}/head`,
      })

      const allPassed = checks.data.check_runs.every(
        run => run.conclusion === 'success'
      )

      if (!allPassed) {
        return { success: false, reason: 'Tests have not passed' }
      }

      // Merge
      const result = await octokit.pulls.merge({
        owner,
        repo,
        pull_number: pr_number,
        merge_method,
      })

      return { success: true, sha: result.data.sha }
    },
  },

  {
    name: 'list_pull_requests',
    description: 'List open pull requests',
    input_schema: z.object({
      state: z.enum(['open', 'closed', 'all']).default('open'),
    }),
    async execute({ state }) {
      const result = await octokit.pulls.list({
        owner,
        repo,
        state,
      })

      return result.data.map(pr => ({
        number: pr.number,
        title: pr.title,
        branch: pr.head.ref,
        url: pr.html_url,
      }))
    },
  },
]
```

**3. Register with agent**

File: `backend/agent.ts`
```typescript
import { githubTools } from './tools/github'

const tools = [
  ...existingTools,
  ...githubTools,
]
```

**4. Environment variables**

File: `.env`
```bash
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_REPO=kriszwart/zwartifyos
```

**Create GitHub token:**
- Go to: https://github.com/settings/tokens/new
- Scopes: `repo` (full control)
- Copy token to `.env`

**Time:** 4-5 hours
**Impact:** Agents can now create/merge PRs autonomously

---

## Priority 4: Shared Context System 🧠

**Problem:** Cursor, Claude Code, and Agents don't share context
**Solution:** Centralized context file + API

### Implementation

**1. Create context schema**

File: `lib/context-schema.ts`
```typescript
export interface SessionContext {
  currentTask: string
  decisions: Array<{
    question: string
    decision: string
    timestamp: Date
  }>
  blockers: Array<{
    issue: string
    status: 'open' | 'resolved'
  }>
  nextSteps: string[]
  lastUpdated: Date
  updatedBy: 'cursor' | 'claude-code' | 'agent'
}
```

**2. Create context API**

File: `app/api/context/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONTEXT_FILE = path.join(process.cwd(), '.context/session.json')

export async function GET() {
  try {
    const data = await fs.readFile(CONTEXT_FILE, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch {
    return NextResponse.json({ error: 'No context found' }, { status: 404 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const context = {
    ...body,
    lastUpdated: new Date().toISOString(),
  }

  await fs.mkdir(path.dirname(CONTEXT_FILE), { recursive: true })
  await fs.writeFile(CONTEXT_FILE, JSON.stringify(context, null, 2))

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  await fs.unlink(CONTEXT_FILE)
  return NextResponse.json({ success: true })
}
```

**3. Create context tool for agent**

File: `backend/tools/context.ts`
```typescript
import { z } from 'zod'
import fs from 'fs/promises'

const CONTEXT_FILE = '.context/session.json'

export const contextTools = [
  {
    name: 'read_context',
    description: 'Read the current session context',
    input_schema: z.object({}),
    async execute() {
      const data = await fs.readFile(CONTEXT_FILE, 'utf-8')
      return JSON.parse(data)
    },
  },

  {
    name: 'update_context',
    description: 'Update session context with new information',
    input_schema: z.object({
      currentTask: z.string().optional(),
      addDecision: z.object({
        question: z.string(),
        decision: z.string(),
      }).optional(),
      addBlocker: z.string().optional(),
      addNextStep: z.string().optional(),
    }),
    async execute(updates) {
      let context = {}

      try {
        const data = await fs.readFile(CONTEXT_FILE, 'utf-8')
        context = JSON.parse(data)
      } catch {}

      if (updates.currentTask) context.currentTask = updates.currentTask
      if (updates.addDecision) {
        context.decisions = context.decisions || []
        context.decisions.push({
          ...updates.addDecision,
          timestamp: new Date(),
        })
      }
      if (updates.addBlocker) {
        context.blockers = context.blockers || []
        context.blockers.push({
          issue: updates.addBlocker,
          status: 'open',
        })
      }
      if (updates.addNextStep) {
        context.nextSteps = context.nextSteps || []
        context.nextSteps.push(updates.addNextStep)
      }

      context.lastUpdated = new Date()
      context.updatedBy = 'agent'

      await fs.writeFile(CONTEXT_FILE, JSON.stringify(context, null, 2))
      return { success: true }
    },
  },
]
```

**4. Update .cursorrules**

File: `.cursorrules` (add this)
```
IMPORTANT: Before starting any task, read .context/session.json to understand:
- Current task
- Decisions already made
- Known blockers
- Next steps planned

After making significant changes, update .context/session.json with:
- What you implemented
- Decisions you made
- Any new blockers
- What should be done next

This ensures consistency across Cursor, Claude Code, and Agents.
```

**5. Add to .gitignore**

File: `.gitignore`
```
.context/
```

**Time:** 3-4 hours
**Impact:** All tools share context, no more duplicate work or conflicting decisions

---

## Priority 5: Multi-Agent Orchestration 🎭

**Problem:** Only one agent can work at a time
**Solution:** Orchestrator that manages multiple agents in parallel

### Implementation

**1. Create task queue**

File: `backend/task-queue.ts`
```typescript
interface Task {
  id: string
  type: string
  description: string
  assignedTo?: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  result?: any
  createdAt: Date
  completedAt?: Date
}

export class TaskQueue {
  private tasks: Task[] = []

  add(type: string, description: string): string {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2)}`
    this.tasks.push({
      id,
      type,
      description,
      status: 'pending',
      createdAt: new Date(),
    })
    return id
  }

  getNext(agentId: string): Task | null {
    const task = this.tasks.find(t => t.status === 'pending')
    if (task) {
      task.status = 'in-progress'
      task.assignedTo = agentId
    }
    return task
  }

  complete(taskId: string, result: any) {
    const task = this.tasks.find(t => t.id === taskId)
    if (task) {
      task.status = 'completed'
      task.result = result
      task.completedAt = new Date()
    }
  }

  fail(taskId: string, error: string) {
    const task = this.tasks.find(t => t.id === taskId)
    if (task) {
      task.status = 'failed'
      task.result = { error }
      task.completedAt = new Date()
    }
  }

  getStatus() {
    return {
      pending: this.tasks.filter(t => t.status === 'pending').length,
      inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      failed: this.tasks.filter(t => t.status === 'failed').length,
    }
  }
}
```

**2. Create orchestrator**

File: `backend/orchestrator.ts`
```typescript
import { TaskQueue } from './task-queue'

interface Agent {
  id: string
  type: string
  busy: boolean
  execute: (task: any) => Promise<any>
}

export class Orchestrator {
  private queue = new TaskQueue()
  private agents: Agent[] = []

  registerAgent(agent: Agent) {
    this.agents.push(agent)
  }

  async addTask(type: string, description: string) {
    const taskId = this.queue.add(type, description)
    this.processQueue()
    return taskId
  }

  private async processQueue() {
    // Find available agents
    const availableAgents = this.agents.filter(a => !a.busy)

    for (const agent of availableAgents) {
      const task = this.queue.getNext(agent.id)
      if (!task) continue

      agent.busy = true

      try {
        const result = await agent.execute(task)
        this.queue.complete(task.id, result)
      } catch (error) {
        this.queue.fail(task.id, error.message)
      } finally {
        agent.busy = false
        this.processQueue() // Check for more tasks
      }
    }
  }

  getStatus() {
    return {
      queue: this.queue.getStatus(),
      agents: this.agents.map(a => ({
        id: a.id,
        type: a.type,
        busy: a.busy,
      })),
    }
  }
}
```

**3. Create specialized agents**

File: `backend/agents/test-runner.ts`
```typescript
import { execSync } from 'child_process'

export const testRunnerAgent = {
  id: 'test-runner',
  type: 'test-runner',
  busy: false,

  async execute(task: any) {
    console.log(`Running tests for: ${task.description}`)

    try {
      const output = execSync('npm test', { encoding: 'utf-8' })
      return { success: true, output }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
}
```

File: `backend/agents/code-reviewer.ts`
```typescript
import { Anthropic } from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const codeReviewerAgent = {
  id: 'code-reviewer',
  type: 'code-reviewer',
  busy: false,

  async execute(task: any) {
    const { filePath, code } = task

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Review this code for quality, bugs, and best practices:\n\n${code}`,
      }],
    })

    return { review: response.content[0].text }
  },
}
```

**4. Create orchestrator API**

File: `app/api/orchestrator/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { orchestrator } from '@/backend/orchestrator-instance'

export async function POST(request: NextRequest) {
  const { type, description } = await request.json()
  const taskId = await orchestrator.addTask(type, description)
  return NextResponse.json({ taskId })
}

export async function GET() {
  const status = orchestrator.getStatus()
  return NextResponse.json(status)
}
```

File: `backend/orchestrator-instance.ts`
```typescript
import { Orchestrator } from './orchestrator'
import { testRunnerAgent } from './agents/test-runner'
import { codeReviewerAgent } from './agents/code-reviewer'

export const orchestrator = new Orchestrator()

// Register agents
orchestrator.registerAgent(testRunnerAgent)
orchestrator.registerAgent(codeReviewerAgent)
```

**Time:** 6-8 hours
**Impact:** Multiple agents can work in parallel, massive productivity increase

---

## Quick Start Guide

Copy this to Cursor:

```
Priority order:

1. WEBHOOK SYNC (2-3 hours)
   - Create app/api/webhook/github/route.ts
   - Set up GitHub webhook in repo settings
   - Add GITHUB_WEBHOOK_SECRET to .env

2. TEST GATING (3-4 hours)
   - Install jest: npm install --save-dev jest @jest/globals ts-jest
   - Create tests/agent.test.ts
   - Update scripts/sync-claude-changes.js to run tests before pulling

3. GITHUB AGENT TOOL (4-5 hours)
   - Install octokit: npm install @octokit/rest
   - Create backend/tools/github.ts
   - Add GITHUB_TOKEN to .env
   - Register tools in backend/agent.ts

4. SHARED CONTEXT (3-4 hours)
   - Create app/api/context/route.ts
   - Create backend/tools/context.ts
   - Update .cursorrules

5. MULTI-AGENT (6-8 hours)
   - Create backend/task-queue.ts
   - Create backend/orchestrator.ts
   - Create specialized agents in backend/agents/
   - Create app/api/orchestrator/route.ts

Start with #1 (webhook sync) for immediate impact.
```
