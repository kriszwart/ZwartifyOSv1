import { useMemo } from 'react'
import { Node } from '@xyflow/react'
import type { CustomNodeData, AgentConfigNodeData, ToolNodeData, SkillNodeData, RAGNodeData, MCPNodeData } from '../types'

export interface AgentConfig {
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
  // Export and marketplace settings
  isPublic?: boolean
  isExportable?: boolean
  exportFormats?: string[]
  category?: string
  tags?: string[]
  useDeferredLoading?: boolean
}

export function useAgentConfig(nodes: Node<CustomNodeData>[]): AgentConfig | null {
  return useMemo(() => {
    const agentConfigNode = nodes.find(node => node.type === 'agentConfig') as Node<AgentConfigNodeData> | undefined
    if (!agentConfigNode || !agentConfigNode.data) {
      return null
    }

    const configData = agentConfigNode.data
    const toolNodes = nodes.filter(node => node.type === 'tool') as Node<ToolNodeData>[]
    const skillNodes = nodes.filter(node => node.type === 'skill') as Node<SkillNodeData>[]
    const ragNodes = nodes.filter(node => node.type === 'rag') as Node<RAGNodeData>[]
    const mcpNodes = nodes.filter(node => node.type === 'mcp') as Node<MCPNodeData>[]

    return {
      name: configData.name || '',
      description: configData.description || '',
      prompt: configData.prompt || '',
      enabled: configData.enabled !== false,
      useMemory: configData.useMemory !== false,
      version: configData.version || '1.0.0',
      toolNames: toolNodes
        .filter(node => node.data?.enabled !== false)
        .map(node => node.data?.toolName)
        .filter((name): name is string => !!name),
      skillIds: skillNodes
        .filter(node => node.data?.enabled !== false)
        .map(node => node.data?.skillId)
        .filter((id): id is string => !!id),
      ragFolderId: ragNodes
        .find(node => node.data?.enabled !== false)
        ?.data?.ragFolderId,
      mcpServers: mcpNodes
        .filter(node => node.data?.enabled !== false)
        .map(node => node.data?.serverUrl)
        .filter((url): url is string => !!url),
      // Export settings
      isPublic: configData.isPublic || false,
      isExportable: configData.isExportable !== false,
      exportFormats: configData.exportFormats,
      category: configData.category,
      tags: configData.tags,
      useDeferredLoading: (configData as any).useDeferredLoading || false,
    }
  }, [nodes])
}

