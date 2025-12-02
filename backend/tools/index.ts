// Tool type definition
// Updated: Force cache invalidation
type Tool = {
  name: string
  description: string
  execute: (...args: unknown[]) => Promise<unknown>
}

// Dynamically import all tools
// Add new tools here as they are created
// 
// Tool organization follows Anthropic's Advanced Tool Use patterns:
// - toolSearchTool: First tool loaded - enables dynamic discovery (saves 85% tokens)
// - Other tools: Discoverable on-demand via searchTools
// See: https://www.anthropic.com/engineering/advanced-tool-use
const toolModules = [
  import("./toolSearchTool"),    // Always loaded first - enables tool discovery
  import("./helloTool"),
  import("./markdownFormatter"),
  import("./screenshotDescription"),
  import("./agentCreationTool"), // Has input_examples for better accuracy
  import("./mcpClientTool"),
  import("./selfImproveTool"),   // Self-improvement for autonomous agents
  // Add more tool imports here as needed
]

/**
 * Validate that a tool has the required structure
 */
function isValidTool(tool: unknown): tool is Tool {
  return (
    tool !== null &&
    typeof tool === "object" &&
    "name" in tool &&
    "description" in tool &&
    "execute" in tool &&
    typeof (tool as Tool).name === "string" &&
    typeof (tool as Tool).description === "string" &&
    typeof (tool as Tool).execute === "function"
  )
}

/**
 * Load and validate all tools
 */
export async function loadTools(): Promise<Tool[]> {
  const tools: Tool[] = []

  for (const modulePromise of toolModules) {
    try {
      const module = await modulePromise
      // Check all exports from the module
      for (const exportValue of Object.values(module)) {
        if (isValidTool(exportValue)) {
          tools.push(exportValue)
        }
      }
    } catch (error) {
      console.error("Error loading tool module:", error)
    }
  }

  return tools
}

// Cache tools for serverless environments
let toolsCache: Tool[] | null = null

/**
 * Get all validated tools
 */
export async function getTools(): Promise<Tool[]> {
  if (!toolsCache) {
    toolsCache = await loadTools()
  }
  return toolsCache
}

// Export tools as a promise
export const tools = getTools()

