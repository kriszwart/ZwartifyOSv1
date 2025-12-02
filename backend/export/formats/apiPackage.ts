/**
 * API Package Generator
 * 
 * Generates a deployable API package with:
 * - Dockerfile
 * - Serverless function templates (Vercel, Netlify)
 * - API route handlers
 * - Environment configuration
 * - README with setup guide
 */

import { AgentDefinition } from '../../db/types'
import { ExportResult } from '../agentExporter'

export interface APIPackageFiles {
  [path: string]: string
}

export async function exportAsAPIPackage(
  agent: AgentDefinition,
  apiUrl: string
): Promise<ExportResult> {
  const packageName = `zwartify-agent-${agent.id}`
  
  const files: APIPackageFiles = {
    'package.json': generatePackageJson(agent, packageName),
    'Dockerfile': generateDockerfile(agent, packageName),
    'vercel.json': generateVercelConfig(agent),
    'netlify.toml': generateNetlifyConfig(agent),
    'api/index.ts': generateAPIRoute(agent, apiUrl),
    '.env.example': generateEnvExample(agent, apiUrl),
    'README.md': generateReadme(agent, packageName, apiUrl),
  }
  
  return {
    format: 'api',
    content: JSON.stringify(files, null, 2),
    mimeType: 'application/json',
    filename: `${packageName}.json`,
    embedCode: `// API Endpoint: ${apiUrl}
// Use with fetch or your HTTP client
fetch('${apiUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: 'Your message here' })
})`,
    installInstructions: `1. Download the API package
2. Extract and configure environment variables (see .env.example)
3. Deploy to your hosting platform:
   - Docker: docker build -t ${packageName} . && docker run -p 3000:3000 ${packageName}
   - Vercel: vercel deploy
   - Netlify: netlify deploy
4. Use the API endpoint to interact with the agent
5. See README.md for detailed setup instructions`
  }
}

function generatePackageJson(agent: AgentDefinition, packageName: string): string {
  return JSON.stringify({
    name: packageName,
    version: agent.version || '1.0.0',
    description: agent.description || 'Zwartify AI Agent API',
    main: 'api/index.ts',
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    },
    dependencies: {
      '@anthropic-ai/sdk': '^0.68.0',
      next: '16.0.1',
      react: '19.2.0',
      'react-dom': '19.2.0',
    },
    devDependencies: {
      '@types/node': '^20',
      typescript: '^5',
    },
  }, null, 2)
}

function generateDockerfile(agent: AgentDefinition, packageName: string): string {
  return `FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
`
}

function generateVercelConfig(agent: AgentDefinition): string {
  return JSON.stringify({
    version: 2,
    builds: [
      {
        src: 'api/index.ts',
        use: '@vercel/node',
      },
    ],
    routes: [
      {
        src: '/api/(.*)',
        dest: '/api/index.ts',
      },
    ],
  }, null, 2)
}

function generateNetlifyConfig(agent: AgentDefinition): string {
  return `[build]
  command = "npm run build"
  functions = "api"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
`
}

function generateAPIRoute(agent: AgentDefinition, apiUrl: string): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()
    
    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      )
    }
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: \`${agent.prompt.replace(/`/g, '\\`')}\`,
      messages: [
        {
          role: 'user',
          content: input,
        },
      ],
    })
    
    const responseText = message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\\n')
    
    return NextResponse.json({
      agentId: '${agent.id}',
      agentName: '${agent.name}',
      response: responseText,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    agentId: '${agent.id}',
    agentName: '${agent.name}',
    description: '${agent.description || ''}',
    version: '${agent.version || '1.0.0'}',
  })
}
`
}

function generateEnvExample(agent: AgentDefinition, apiUrl: string): string {
  return `# Anthropic API Key
ANTHROPIC_API_KEY=your_api_key_here

# Base URL (for callbacks)
BASE_URL=${apiUrl}

# Agent Configuration
AGENT_ID=${agent.id}
AGENT_NAME=${agent.name}
`
}

function generateReadme(agent: AgentDefinition, packageName: string, apiUrl: string): string {
  return `# ${agent.name}

${agent.description || 'Zwartify AI Agent API Package'}

## Description

${agent.description || 'A deployable API package for the Zwartify AI Agent'}

## Quick Start

### Prerequisites

- Node.js 20 or later
- Anthropic API key

### Installation

1. Extract this package
2. Copy \`.env.example\` to \`.env\` and configure your API key
3. Install dependencies: \`npm install\`
4. Run locally: \`npm run dev\`

### Deployment

#### Docker

\`\`\`bash
docker build -t ${packageName} .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=your_key ${packageName}
\`\`\`

#### Vercel

\`\`\`bash
vercel deploy
\`\`\`

#### Netlify

\`\`\`bash
netlify deploy
\`\`\`

## API Usage

### POST /api

Send a message to the agent:

\`\`\`bash
curl -X POST ${apiUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"input": "Hello, agent!"}'
\`\`\`

### GET /api

Get agent information:

\`\`\`bash
curl ${apiUrl}
\`\`\`

## Configuration

Set the following environment variables:

- \`ANTHROPIC_API_KEY\`: Your Anthropic API key (required)
- \`BASE_URL\`: Base URL for callbacks (optional)
- \`AGENT_ID\`: Agent ID (default: ${agent.id})
- \`AGENT_NAME\`: Agent name (default: ${agent.name})

## License

MIT
`
}



