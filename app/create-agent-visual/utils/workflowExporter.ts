import type { CustomNode } from '../types'
import type { AgentConfig } from '../hooks/useAgentConfig'

export function exportWorkflowAsCode(agentConfig: AgentConfig | null): string {
  if (!agentConfig) {
    return '// No agent configuration found'
  }

  const code = `// Agent Workflow Export
// Generated: ${new Date().toISOString()}

import { createAgent } from '@/backend/agents/agentRegistry'

export const agentConfig = {
  name: ${JSON.stringify(agentConfig.name)},
  description: ${JSON.stringify(agentConfig.description || '')},
  prompt: ${JSON.stringify(agentConfig.prompt)},
  enabled: ${agentConfig.enabled},
  useMemory: ${agentConfig.useMemory},
  version: ${JSON.stringify(agentConfig.version)},
  ragFolderId: ${agentConfig.ragFolderId ? JSON.stringify(agentConfig.ragFolderId) : 'undefined'},
  skillIds: ${JSON.stringify(agentConfig.skillIds || [])},
  isPublic: ${agentConfig.isPublic || false},
  isExportable: ${agentConfig.isExportable !== false},
  exportFormats: ${JSON.stringify(agentConfig.exportFormats || [])},
  category: ${agentConfig.category ? JSON.stringify(agentConfig.category) : 'undefined'},
  tags: ${JSON.stringify(agentConfig.tags || [])},
  metadata: {
    toolNames: ${JSON.stringify(agentConfig.toolNames || [])},
    mcpServers: ${JSON.stringify(agentConfig.mcpServers || [])},
    useDeferredLoading: ${agentConfig.useDeferredLoading || false},
  },
}

// Create the agent
const agent = createAgent(agentConfig)

// Use the agent
export async function runAgent(input: string) {
  const { mainAgent } = await import('@/backend/agents/mainAgent')
  return await mainAgent(input, {
    agentId: agent.id,
  })
}
`

  return code
}

export function exportWorkflowAsJSON(agentConfig: AgentConfig | null): string {
  if (!agentConfig) {
    return JSON.stringify({ error: 'No agent configuration found' }, null, 2)
  }

  return JSON.stringify({
    name: agentConfig.name,
    description: agentConfig.description,
    prompt: agentConfig.prompt,
    enabled: agentConfig.enabled,
    useMemory: agentConfig.useMemory,
    version: agentConfig.version,
    ragFolderId: agentConfig.ragFolderId,
    skillIds: agentConfig.skillIds,
    isPublic: agentConfig.isPublic || false,
    isExportable: agentConfig.isExportable !== false,
    exportFormats: agentConfig.exportFormats || [],
    category: agentConfig.category,
    tags: agentConfig.tags || [],
    metadata: {
      toolNames: agentConfig.toolNames,
      mcpServers: agentConfig.mcpServers,
      useDeferredLoading: agentConfig.useDeferredLoading || false,
    },
  }, null, 2)
}

