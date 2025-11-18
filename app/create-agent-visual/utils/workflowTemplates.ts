import type { Node, Edge } from '@xyflow/react'
import type { CustomNodeData, AgentConfigNodeData, ToolNodeData, SkillNodeData, RAGNodeData, OutputNodeData } from '../types'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  nodes: Node<CustomNodeData>[]
  edges: Edge[]
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'basic-agent',
    name: 'Basic Agent',
    description: 'A simple agent with basic configuration',
    category: 'Getting Started',
    nodes: [
      {
        id: 'agent-config-1',
        type: 'agentConfig',
        position: { x: 200, y: 200 },
        data: {
          name: 'My Agent',
          description: 'A basic agent configuration',
          prompt: 'You are a helpful AI assistant.',
          enabled: true,
          useMemory: true,
          version: '1.0.0',
        } as AgentConfigNodeData,
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 750, y: 200 },
        data: {
          agentConfig: {
            name: 'My Agent',
            description: 'A basic agent configuration',
            prompt: 'You are a helpful AI assistant.',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
            toolNames: [],
            skillIds: [],
            ragFolderId: undefined,
            mcpServers: [],
          },
        } as OutputNodeData,
      },
    ],
    edges: [],
  },
  {
    id: 'agent-with-tools',
    name: 'Agent with Tools',
    description: 'An agent configured with tools for extended capabilities',
    category: 'Common Patterns',
    nodes: [
      {
        id: 'agent-config-1',
        type: 'agentConfig',
        position: { x: 200, y: 200 },
        data: {
          name: 'Tool Agent',
          description: 'Agent with tool capabilities',
          prompt: 'You are a helpful assistant with access to tools. Use them when appropriate.',
          enabled: true,
          useMemory: true,
          version: '1.0.0',
        } as AgentConfigNodeData,
      },
      {
        id: 'tool-1',
        type: 'tool',
        position: { x: 750, y: 150 },
        data: {
          toolName: 'web_search',
          toolDescription: 'Search the web for information',
          enabled: true,
        } as ToolNodeData,
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1300, y: 200 },
        data: {
          agentConfig: {
            name: 'Tool Agent',
            description: 'Agent with tool capabilities',
            prompt: 'You are a helpful assistant with access to tools. Use them when appropriate.',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
            toolNames: ['web_search'],
            skillIds: [],
            ragFolderId: undefined,
            mcpServers: [],
          },
        } as OutputNodeData,
      },
    ],
    edges: [
      { id: 'edge-agentconfig-tool-1', source: 'agent-config-1', target: 'tool-1', type: 'custom' },
      { id: 'edge-tool-output', source: 'tool-1', target: 'output-1', type: 'custom' },
    ],
  },
  {
    id: 'agent-with-rag',
    name: 'Agent with RAG',
    description: 'An agent with RAG for knowledge retrieval',
    category: 'Common Patterns',
    nodes: [
      {
        id: 'agent-config-1',
        type: 'agentConfig',
        position: { x: 200, y: 200 },
        data: {
          name: 'RAG Agent',
          description: 'Agent with RAG knowledge base',
          prompt: 'You are a helpful assistant with access to a knowledge base. Use it to provide accurate answers.',
          enabled: true,
          useMemory: true,
          version: '1.0.0',
        } as AgentConfigNodeData,
      },
      {
        id: 'rag-1',
        type: 'rag',
        position: { x: 750, y: 200 },
        data: {
          ragFolderId: '',
          ragFolderName: 'Select RAG folder',
          enabled: true,
        } as RAGNodeData,
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1300, y: 200 },
        data: {
          agentConfig: {
            name: 'RAG Agent',
            description: 'Agent with RAG knowledge base',
            prompt: 'You are a helpful assistant with access to a knowledge base. Use it to provide accurate answers.',
            enabled: true,
            useMemory: true,
            version: '1.0.0',
            toolNames: [],
            skillIds: [],
            ragFolderId: '',
            mcpServers: [],
          },
        } as OutputNodeData,
      },
    ],
    edges: [
      { id: 'edge-agentconfig-rag-1', source: 'agent-config-1', target: 'rag-1', type: 'custom' },
      { id: 'edge-rag-output', source: 'rag-1', target: 'output-1', type: 'custom' },
    ],
  },
]

