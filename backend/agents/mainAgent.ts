import { agentClient } from "./agentClient"
import { getTools } from "../tools"
import { getAgent } from "./agentRegistry"
import { filterTools } from "../tools/toolFilter"

export async function mainAgent(input: string, options?: { agentId?: string; metadata?: Record<string, unknown>; image?: string; userApiKey?: string }) {
  try {
    // Load all available tools
    const allTools = await getTools()

    // Load agent configuration if agentId is provided
    let skillIds: string[] | undefined
    let agentPrompt: string | undefined
    let agentName: string = 'Main Agent'
    let ragFolderId: string | undefined
    let useMemory: boolean = true
    let enabledTools: string[] | undefined
    let mcpServers: string[] | undefined

    if (options?.agentId) {
      const agent = getAgent(options.agentId)
      if (agent) {
        if (agent.skillIds && agent.skillIds.length > 0) {
          skillIds = agent.skillIds
        }
        agentPrompt = agent.prompt
        agentName = agent.name
        ragFolderId = agent.ragFolderId
        useMemory = agent.useMemory !== false

        // Load tools configuration from metadata
        if (agent.metadata) {
          enabledTools = agent.metadata.tools as string[] | undefined
          mcpServers = agent.metadata.mcpServers as string[] | undefined
        }
      }
    }

    // Filter tools based on agent configuration
    const tools = await filterTools(allTools, {
      enabledTools,
      mcpServers,
      autoDetectMCP: true,
      userInput: input,
    })

    // Run agent with input and tools
    const result = await agentClient.run(input, {
      tools,
      agentId: options?.agentId || 'main',
      agentName: agentName,
      agentPrompt: agentPrompt, // Pass the agent's prompt as system prompt
      metadata: options?.metadata,
      image: options?.image,
      skillIds,
      ragFolderId,
      useMemory,
      autoDetectSkills: true, // Auto-detect skills if none assigned
      userApiKey: options?.userApiKey, // Pass user-provided API key if available
    })

    // Return response in expected format
    return {
      text: result.output_text || "No response generated",
      executionId: result.executionId,
    }
  } catch (error) {
    console.error("Agent error:", error)
    return {
      text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
