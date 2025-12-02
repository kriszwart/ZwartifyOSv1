"use client"

import { useState } from 'react'
import type { CustomNode, CustomEdge } from '../types'

interface BuilderDemoProps {
  onLoadExample: (nodes: CustomNode[], edges: CustomEdge[]) => void
  onClose: () => void
}

interface DemoFeature {
  id: string
  title: string
  description: string
  icon: string
  example: {
    nodes: CustomNode[]
    edges: CustomEdge[]
  }
  tips: string[]
}

const demoFeatures: DemoFeature[] = [
  {
    id: 'magnetic-connections',
    title: 'Magnetic Connections',
    description: 'Drag from any handle - connections snap automatically to valid targets within 50px',
    icon: '🧲',
    example: {
      nodes: [
        {
          id: 'agent-1',
          type: 'agentConfig',
          position: { x: 200, y: 200 },
          data: {
            name: 'Demo Agent',
            description: 'Try dragging the connection handle',
            prompt: 'You are a helpful assistant.',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
          },
        },
        {
          id: 'tool-1',
          type: 'tool',
          position: { x: 600, y: 150 },
          data: {
            toolName: 'searchTools',
            toolDescription: 'Dynamic tool discovery',
            enabled: true,
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 1000, y: 200 },
          data: {
            agentConfig: {
              name: 'Demo Agent',
              description: '',
              prompt: '',
              enabled: true,
              useMemory: true,
              version: '1.0.0',
              toolNames: [],
              skillIds: [],
            },
          },
        },
      ],
      edges: [],
    },
    tips: [
      'Hover over handles to see them glow',
      'Drag near a valid target - it will snap automatically',
      'Invalid connections show in red',
    ],
  },
  {
    id: 'auto-layout',
    title: 'Auto-Layout',
    description: 'One-click arrangement - organizes nodes in a clean hierarchical layout',
    icon: '⚡',
    example: {
      nodes: [
        {
          id: 'agent-1',
          type: 'agentConfig',
          position: { x: 100, y: 100 },
          data: {
            name: 'Layout Demo',
            description: 'Click Arrange to auto-organize',
            prompt: 'Auto-layout demo',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
          },
        },
        {
          id: 'tool-1',
          type: 'tool',
          position: { x: 50, y: 300 },
          data: {
            toolName: 'tool1',
            toolDescription: 'Tool 1',
            enabled: true,
          },
        },
        {
          id: 'tool-2',
          type: 'tool',
          position: { x: 200, y: 400 },
          data: {
            toolName: 'tool2',
            toolDescription: 'Tool 2',
            enabled: true,
          },
        },
        {
          id: 'skill-1',
          type: 'skill',
          position: { x: 300, y: 500 },
          data: {
            skillId: 'skill1',
            skillName: 'Skill 1',
            skillDescription: 'A skill',
            enabled: true,
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 500, y: 200 },
          data: {
            agentConfig: {
              name: 'Layout Demo',
              description: '',
              prompt: '',
              enabled: true,
              useMemory: true,
              version: '1.0.0',
              toolNames: [],
              skillIds: [],
            },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'agent-1', target: 'tool-1', type: 'custom' },
        { id: 'e2', source: 'agent-1', target: 'tool-2', type: 'custom' },
        { id: 'e3', source: 'agent-1', target: 'skill-1', type: 'custom' },
        { id: 'e4', source: 'tool-1', target: 'output-1', type: 'custom' },
        { id: 'e5', source: 'tool-2', target: 'output-1', type: 'custom' },
        { id: 'e6', source: 'skill-1', target: 'output-1', type: 'custom' },
      ],
    },
    tips: [
      'Click the ⚡ Arrange button in the header',
      'Nodes automatically organize: AgentConfig → Components → Output',
      'Perfect for cleaning up messy workflows',
    ],
  },
  {
    id: 'multi-select',
    title: 'Multi-Select & Bulk Operations',
    description: 'Select multiple nodes with Cmd/Ctrl+Click, then perform bulk actions',
    icon: '📦',
    example: {
      nodes: [
        {
          id: 'agent-1',
          type: 'agentConfig',
          position: { x: 200, y: 200 },
          data: {
            name: 'Multi-Select Demo',
            description: 'Try selecting multiple nodes',
            prompt: 'Demo',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
          },
        },
        {
          id: 'tool-1',
          type: 'tool',
          position: { x: 600, y: 150 },
          data: {
            toolName: 'tool1',
            toolDescription: 'Tool 1',
            enabled: true,
          },
        },
        {
          id: 'tool-2',
          type: 'tool',
          position: { x: 600, y: 250 },
          data: {
            toolName: 'tool2',
            toolDescription: 'Tool 2',
            enabled: true,
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 1000, y: 200 },
          data: {
            agentConfig: {
              name: 'Multi-Select Demo',
              description: '',
              prompt: '',
              enabled: true,
              useMemory: true,
              version: '1.0.0',
              toolNames: [],
              skillIds: [],
            },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'agent-1', target: 'tool-1', type: 'custom' },
        { id: 'e2', source: 'agent-1', target: 'tool-2', type: 'custom' },
        { id: 'e3', source: 'tool-1', target: 'output-1', type: 'custom' },
        { id: 'e4', source: 'tool-2', target: 'output-1', type: 'custom' },
      ],
    },
    tips: [
      'Hold Cmd/Ctrl and click multiple nodes',
      'Use Cmd/Ctrl+A to select all',
      'Bulk delete, duplicate, or toggle enabled state',
    ],
  },
  {
    id: 'copy-paste',
    title: 'Copy & Paste',
    description: 'Duplicate nodes with their connections using Cmd/Ctrl+C and Cmd/Ctrl+V',
    icon: '📋',
    example: {
      nodes: [
        {
          id: 'agent-1',
          type: 'agentConfig',
          position: { x: 200, y: 200 },
          data: {
            name: 'Copy Demo',
            description: 'Select and copy this node',
            prompt: 'Try copying me!',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
          },
        },
        {
          id: 'tool-1',
          type: 'tool',
          position: { x: 600, y: 200 },
          data: {
            toolName: 'exampleTool',
            toolDescription: 'An example tool',
            enabled: true,
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 1000, y: 200 },
          data: {
            agentConfig: {
              name: 'Copy Demo',
              description: '',
              prompt: '',
              enabled: true,
              useMemory: true,
              version: '1.0.0',
              toolNames: [],
              skillIds: [],
            },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'agent-1', target: 'tool-1', type: 'custom' },
        { id: 'e2', source: 'tool-1', target: 'output-1', type: 'custom' },
      ],
    },
    tips: [
      'Select nodes and press Cmd/Ctrl+C',
      'Paste with Cmd/Ctrl+V - connections are preserved',
      'Use Cmd/Ctrl+D for quick duplicate',
    ],
  },
  {
    id: 'search',
    title: 'Node Search',
    description: 'Find nodes instantly with Cmd/Ctrl+F - navigate with Enter',
    icon: '🔍',
    example: {
      nodes: [
        {
          id: 'agent-1',
          type: 'agentConfig',
          position: { x: 200, y: 200 },
          data: {
            name: 'Searchable Agent',
            description: 'Try searching for me!',
            prompt: 'Search demo',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
          },
        },
        {
          id: 'tool-search',
          type: 'tool',
          position: { x: 600, y: 150 },
          data: {
            toolName: 'searchTools',
            toolDescription: 'Search for tools',
            enabled: true,
          },
        },
        {
          id: 'tool-other',
          type: 'tool',
          position: { x: 600, y: 250 },
          data: {
            toolName: 'otherTool',
            toolDescription: 'Another tool',
            enabled: true,
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 1000, y: 200 },
          data: {
            agentConfig: {
              name: 'Searchable Agent',
              description: '',
              prompt: '',
              enabled: true,
              useMemory: true,
              version: '1.0.0',
              toolNames: [],
              skillIds: [],
            },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'agent-1', target: 'tool-search', type: 'custom' },
        { id: 'e2', source: 'agent-1', target: 'tool-other', type: 'custom' },
        { id: 'e3', source: 'tool-search', target: 'output-1', type: 'custom' },
        { id: 'e4', source: 'tool-other', target: 'output-1', type: 'custom' },
      ],
    },
    tips: [
      'Press Cmd/Ctrl+F to open search',
      'Type node name or type to filter',
      'Use Enter/Shift+Enter to navigate results',
    ],
  },
  {
    id: 'validation',
    title: 'Real-Time Validation',
    description: 'Get instant feedback on workflow errors and warnings',
    icon: '✅',
    example: {
      nodes: [
        {
          id: 'agent-1',
          type: 'agentConfig',
          position: { x: 200, y: 200 },
          data: {
            name: 'Validation Demo',
            description: 'This workflow has validation',
            prompt: 'Demo prompt',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
          },
        },
        {
          id: 'tool-1',
          type: 'tool',
          position: { x: 600, y: 200 },
          data: {
            toolName: 'validTool',
            toolDescription: 'A valid tool',
            enabled: true,
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 1000, y: 200 },
          data: {
            agentConfig: {
              name: 'Validation Demo',
              description: '',
              prompt: '',
              enabled: true,
              useMemory: true,
              version: '1.0.0',
              toolNames: [],
              skillIds: [],
            },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'agent-1', target: 'tool-1', type: 'custom' },
        { id: 'e2', source: 'tool-1', target: 'output-1', type: 'custom' },
      ],
    },
    tips: [
      'Check the header for validation status',
      'Invalid nodes show red borders',
      'Warnings appear for orphaned nodes',
    ],
  },
  {
    id: 'undo-redo',
    title: 'Undo/Redo',
    description: 'Full history support - undo any action with Cmd/Ctrl+Z',
    icon: '↶',
    example: {
      nodes: [
        {
          id: 'agent-1',
          type: 'agentConfig',
          position: { x: 200, y: 200 },
          data: {
            name: 'Undo Demo',
            description: 'Try making changes and undoing them',
            prompt: 'Undo/redo demo',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
          },
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 600, y: 200 },
          data: {
            agentConfig: {
              name: 'Undo Demo',
              description: '',
              prompt: '',
              enabled: true,
              useMemory: true,
              version: '1.0.0',
              toolNames: [],
              skillIds: [],
            },
          },
        },
      ],
      edges: [],
    },
    tips: [
      'Press Cmd/Ctrl+Z to undo',
      'Press Cmd/Ctrl+Shift+Z to redo',
      'History tracks up to 50 actions',
    ],
  },
]

interface AmazingAgent {
  id: string
  name: string
  description: string
  useCase: string
  icon: string
  nodes: CustomNode[]
  edges: CustomEdge[]
  features: string[]
}

const amazingAgents: AmazingAgent[] = [
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'An intelligent research agent that can search the web, analyze documents, and synthesize findings',
    useCase: 'Perfect for academic research, market analysis, or competitive intelligence',
    icon: '🔬',
    features: ['Web Search', 'RAG Knowledge Base', 'Document Analysis', 'Report Generation'],
    nodes: [
      {
        id: 'agent-config-1',
        type: 'agentConfig',
        position: { x: 200, y: 200 },
        data: {
          name: 'Research Assistant',
          description: 'Intelligent research agent with web search and knowledge base',
          prompt: `You are an expert research assistant. Your role is to:
1. Search for relevant information using web search tools
2. Query the knowledge base for stored documents and facts
3. Synthesize findings into comprehensive reports
4. Cite sources and provide evidence for claims
5. Identify knowledge gaps and suggest further research

Always be thorough, accurate, and provide well-structured research outputs.`,
          enabled: true,
          useMemory: true,
          version: '1.0.0',
        },
      },
      {
        id: 'tool-search',
        type: 'tool',
        position: { x: 600, y: 150 },
        data: {
          toolName: 'searchTools',
          toolDescription: 'Dynamic tool discovery for finding relevant capabilities',
          enabled: true,
        },
      },
      {
        id: 'rag-1',
        type: 'rag',
        position: { x: 600, y: 250 },
        data: {
          ragFolderId: 'research-docs',
          ragFolderName: 'Research Documents',
          enabled: true,
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1000, y: 200 },
        data: {
          agentConfig: {
            name: 'Research Assistant',
            description: 'Intelligent research agent with web search and knowledge base',
            prompt: 'Research assistant prompt',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
            toolNames: ['searchTools'],
            skillIds: [],
            ragFolderId: 'research-docs',
            mcpServers: [],
          },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'agent-config-1', target: 'tool-search', type: 'custom' },
      { id: 'e2', source: 'agent-config-1', target: 'rag-1', type: 'custom' },
      { id: 'e3', source: 'tool-search', target: 'output-1', type: 'custom' },
      { id: 'e4', source: 'rag-1', target: 'output-1', type: 'custom' },
    ],
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'A powerful coding assistant that can write, review, debug, and optimize code',
    useCase: 'Ideal for developers, code reviews, refactoring, and learning programming',
    icon: '💻',
    features: ['Code Generation', 'Code Review', 'Debugging', 'Documentation'],
    nodes: [
      {
        id: 'agent-config-1',
        type: 'agentConfig',
        position: { x: 200, y: 200 },
        data: {
          name: 'Code Assistant',
          description: 'Expert coding assistant with multiple capabilities',
          prompt: `You are an expert software engineer and coding assistant. Your capabilities include:

1. **Code Generation**: Write clean, efficient, and well-documented code
2. **Code Review**: Analyze code for bugs, performance issues, and best practices
3. **Debugging**: Identify and fix errors, suggest improvements
4. **Documentation**: Generate comprehensive documentation and comments
5. **Refactoring**: Improve code structure and maintainability

Always follow best practices, write readable code, and explain your reasoning.`,
          enabled: true,
          useMemory: true,
          version: '1.0.0',
        },
      },
      {
        id: 'tool-1',
        type: 'tool',
        position: { x: 600, y: 150 },
        data: {
          toolName: 'createAgent',
          toolDescription: 'Create new agents programmatically',
          enabled: true,
        },
      },
      {
        id: 'tool-2',
        type: 'tool',
        position: { x: 600, y: 250 },
        data: {
          toolName: 'searchTools',
          toolDescription: 'Discover available tools dynamically',
          enabled: true,
        },
      },
      {
        id: 'skill-1',
        type: 'skill',
        position: { x: 600, y: 350 },
        data: {
          skillId: 'code-analysis',
          skillName: 'Code Analysis',
          skillDescription: 'Advanced code analysis and pattern recognition',
          enabled: true,
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1000, y: 200 },
        data: {
          agentConfig: {
            name: 'Code Assistant',
            description: 'Expert coding assistant with multiple capabilities',
            prompt: 'Code assistant prompt',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
            toolNames: ['createAgent', 'searchTools'],
            skillIds: ['code-analysis'],
            ragFolderId: undefined,
            mcpServers: [],
          },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'agent-config-1', target: 'tool-1', type: 'custom' },
      { id: 'e2', source: 'agent-config-1', target: 'tool-2', type: 'custom' },
      { id: 'e3', source: 'agent-config-1', target: 'skill-1', type: 'custom' },
      { id: 'e4', source: 'tool-1', target: 'output-1', type: 'custom' },
      { id: 'e5', source: 'tool-2', target: 'output-1', type: 'custom' },
      { id: 'e6', source: 'skill-1', target: 'output-1', type: 'custom' },
    ],
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'A creative content agent that generates articles, social media posts, and marketing copy',
    useCase: 'Great for content marketing, social media management, and creative writing',
    icon: '✍️',
    features: ['Article Writing', 'Social Media', 'SEO Optimization', 'Brand Voice'],
    nodes: [
      {
        id: 'agent-config-1',
        type: 'agentConfig',
        position: { x: 200, y: 200 },
        data: {
          name: 'Content Creator',
          description: 'Creative content generation agent',
          prompt: `You are a professional content creator and copywriter. Your expertise includes:

1. **Article Writing**: Long-form articles, blog posts, and guides
2. **Social Media**: Engaging posts for Twitter, LinkedIn, Instagram
3. **Marketing Copy**: Ad copy, landing pages, email campaigns
4. **SEO Optimization**: Content optimized for search engines
5. **Brand Voice**: Maintain consistent tone and style

Create engaging, original content that resonates with your target audience.`,
          enabled: true,
          useMemory: true,
          version: '1.0.0',
        },
      },
      {
        id: 'rag-1',
        type: 'rag',
        position: { x: 600, y: 150 },
        data: {
          ragFolderId: 'brand-guidelines',
          ragFolderName: 'Brand Guidelines',
          enabled: true,
        },
      },
      {
        id: 'skill-1',
        type: 'skill',
        position: { x: 600, y: 250 },
        data: {
          skillId: 'seo-optimization',
          skillName: 'SEO Optimization',
          skillDescription: 'Optimize content for search engines',
          enabled: true,
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1000, y: 200 },
        data: {
          agentConfig: {
            name: 'Content Creator',
            description: 'Creative content generation agent',
            prompt: 'Content creator prompt',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
            toolNames: [],
            skillIds: ['seo-optimization'],
            ragFolderId: 'brand-guidelines',
            mcpServers: [],
          },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'agent-config-1', target: 'rag-1', type: 'custom' },
      { id: 'e2', source: 'agent-config-1', target: 'skill-1', type: 'custom' },
      { id: 'e3', source: 'rag-1', target: 'output-1', type: 'custom' },
      { id: 'e4', source: 'skill-1', target: 'output-1', type: 'custom' },
    ],
  },
  {
    id: 'meta-agent',
    name: 'Meta Agent (Ouroboros)',
    description: 'An agent that creates other agents - the ultimate self-improving system',
    useCase: 'Demonstrates the Ouroboros pattern - agents creating better versions of themselves',
    icon: '🐍',
    features: ['Agent Creation', 'Self-Improvement', 'Tool Discovery', 'Recursive Learning'],
    nodes: [
      {
        id: 'agent-config-1',
        type: 'agentConfig',
        position: { x: 200, y: 200 },
        data: {
          name: 'Meta Agent',
          description: 'An agent that creates and improves other agents',
          prompt: `You are a Meta Agent - an agent that creates and improves other agents. Your capabilities:

1. **Agent Creation**: Use createAgent tool to build new specialized agents
2. **Tool Discovery**: Dynamically find and use tools via searchTools
3. **Self-Improvement**: Analyze performance and create better versions
4. **Recursive Learning**: Learn from agent interactions and improve

This is the Ouroboros pattern - agents creating better agents, creating better agents...`,
          enabled: true,
          useMemory: true,
          version: '1.0.0',
        },
      },
      {
        id: 'tool-create',
        type: 'tool',
        position: { x: 600, y: 150 },
        data: {
          toolName: 'createAgent',
          toolDescription: 'Create new agents programmatically',
          enabled: true,
        },
      },
      {
        id: 'tool-search',
        type: 'tool',
        position: { x: 600, y: 250 },
        data: {
          toolName: 'searchTools',
          toolDescription: 'Discover tools dynamically',
          enabled: true,
        },
      },
      {
        id: 'tool-improve',
        type: 'tool',
        position: { x: 600, y: 350 },
        data: {
          toolName: 'selfImprove',
          toolDescription: 'Trigger self-analysis and improvement',
          enabled: true,
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1000, y: 200 },
        data: {
          agentConfig: {
            name: 'Meta Agent',
            description: 'An agent that creates and improves other agents',
            prompt: 'Meta agent prompt',
            enabled: true,
            useMemory: true,
            useDeferredLoading: true,
            version: '1.0.0',
            toolNames: ['createAgent', 'searchTools', 'selfImprove'],
            skillIds: [],
            ragFolderId: undefined,
            mcpServers: [],
          },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'agent-config-1', target: 'tool-create', type: 'custom' },
      { id: 'e2', source: 'agent-config-1', target: 'tool-search', type: 'custom' },
      { id: 'e3', source: 'agent-config-1', target: 'tool-improve', type: 'custom' },
      { id: 'e4', source: 'tool-create', target: 'output-1', type: 'custom' },
      { id: 'e5', source: 'tool-search', target: 'output-1', type: 'custom' },
      { id: 'e6', source: 'tool-improve', target: 'output-1', type: 'custom' },
    ],
  },
]

export default function BuilderDemo({ onLoadExample, onClose }: BuilderDemoProps) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'features' | 'agents' | 'about'>('about')

  const handleLoadExample = (nodes: CustomNode[], edges: CustomEdge[]) => {
    onLoadExample(nodes, edges)
    onClose()
  }
  
  const handleLoadFeatureExample = (feature: DemoFeature) => {
    handleLoadExample(feature.example.nodes, feature.example.edges)
  }
  
  const handleLoadAgentExample = (agent: AmazingAgent) => {
    handleLoadExample(agent.nodes, agent.edges)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[90vh] bg-black/95 border-2 border-green-400/50 rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-400/30">
          <div>
            <h2 className="text-2xl font-bold font-mono text-green-400 mb-1">
              Visual Agent Builder
            </h2>
            <p className="text-green-400/60 text-sm font-mono">
              Build powerful AI agents visually - no code required
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-green-400/50 text-green-400 hover:bg-green-400/10 transition-all font-mono text-sm"
          >
            ✕ Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-green-400/20">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-3 font-mono text-sm transition-all ${
              activeTab === 'about'
                ? 'text-green-400 border-b-2 border-green-400 bg-green-400/10'
                : 'text-green-400/60 hover:text-green-400/80'
            }`}
          >
            📖 What is this?
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-6 py-3 font-mono text-sm transition-all ${
              activeTab === 'agents'
                ? 'text-green-400 border-b-2 border-green-400 bg-green-400/10'
                : 'text-green-400/60 hover:text-green-400/80'
            }`}
          >
            🚀 Amazing Agents
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-6 py-3 font-mono text-sm transition-all ${
              activeTab === 'features'
                ? 'text-green-400 border-b-2 border-green-400 bg-green-400/10'
                : 'text-green-400/60 hover:text-green-400/80'
            }`}
          >
            ⚡ Features
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border-2 border-green-400/30 rounded-lg p-6 bg-black/50">
                <h3 className="text-2xl font-bold font-mono text-green-400 mb-4">
                  What is the Visual Agent Builder?
                </h3>
                <div className="space-y-4 text-green-400/80 font-mono text-sm leading-relaxed">
                  <p>
                    The <span className="text-green-400 font-bold">Visual Agent Builder</span> is a powerful, no-code interface for creating AI agents. 
                    Instead of writing complex configuration files, you visually connect components to build sophisticated AI systems.
                  </p>
                  
                  <div>
                    <h4 className="text-green-400 font-bold mb-2">How It Works:</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li><strong>Start with Agent Config</strong> - Define your agent's name, description, and prompt</li>
                      <li><strong>Add Components</strong> - Connect Tools, Skills, RAG folders, or MCP servers</li>
                      <li><strong>Connect Everything</strong> - Drag connections between nodes (they snap automatically!)</li>
                      <li><strong>Validate & Save</strong> - Get real-time feedback and save your agent</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="text-green-400 font-bold mb-2">What You Can Build:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><strong>Research Agents</strong> - Combine web search with knowledge bases</li>
                      <li><strong>Code Assistants</strong> - Tools for development, debugging, and code review</li>
                      <li><strong>Content Creators</strong> - Generate articles, social media, and marketing copy</li>
                      <li><strong>Meta Agents</strong> - Agents that create and improve other agents (Ouroboros pattern)</li>
                      <li><strong>Custom Workflows</strong> - Any combination of tools, skills, and knowledge</li>
                    </ul>
                  </div>

                  <div className="border-t border-green-400/20 pt-4">
                    <h4 className="text-green-400 font-bold mb-2">Key Benefits:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span><strong>No Code Required</strong> - Visual interface for everyone</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span><strong>Real-Time Validation</strong> - Catch errors before saving</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span><strong>Magnetic Connections</strong> - Intuitive drag-and-drop</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        <span><strong>Powerful Features</strong> - Undo/redo, search, copy/paste</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-cyan-400/30 rounded-lg p-6 bg-black/50">
                <h3 className="text-xl font-bold font-mono text-cyan-400 mb-3">
                  🎯 Quick Start
                </h3>
                <div className="space-y-3 text-cyan-400/80 font-mono text-sm">
                  <p>1. Click <span className="text-cyan-400 font-bold">"Amazing Agents"</span> tab to see example agents</p>
                  <p>2. Click <span className="text-cyan-400 font-bold">"Load Example"</span> to try one in the builder</p>
                  <p>3. Explore the <span className="text-cyan-400 font-bold">"Features"</span> tab to learn advanced capabilities</p>
                  <p>4. Build your own agent by adding nodes from the left palette</p>
                </div>
              </div>
            </div>
          )}

          {/* Amazing Agents Tab */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold font-mono text-green-400 mb-2">
                  Amazing Agent Examples
                </h3>
                <p className="text-green-400/60 font-mono text-sm">
                  Click "Load Example" to try these powerful agent configurations
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {amazingAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="border-2 border-green-400/30 rounded-lg p-5 bg-black/50 hover:border-green-400/50 transition-all"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <span className="text-4xl">{agent.icon}</span>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold font-mono text-green-400 mb-1">
                          {agent.name}
                        </h4>
                        <p className="text-green-400/70 font-mono text-sm mb-2">
                          {agent.description}
                        </p>
                        <div className="text-green-400/50 font-mono text-xs italic">
                          {agent.useCase}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-green-400/60 text-[10px] font-mono uppercase mb-2">
                        Features:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {agent.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 border border-green-400/30 bg-green-400/10 text-green-400 text-xs font-mono rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleLoadAgentExample(agent)}
                      className="w-full px-4 py-2 border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-mono text-sm font-bold"
                    >
                      Load Example →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {demoFeatures.map((feature) => (
              <div
                key={feature.id}
                className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                  selectedFeature === feature.id
                    ? 'border-green-400 bg-green-400/10'
                    : 'border-green-400/30 hover:border-green-400/50 hover:bg-green-400/5'
                }`}
                onClick={() => setSelectedFeature(selectedFeature === feature.id ? null : feature.id)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{feature.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-green-400 font-mono font-bold text-lg mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-green-400/70 text-xs font-mono">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {selectedFeature === feature.id && (
                  <div className="mt-4 space-y-3 animate-fade-in">
                    <div className="border-t border-green-400/20 pt-3">
                      <div className="text-green-400/60 text-[10px] font-mono uppercase mb-2">
                        Tips:
                      </div>
                      <ul className="space-y-1">
                        {feature.tips.map((tip, idx) => (
                          <li
                            key={idx}
                            className="text-green-400/80 text-xs font-mono flex items-start gap-2"
                          >
                            <span className="text-green-400 mt-1">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLoadFeatureExample(feature)
                      }}
                      className="w-full px-3 py-2 border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-mono text-xs"
                    >
                      Load Example →
                    </button>
                  </div>
                )}
              </div>
            ))}
              </div>
              
              {/* Keyboard Shortcuts Reference */}
              <div className="mt-8 border-t border-green-400/20 pt-6">
                <h3 className="text-green-400 font-mono font-bold text-lg mb-4">
                  Keyboard Shortcuts
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'Cmd/Ctrl+Z', action: 'Undo' },
                    { key: 'Cmd/Ctrl+Shift+Z', action: 'Redo' },
                    { key: 'Cmd/Ctrl+C', action: 'Copy' },
                    { key: 'Cmd/Ctrl+V', action: 'Paste' },
                    { key: 'Cmd/Ctrl+D', action: 'Duplicate' },
                    { key: 'Cmd/Ctrl+A', action: 'Select All' },
                    { key: 'Cmd/Ctrl+F', action: 'Search' },
                    { key: 'Cmd/Ctrl+S', action: 'Save' },
                    { key: 'Delete', action: 'Delete Selected' },
                    { key: 'Esc', action: 'Deselect/Close' },
                  ].map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="border border-green-400/30 rounded p-2 bg-black/50"
                    >
                      <div className="text-green-400/60 text-[10px] font-mono uppercase mb-1">
                        {shortcut.action}
                      </div>
                      <div className="text-green-400 font-mono text-xs">{shortcut.key}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

