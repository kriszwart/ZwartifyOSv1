import { Node, Edge } from '@xyflow/react'
import type {
  CustomNodeData,
  AgentConfigNodeData,
  ToolNodeData,
  SkillNodeData,
  RAGNodeData,
  MCPNodeData,
  OutputNodeData,
} from '../types'

export interface AgentData {
  id: string
  name: string
  description?: string
  prompt: string
  version: string
  enabled: boolean
  useMemory?: boolean
  skillIds?: string[]
  ragFolderId?: string
  metadata?: {
    toolNames?: string[]
    mcpServers?: string[]
    [key: string]: unknown
  }
}

export interface ConversionContext {
  availableTools: Array<{ name: string; description: string }>
  availableSkills: Array<{ id: string; name: string; description: string }>
  availableRAGFolders: Array<{ id: string; name: string }>
}

export function agentToVisualNodes(
  agent: AgentData,
  context: ConversionContext
): { nodes: Node<CustomNodeData>[]; edges: Edge[] } {
  const nodes: Node<CustomNodeData>[] = []
  const edges: Edge[] = []

  // Layout constants - improved spacing like ChatGPT's agent builder
  const startX = 150
  const startY = 200
  const horizontalSpacing = 550 // Increased spacing between columns for better separation
  const verticalSpacing = 140 // Spacing within groups
  const groupSpacing = 80 // Extra spacing between different node type groups
  const nodeHeight = 100 // Approximate node height for centering calculations

  // Create AgentConfig node (leftmost)
  const agentConfigNode: Node<AgentConfigNodeData> = {
    id: 'agent-config-1',
    type: 'agentConfig',
    position: { x: startX, y: startY },
    data: {
      name: agent.name,
      description: agent.description || '',
      prompt: agent.prompt,
      enabled: agent.enabled,
      useMemory: agent.useMemory !== false,
      version: agent.version || '1.0.0',
    } as AgentConfigNodeData,
  }
  nodes.push(agentConfigNode)

  // Middle column for components (Tools, Skills, RAG, MCP)
  const componentX = startX + horizontalSpacing
  let componentY = startY
  const componentNodes: Node<CustomNodeData>[] = []

  // Create Tool nodes
  const toolNames = agent.metadata?.toolNames || []
  toolNames.forEach((toolName, idx) => {
    const tool = context.availableTools.find((t) => t.name === toolName)
    if (tool) {
      const toolNode: Node<ToolNodeData> = {
        id: `tool-${idx + 1}`,
        type: 'tool',
        position: { x: componentX, y: componentY },
        data: {
          toolName: tool.name,
          toolDescription: tool.description,
          enabled: true,
        } as ToolNodeData,
      }
      componentNodes.push(toolNode)
      edges.push({
        id: `edge-agentconfig-tool-${idx + 1}`,
        source: 'agent-config-1',
        target: `tool-${idx + 1}`,
        type: 'custom',
      })
      componentY += verticalSpacing
    }
  })

  // Add spacing between groups if we have tools and more components
  if (toolNames.length > 0 && (agent.skillIds?.length || agent.ragFolderId || (agent.metadata?.mcpServers?.length || 0) > 0)) {
    componentY += groupSpacing
  }

  // Create Skill nodes
  const skillIds = agent.skillIds || []
  skillIds.forEach((skillId, idx) => {
    const skill = context.availableSkills.find((s) => s.id === skillId)
    if (skill) {
      const skillNode: Node<SkillNodeData> = {
        id: `skill-${idx + 1}`,
        type: 'skill',
        position: { x: componentX, y: componentY },
        data: {
          skillId: skill.id,
          skillName: skill.name,
          skillDescription: skill.description,
          enabled: true,
        } as SkillNodeData,
      }
      componentNodes.push(skillNode)
      edges.push({
        id: `edge-agentconfig-skill-${idx + 1}`,
        source: 'agent-config-1',
        target: `skill-${idx + 1}`,
        type: 'custom',
      })
      componentY += verticalSpacing
    }
  })

  // Add spacing between groups if we have skills and more components
  if (skillIds.length > 0 && (agent.ragFolderId || (agent.metadata?.mcpServers?.length || 0) > 0)) {
    componentY += groupSpacing
  }

  // Create RAG node
  if (agent.ragFolderId) {
    const ragFolder = context.availableRAGFolders.find((f) => f.id === agent.ragFolderId)
    if (ragFolder) {
      const ragNode: Node<RAGNodeData> = {
        id: 'rag-1',
        type: 'rag',
        position: { x: componentX, y: componentY },
        data: {
          ragFolderId: ragFolder.id,
          ragFolderName: ragFolder.name,
          enabled: true,
        } as RAGNodeData,
      }
      componentNodes.push(ragNode)
      edges.push({
        id: 'edge-agentconfig-rag-1',
        source: 'agent-config-1',
        target: 'rag-1',
        type: 'custom',
      })
      componentY += verticalSpacing
      
      // Add spacing if we have MCP servers after RAG
      if ((agent.metadata?.mcpServers?.length || 0) > 0) {
        componentY += groupSpacing
      }
    }
  }

  // Create MCP nodes
  const mcpServers = agent.metadata?.mcpServers || []
  mcpServers.forEach((serverUrl, idx) => {
    const mcpNode: Node<MCPNodeData> = {
      id: `mcp-${idx + 1}`,
      type: 'mcp',
      position: { x: componentX, y: componentY },
      data: {
        serverUrl: serverUrl,
        serverName: `MCP Server ${idx + 1}`,
        enabled: true,
      } as MCPNodeData,
    }
    componentNodes.push(mcpNode)
    edges.push({
      id: `edge-agentconfig-mcp-${idx + 1}`,
      source: 'agent-config-1',
      target: `mcp-${idx + 1}`,
      type: 'custom',
    })
    componentY += verticalSpacing
  })

  // Add all component nodes to the main nodes array
  nodes.push(...componentNodes)

  // Calculate center Y position for output node (centered relative to all components)
  const totalComponentHeight = componentNodes.length > 0 
    ? (componentNodes.length - 1) * verticalSpacing + nodeHeight
    : nodeHeight
  const outputY = componentNodes.length > 0
    ? startY + (totalComponentHeight - nodeHeight) / 2
    : startY

  // Create Output node (rightmost, centered vertically)
  const outputX = componentX + horizontalSpacing

  const toolNamesList = toolNames
  const skillIdsList = skillIds
  const ragFolderIdValue = agent.ragFolderId
  const mcpServersList = mcpServers

  const outputNode: Node<OutputNodeData> = {
    id: 'output-1',
    type: 'output',
    position: { x: outputX, y: outputY },
    data: {
      agentConfig: {
        name: agent.name,
        description: agent.description,
        prompt: agent.prompt,
        enabled: agent.enabled,
        useMemory: agent.useMemory !== false,
        version: agent.version || '1.0.0',
        toolNames: toolNamesList,
        skillIds: skillIdsList,
        ragFolderId: ragFolderIdValue,
        mcpServers: mcpServersList,
      },
    } as OutputNodeData,
  }
  nodes.push(outputNode)

  // Connect all component nodes to output
  nodes.forEach((node) => {
    if (
      node.type !== 'agentConfig' &&
      node.type !== 'output' &&
      (node.id.startsWith('tool-') ||
      node.id.startsWith('skill-') ||
      node.id.startsWith('rag-') ||
      node.id.startsWith('mcp-'))
    ) {
      edges.push({
        id: `edge-${node.id}-output`,
        source: node.id,
        target: 'output-1',
        type: 'custom',
      })
    }
  })

  return { nodes, edges }
}

