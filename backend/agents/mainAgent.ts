import { agentClient } from "./agentClient"
import { getTools } from "../tools"
import { getAgent } from "./agentRegistry"

export async function mainAgent(input: string, options?: { agentId?: string; metadata?: Record<string, unknown>; image?: string }) {
  try {
    // Load tools
    const tools = await getTools()

    // Load agent configuration if agentId is provided
    let skillIds: string[] | undefined
    if (options?.agentId) {
      const agent = getAgent(options.agentId)
      if (agent?.skillIds && agent.skillIds.length > 0) {
        skillIds = agent.skillIds
      }
    }

    // Run agent with input and tools
    const result = await agentClient.run(input, {
      tools,
      agentId: options?.agentId || 'main',
      agentName: 'Main Agent',
      metadata: options?.metadata,
      image: options?.image,
      skillIds,
      autoDetectSkills: true, // Auto-detect skills if none assigned
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
