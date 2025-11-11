/**
 * Agent Client
 * 
 * Uses the standard Anthropic SDK (@anthropic-ai/sdk) for API access.
 * 
 * Note: The Claude Agent SDK (@anthropic-ai/claude-agent-sdk) is not used because:
 * 
 * The Agent SDK requires:
 * - Claude Code CLI executable installed and accessible (see `pathToClaudeCodeExecutable` option)
 * - Ability to spawn long-running CLI processes
 * - Persistent file system access for context management
 * - Terminal/shell access for built-in tools (Bash, Read, Write, Edit, etc.)
 * 
 * These requirements don't work in Next.js/serverless environments like Vercel where:
 * - Processes are ephemeral and can't run long-running CLI tools
 * - File system access is read-only or temporary
 * - No ability to spawn external executables reliably
 * 
 * The standard Anthropic SDK works perfectly for Next.js/Vercel:
 * - Direct API calls (no CLI dependency)
 * - Works in serverless functions
 * - Supports tools via API (MCP servers via HTTP/SSE)
 * - No file system or process requirements
 * 
 * To use the Agent SDK, you would need:
 * - A dedicated Node.js server (not Next.js API routes)
 * - Claude Code CLI installed: https://docs.claude.com/en/docs/claude-code/installation
 * - Full file system and process access
 * 
 * See: https://docs.claude.com/en/api/agent-sdk/typescript for full SDK documentation
 * 
 * ---
 * 
 * Philosophy: Agent systems should be open source and empower users, not act as middlemen.
 * 
 * This codebase is open source because we believe:
 * - Agent platforms should be transparent and auditable
 * - Users should own their agents and data, not rent them
 * - Innovation comes from open collaboration, not walled gardens
 * - Middlemen who add no value beyond access control are rip-off merchants
 * 
 * If you're building an agent system, make it open source. Let users self-host.
 * Don't be a gatekeeper charging for access to something they can run themselves.
 * The value is in the code, the tools, the architecture—not in artificial scarcity.
 */

import Anthropic from "@anthropic-ai/sdk"
import { ExecutionLogger } from "../db/logger"
import { buildRAGPrompt } from "../rag/query"
import { 
  getLatestConversation, 
  createConversation, 
  addMessage,
  buildConversationContext 
} from "../memory/store"
import { buildSkillContext, detectRelevantSkills } from "../skills/store"
import { trackSkillUsage } from "../skills/usageTracking"
import { setToolContext, clearToolContext } from "../tools/toolContext"

export interface AgentRunOptions {
  tools?: Array<{ name: string; description: string; execute: (...args: unknown[]) => Promise<unknown> }>
  agentId?: string
  agentName?: string
  agentPrompt?: string // System prompt for the agent
  logger?: ExecutionLogger
  metadata?: Record<string, unknown>
  ragFolderId?: string // RAG folder to use for context
  useMemory?: boolean // Whether to use conversation memory
  conversationId?: string // Specific conversation ID to use
  image?: string // Base64 encoded image for vision analysis
  skillIds?: string[] // Specific skills to use (auto-detected if not provided)
  autoDetectSkills?: boolean // Whether to auto-detect relevant skills from input
  userApiKey?: string // User-provided API key (client-side), falls back to server env if not provided
}

export interface AgentRunResult {
  output_text: string
  executionId?: string
}

