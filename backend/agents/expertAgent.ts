import { agentClient } from "./agentClient"
import { getTools } from "../tools"

/**
 * Expert Agent - A persona-based agent that provides expert consultation
 * This demonstrates how to create agents with different personas and behavior patterns
 */
export async function expertAgent(input: string, domain?: string) {
  try {
    // Load tools
    const tools = await getTools()

    // Enhance input with expert persona context
    const expertPrompt = domain
      ? `You are an expert ${domain} consultant. Provide detailed, professional guidance. User query: ${input}`
      : `You are a knowledgeable expert consultant. Provide thorough, professional advice with reasoning. User query: ${input}`

    // Run agent with expert persona
    const result = await agentClient.run(expertPrompt, { tools })

    // Format response with expert tone
    const expertResponse = result.output_text || "No response generated"

    return {
      text: expertResponse,
      persona: domain || "general expert",
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Expert agent error:", error)
    return {
      text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      persona: domain || "general expert",
      error: true,
    }
  }
}

