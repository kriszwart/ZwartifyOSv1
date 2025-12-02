/**
 * NPM Package Generator
 * 
 * Generates an NPM package structure with:
 * - package.json
 * - TypeScript definitions
 * - Usage examples
 * - README with installation
 */

import { AgentDefinition } from '../../db/types'
import { ExportResult } from '../agentExporter'

export interface NPMPackageFiles {
  [path: string]: string
}

export async function exportAsNPMPackage(
  agent: AgentDefinition,
  apiUrl: string
): Promise<ExportResult> {
  const packageName = `@zwartify/agent-${agent.id}`
  const safeName = agent.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  
  const files: NPMPackageFiles = {
    'package.json': generatePackageJson(agent, packageName, safeName),
    'index.ts': generateIndexFile(agent, apiUrl),
    'index.d.ts': generateTypeDefinitions(agent),
    'README.md': generateReadme(agent, packageName, safeName, apiUrl),
    'example.ts': generateExample(agent, packageName),
  }
  
  return {
    format: 'npm',
    content: JSON.stringify(files, null, 2),
    mimeType: 'application/json',
    filename: `${packageName}.json`,
    embedCode: `npm install ${packageName}`,
    installInstructions: `1. Install the package: npm install ${packageName}
2. Import in your code: import { ${safeName} } from '${packageName}'
3. Use the agent in your application
4. See package README for usage examples`
  }
}

function generatePackageJson(
  agent: AgentDefinition,
  packageName: string,
  safeName: string
): string {
  return JSON.stringify({
    name: packageName,
    version: agent.version || '1.0.0',
    description: agent.description || `Zwartify AI Agent: ${agent.name}`,
    main: 'index.js',
    types: 'index.d.ts',
    scripts: {
      build: 'tsc',
      prepublishOnly: 'npm run build',
    },
    keywords: [
      'zwartify',
      'ai',
      'agent',
      'claude',
      'anthropic',
      ...(agent.tags || []),
    ],
    author: 'Zwartify',
    license: 'MIT',
    dependencies: {
      '@anthropic-ai/sdk': '^0.68.0',
    },
    devDependencies: {
      typescript: '^5',
      '@types/node': '^20',
    },
    files: ['index.js', 'index.d.ts', 'README.md'],
  }, null, 2)
}

function generateIndexFile(agent: AgentDefinition, apiUrl: string): string {
  return `import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface AgentConfig {
  apiKey?: string
  baseUrl?: string
}

export interface AgentResponse {
  text: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export class ${agent.name.replace(/[^a-zA-Z0-9]/g, '')}Agent {
  private apiKey: string
  private baseUrl: string
  private agentId: string = '${agent.id}'
  private agentPrompt: string = \`${agent.prompt.replace(/`/g, '\\`')}\`

  constructor(config?: AgentConfig) {
    this.apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY || ''
    this.baseUrl = config?.baseUrl || '${apiUrl}'
    
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required')
    }
  }

  async send(input: string): Promise<AgentResponse> {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: this.agentPrompt,
        messages: [
          {
            role: 'user',
            content: input,
          },
        ],
      })

      const text = message.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('\\n')

      return {
        text,
        usage: {
          inputTokens: message.usage?.input_tokens || 0,
          outputTokens: message.usage?.output_tokens || 0,
        },
      }
    } catch (error) {
      throw new Error(\`Agent error: \${error instanceof Error ? error.message : 'Unknown error'}\`)
    }
  }

  async stream(input: string): Promise<AsyncIterable<string>> {
    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: this.agentPrompt,
      messages: [
        {
          role: 'user',
          content: input,
        },
      ],
    })

    return (async function* () {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text
        }
      }
    })()
  }
}

export default ${agent.name.replace(/[^a-zA-Z0-9]/g, '')}Agent
`
}

function generateTypeDefinitions(agent: AgentDefinition): string {
  const className = agent.name.replace(/[^a-zA-Z0-9]/g, '')
  
  return `export interface AgentConfig {
  apiKey?: string
  baseUrl?: string
}

export interface AgentResponse {
  text: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export declare class ${className}Agent {
  constructor(config?: AgentConfig)
  send(input: string): Promise<AgentResponse>
  stream(input: string): Promise<AsyncIterable<string>>
}

export default ${className}Agent
`
}

function generateExample(agent: AgentDefinition, packageName: string): string {
  const className = agent.name.replace(/[^a-zA-Z0-9]/g, '')
  
  return `import ${className}Agent from '${packageName}'

// Initialize the agent
const agent = new ${className}Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Send a message
async function example() {
  try {
    // Simple request
    const response = await agent.send('Hello, how are you?')
    console.log('Response:', response.text)
    console.log('Tokens used:', response.usage)

    // Streaming response
    console.log('\\nStreaming response:')
    for await (const chunk of await agent.stream('Tell me a story')) {
      process.stdout.write(chunk)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

example()
`
}

function generateReadme(
  agent: AgentDefinition,
  packageName: string,
  safeName: string,
  apiUrl: string
): string {
  const className = agent.name.replace(/[^a-zA-Z0-9]/g, '')
  
  return `# ${agent.name}

${agent.description || 'Zwartify AI Agent NPM Package'}

## Installation

\`\`\`bash
npm install ${packageName}
\`\`\`

## Quick Start

\`\`\`typescript
import ${className}Agent from '${packageName}'

// Initialize the agent
const agent = new ${className}Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Send a message
const response = await agent.send('Hello!')
console.log(response.text)
\`\`\`

## API

### Constructor

\`\`\`typescript
new ${className}Agent(config?: AgentConfig)
\`\`\`

**Config:**
- \`apiKey\` (optional): Anthropic API key. Defaults to \`process.env.ANTHROPIC_API_KEY\`
- \`baseUrl\` (optional): Base URL for the agent API. Defaults to \`${apiUrl}\`

### Methods

#### \`send(input: string): Promise<AgentResponse>\`

Send a message to the agent and get a response.

\`\`\`typescript
const response = await agent.send('What is the weather like?')
console.log(response.text) // Agent's response
console.log(response.usage) // Token usage information
\`\`\`

#### \`stream(input: string): Promise<AsyncIterable<string>>\`

Send a message and get a streaming response.

\`\`\`typescript
for await (const chunk of await agent.stream('Tell me a story')) {
  process.stdout.write(chunk)
}
\`\`\`

## Environment Variables

- \`ANTHROPIC_API_KEY\`: Your Anthropic API key (required)

## License

MIT

## Support

For issues and questions, visit https://zwartify.com
`
}