// Create and configure agent client
export const agentClient = {
  /**
   * Run the agent with input and tools
   * @param input - User input/prompt
   * @param options - Options including tools, agent info, and logger
   * @returns Promise with output text and execution ID
   */
  async run(input: string, options: AgentRunOptions = {}): Promise<AgentRunResult> {
    // Get API key: prefer user-provided key, fall back to server environment
    let apiKey = options.userApiKey
    
    if (!apiKey) {
      const { getEnvConfig } = await import("../config/env")
      const config = getEnvConfig()
      apiKey = config.CLAUDE_API_KEY
    }

    if (!apiKey) {
      throw new Error(
        "API key is required. Please provide your Anthropic API key in Settings, " +
        "or set CLAUDE_API_KEY/ANTHROPIC_API_KEY environment variable."
      )
    }

    // Create logger if not provided
    const logger = options.logger || new ExecutionLogger(
      options.agentId || 'default',
      options.agentName
    )

    // Start execution logging
    logger.startExecution(input, {
      ...options.metadata,
      toolCount: options.tools?.length || 0,
    })

    try {
      // Log API key presence (without exposing the actual key)
      logger.log('info', 'API Key configured', { 
        keyPrefix: apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND' 
      })

      // Get or create conversation for memory
      let conversationId = options.conversationId
      if (options.useMemory !== false && options.agentId) {
        if (!conversationId) {
          const latestConv = getLatestConversation(options.agentId)
          if (latestConv) {
            conversationId = latestConv.id
          } else {
            const newConv = createConversation(options.agentId)
            conversationId = newConv.id
          }
        }

        // Add user message to conversation
        addMessage(conversationId, 'user', input, options.metadata)
      }

      // Build enhanced input with RAG and memory context
      let enhancedInput = input

      // Add memory context if enabled
      if (options.useMemory !== false && conversationId && options.agentId) {
        const memoryContext = buildConversationContext(options.agentId, 10)
        if (memoryContext) {
          logger.log('info', 'Adding conversation memory context', { conversationId })
          enhancedInput = `Previous conversation context:\n\n${memoryContext}\n\nCurrent request: ${input}`
        }
      }

      // Enhance prompt with Skills context
      let skillIds = options.skillIds || []
      
      // Auto-detect relevant skills if enabled and no skills specified
      if (options.autoDetectSkills !== false && skillIds.length === 0) {
        const detectedSkills = detectRelevantSkills(input, 3)
        skillIds = detectedSkills.map(skill => skill.id)
        if (detectedSkills.length > 0) {
          logger.log('info', 'Auto-detected relevant skills', {
            skillNames: detectedSkills.map(s => s.name),
          })
        }
      }
      
      // Build skill context and inject into prompt
      if (skillIds.length > 0) {
        // Track skill usage
        trackSkillUsage(skillIds, options.agentId || 'unknown')
        
        const skillContext = await buildSkillContext(skillIds)
        if (skillContext) {
          logger.log('info', 'Adding Skills context to prompt', { skillCount: skillIds.length })
          enhancedInput = `${skillContext}\n\n---\n\nUser Request: ${enhancedInput}`
        }
      }

      // Enhance prompt with RAG context if RAG folder is specified
      if (options.ragFolderId) {
        logger.log('info', 'Enhancing prompt with RAG context', { ragFolderId: options.ragFolderId })
        enhancedInput = await buildRAGPrompt(enhancedInput, input, options.ragFolderId)
      }

      // Use standard Anthropic SDK (works in Next.js/serverless environments)
      const result = await this.runWithStandardSDK(enhancedInput, options, apiKey, logger)
      
      // Add assistant response to conversation memory
      if (options.useMemory !== false && conversationId) {
        addMessage(conversationId, 'assistant', result.output_text)
      }
      
      // Complete execution successfully
      logger.completeExecution(result.output_text)
      
      return {
        ...result,
        executionId: logger.getExecutionId(),
      }
    } catch (error) {
      // Log execution failure
      logger.failExecution(error instanceof Error ? error : String(error))
      
      // Re-throw error
      throw error
    }
  },

  /**
   * Run with standard Anthropic SDK (works in serverless/Next.js)
   * 
   * Note: The Claude Agent SDK is not used here because it requires:
   * - CLI tools and process spawning (not available in Next.js)
   * - Persistent file system access (limited in serverless)
   * 
   * The standard SDK provides API access which works perfectly for Next.js.
   */
  async runWithStandardSDK(
    input: string,
    options: AgentRunOptions,
    apiKey: string,
    logger: ExecutionLogger
  ) {
    const anthropic = new Anthropic({
      apiKey: apiKey,
    })

    // Convert tools to Anthropic API format if provided
    const tools: Anthropic.Tool[] = []
    if (options.tools && options.tools.length > 0) {
      tools.push(
        ...options.tools.map((toolDef) => ({
          name: toolDef.name,
          description: toolDef.description,
          input_schema: {
            type: "object" as const,
            properties: {},
            required: [] as string[],
          },
        }))
      )
    }

    try {
      logger.log('info', 'Starting agent query with standard Anthropic SDK', {
        model: 'claude-sonnet-4-5-20250929',
        toolCount: tools.length,
        hasImage: !!options.image,
      })
      
      // Build message content - support text and images
      const messageContent: Array<
        | { type: "text"; text: string }
        | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string } }
      > = [
        {
          type: "text",
          text: input,
        },
      ]
      
      // Add image or PDF if provided (base64 encoded)
      if (options.image) {
        // Extract base64 data (remove data:image/...;base64, or data:application/pdf;base64, prefix if present)
        const base64Data = options.image.includes(',') 
          ? options.image.split(',')[1] 
          : options.image
        
        // Check if it's a PDF
        const isPDF = options.image.includes('data:application/pdf') || options.image.includes('application/pdf')
        
        if (isPDF) {
          // PDFs should have their text extracted in the API route before reaching here
          // If we still receive a PDF here, it means extraction failed or wasn't attempted
          // Just log it - the text extraction should happen upstream
          logger.log('info', 'PDF detected in agentClient - text should have been extracted upstream', {})
          // Don't add PDF note since extraction happens in API route
        } else {
          // Detect image type from the original string or default to png
          const imageTypeMatch = options.image.match(/data:image\/(\w+)/)?.[1] || 'png'
          // Map to valid media types
          const mediaTypeMap: Record<string, "image/jpeg" | "image/png" | "image/gif" | "image/webp"> = {
            'jpeg': 'image/jpeg',
            'jpg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
          }
          const mediaType = mediaTypeMap[imageTypeMatch.toLowerCase()] || 'image/png'
          
          messageContent.push({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: mediaType,
              data: base64Data,
            },
          })
        }
      }
      
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        ...(options.agentPrompt && { system: options.agentPrompt }), // Add system prompt if provided
        messages: [
          {
            role: "user",
            content: messageContent as any, // Type assertion needed due to complex union type
          },
        ],
        ...(tools.length > 0 && { tools }),
      })

      // Capture token usage from initial API call
      if (message.usage) {
        logger.logTokenUsage(
          message.usage.input_tokens,
          message.usage.output_tokens,
          "claude-sonnet-4-5-20250929"
        )
      }

      // Handle tool use requests if any
      let finalContent = ""
      const contents = message.content
      let toolCallsCount = 0

      for (const content of contents) {
        if (content.type === "text") {
          finalContent += content.text
        } else if (content.type === "tool_use") {
          toolCallsCount++
          // Execute tool if provided
          const toolDef = options.tools?.find((t) => t.name === content.name)
          
          if (toolDef) {
            const toolCallId = logger.logToolCall(content.name, content.input)
            
            try {
              // Set tool context with current agent ID and original user prompt
              // Use the original input before any enhancements (RAG, memory, etc.)
              setToolContext(options.agentId, input)
              
              logger.log('info', `Executing tool: ${content.name}`, { 
                toolUseId: content.id,
                arguments: content.input 
              })
              
              const toolResult = await toolDef.execute(...(Array.isArray(content.input) ? content.input : [content.input]))
              
              // Clear tool context after execution
              clearToolContext()
              const resultText = typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult)
              
              logger.completeToolCall(toolCallId, toolResult)
              
              // Make a follow-up request with tool results
              logger.log('info', 'Making follow-up request with tool results', {
                toolName: content.name,
              })
              
              const followUpMessage = await anthropic.messages.create({
                model: "claude-sonnet-4-5-20250929",
                max_tokens: 2048,
                ...(options.agentPrompt && { system: options.agentPrompt }), // Add system prompt if provided
                messages: [
                  {
                    role: "user",
                    content: messageContent as any, // Include original image if present
                  },
                  {
                    role: "assistant",
                    content: contents,
                  },
                  {
                    role: "user",
                    content: [
                      {
                        type: "tool_result",
                        tool_use_id: content.id,
                        content: resultText,
                      },
                    ],
                  },
                ],
                ...(tools.length > 0 && { tools }),
              })

              // Capture token usage from follow-up API call
              if (followUpMessage.usage) {
                logger.logTokenUsage(
                  followUpMessage.usage.input_tokens,
                  followUpMessage.usage.output_tokens,
                  "claude-sonnet-4-5-20250929"
                )
              }

              // Extract final text from follow-up response
              const followUpTexts = followUpMessage.content
                .filter((item: any): item is Anthropic.TextBlock => item.type === "text")
                .map((item: Anthropic.TextBlock) => item.text)
              
              finalContent = followUpTexts.join("")
              
              logger.log('info', 'Follow-up request completed', {
                responseLength: finalContent.length,
              })
            } catch (toolError) {
              // Clear tool context on error
              clearToolContext()
              
              logger.completeToolCall(
                toolCallId, 
                undefined, 
                toolError instanceof Error ? toolError : new Error(String(toolError))
              )
              
              logger.log('error', `Error executing tool ${content.name}`, {
                error: toolError instanceof Error ? toolError.message : String(toolError),
                stack: toolError instanceof Error ? toolError.stack : undefined,
              })
              
              finalContent += `[Error executing tool: ${content.name}]`
            }
          } else {
            logger.log('warn', `Tool ${content.name} requested but not found in registry`, {
              toolUseId: content.id,
              availableTools: options.tools?.map(t => t.name) || [],
            })
          }
        }
      }

      // If no tool use, just extract text content
      if (!finalContent && contents.length > 0) {
        const textContents = contents
          .filter((item: any): item is Anthropic.TextBlock => item.type === "text")
          .map((item: Anthropic.TextBlock) => item.text)
        finalContent = textContents.join("")
      }

      logger.log('info', 'Agent query completed successfully', {
        outputLength: finalContent.length,
        toolCallsCount,
      })
      
      return {
        output_text: finalContent || "No response generated",
      }
    } catch (error) {
      logger.log('error', 'Standard SDK error occurred', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })

      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes("api_key") || error.message.includes("401") || error.message.includes("authentication")) {
          throw new Error(
            "Authentication failed. Please check your API key:\n" +
            "1. Ensure the key starts with 'sk-ant-'\n" +
            "2. Verify the key is valid and not expired\n" +
            "3. Restart your dev server after changing .env.local\n\n" +
            `Original error: ${error.message}`
          )
        }
        if (error.message.includes("rate_limit") || error.message.includes("429")) {
          throw new Error("Rate limit exceeded. Please try again in a moment.")
        }
      }

      throw error
    }
  },
}

