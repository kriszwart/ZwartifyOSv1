"use client"

import { useRouter } from "next/navigation"
import { useDemo } from "../context/DemoContext"
import { getApiHeaders } from "@/lib/apiKey"
import type { DemoAction } from "../data/demoSteps"

export function useDemoOrchestrator() {
  const router = useRouter()
  const demo = useDemo()

  const executeAction = async (action: DemoAction): Promise<any> => {
    try {
      switch (action.type) {
        case "navigate":
          demo.addNavigation(action.path)
          router.push(action.path)
          return { success: true, path: action.path }

        case "createAgent":
          // Get G-SAC agent ID first
          const agentsResponse = await fetch("/api/agents")
          if (!agentsResponse.ok) {
            throw new Error("Failed to fetch agents")
          }
          const agentsData = await agentsResponse.json()
          const gsacAgent = agentsData.agents?.find((a: any) => 
            a.name.toLowerCase().includes("g-sac") || 
            a.name.toLowerCase().includes("growth strategy")
          )

          if (!gsacAgent) {
            throw new Error("G-SAC agent not found. Please ensure G-SAC is created first.")
          }

          // Create agent via G-SAC
          const createResponse = await fetch("/api/agent", {
            method: "POST",
            headers: getApiHeaders(),
            body: JSON.stringify({
              input: `Create an agent with the following requirements:\n\n${action.prompt}`,
              agentId: gsacAgent.id,
            }),
          })

          if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({}))
            throw new Error(errorData.error || "Failed to create agent")
          }

          const createData = await createResponse.json()
          
          // Poll for created agent
          let attempts = 0
          const maxAttempts = 10
          let createdAgent = null

          while (attempts < maxAttempts && !createdAgent) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const agentsRes = await fetch("/api/agents")
            if (agentsRes.ok) {
              const agentsData = await agentsRes.json()
              // Try to find by name or by checking recently created
              createdAgent = agentsData.agents?.find((a: any) => 
                action.name ? a.name.toLowerCase().includes(action.name.toLowerCase()) : false
              ) || agentsData.agents?.[agentsData.agents.length - 1]
            }
            attempts++
          }

          if (createdAgent) {
            demo.addCreatedAgent({
              id: createdAgent.id,
              name: createdAgent.name,
              description: createdAgent.description,
            })
            return { success: true, agent: createdAgent }
          } else {
            throw new Error("Agent created but could not be retrieved")
          }

        case "runQuery":
          // Look up agent by name
          let agentId: string | undefined = undefined
          
          if (action.agentName) {
            // Look up agent by name
            const agentsResponse = await fetch("/api/agents")
            if (agentsResponse.ok) {
              const agentsData = await agentsResponse.json()
              const foundAgent = agentsData.agents?.find((a: any) => 
                a.name.toLowerCase() === action.agentName?.toLowerCase() ||
                a.name.toLowerCase().replace(/-/g, ' ') === action.agentName?.toLowerCase().replace(/-/g, ' ')
              )
              if (foundAgent) {
                agentId = foundAgent.id
              } else {
                throw new Error(`Agent "${action.agentName}" not found. Please ensure the agent exists.`)
              }
            } else {
              throw new Error("Failed to fetch agents")
            }
          }
          
          // Fallback to latest created agent if no agentId found
          if (!agentId) {
            agentId = demo.getLatestAgent()?.id
          }
          
          if (!agentId) {
            throw new Error("No agent available. Please create an agent first or specify an agent name.")
          }

          const queryResponse = await fetch("/api/agent", {
            method: "POST",
            headers: getApiHeaders(),
            body: JSON.stringify({
              input: action.input,
              agentId: agentId,
            }),
          })

          if (!queryResponse.ok) {
            const errorData = await queryResponse.json().catch(() => ({}))
            throw new Error(errorData.error || "Failed to execute query")
          }

          const queryData = await queryResponse.json()
          
          demo.addExecutionResult({
            agentId,
            input: action.input,
            output: queryData.text || queryData.error || "No response",
            tokenUsage: queryData.tokenUsage,
          })

          return { 
            success: true, 
            result: queryData.text || queryData.error,
            tokenUsage: queryData.tokenUsage,
          }

        case "loadVisualBuilder":
          const visualAgentId = action.agentId || demo.getLatestAgent()?.id
          if (!visualAgentId) {
            throw new Error("No agent available. Please create an agent first.")
          }
          
          demo.addNavigation(`/create-agent-visual?agentId=${visualAgentId}`)
          router.push(`/create-agent-visual?agentId=${visualAgentId}`)
          return { success: true, agentId: visualAgentId }

        case "wait":
          await new Promise(resolve => setTimeout(resolve, action.duration * 1000))
          return { success: true }

        case "none":
          return { success: true }

        default:
          return { success: true }
      }
    } catch (error) {
      console.error("Demo action error:", error)
      throw error
    }
  }

  return {
    executeAction,
    demo,
  }
}

