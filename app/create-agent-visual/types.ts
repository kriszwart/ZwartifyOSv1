import { Node, Edge } from '@xyflow/react'

export type NodeType = 'agentConfig' | 'tool' | 'skill' | 'rag' | 'mcp' | 'output'

export interface AgentConfigNodeData extends Record<string, unknown> {
  name: string
  description: string
  prompt: string
  enabled: boolean
  useMemory: boolean
  version: string
}

export interface ToolNodeData extends Record<string, unknown> {
  toolName: string
  toolDescription: string
  enabled: boolean
}

export interface SkillNodeData extends Record<string, unknown> {
  skillId: string
  skillName: string
  skillDescription: string
  enabled: boolean
}

export interface RAGNodeData extends Record<string, unknown> {
  ragFolderId: string
  ragFolderName: string
  enabled: boolean
}

export interface MCPNodeData extends Record<string, unknown> {
  serverUrl: string
  serverName: string
  enabled: boolean
}

export interface OutputNodeData extends Record<string, unknown> {
  agentConfig: {
    name: string
    description?: string
    prompt: string
    enabled: boolean
    useMemory: boolean
    version: string
    toolNames: string[]
    skillIds: string[]
    ragFolderId?: string
    mcpServers: string[]
  }
}

export type CustomNodeData = 
  | AgentConfigNodeData 
  | ToolNodeData 
  | SkillNodeData 
  | RAGNodeData 
  | MCPNodeData 
  | OutputNodeData

export type CustomNode = Node<CustomNodeData>
export type CustomEdge = Edge

export interface AgentBuilderState {
  nodes: CustomNode[]
  edges: CustomEdge[]
}

