import { NextRequest, NextResponse } from "next/server"
import { handleApiError, ErrorCategory } from "../../../../backend/utils/errorLogger"
import { 
  getTrigger,
  validateWebhookRequest,
  fireTrigger,
  markEventProcessed,
} from "../../../../backend/triggers/triggerManager"
import { agentClient } from "../../../../backend/agents/agentClient"
import { getAgent } from "../../../../backend/agents/agentRegistry"
import { getTools } from "../../../../backend/tools"

// Route segment configuration
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ triggerId: string }>
}

/**
 * Handle webhook request and trigger agent
 */
async function handleWebhook(
  request: NextRequest,
  triggerId: string,
  method: string
): Promise<NextResponse> {
  try {
    // Validate webhook request
    const origin = request.headers.get('origin') || undefined
    const signature = request.headers.get('x-webhook-signature') || undefined

    const validation = validateWebhookRequest(triggerId, method, origin, signature)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Get trigger
    const trigger = getTrigger(triggerId)
    if (!trigger) {
      return NextResponse.json(
        { error: "Trigger not found" },
        { status: 404 }
      )
    }

    // Parse payload
    let payload: unknown
    if (method === 'GET') {
      // For GET requests, use query params as payload
      const { searchParams } = new URL(request.url)
      payload = Object.fromEntries(searchParams.entries())
    } else {
      // For POST/PUT, parse body
      try {
        const contentType = request.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          payload = await request.json()
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const text = await request.text()
          payload = Object.fromEntries(new URLSearchParams(text))
        } else {
          payload = await request.text()
        }
      } catch {
        payload = {}
      }
    }

    // Fire trigger
    const event = fireTrigger(triggerId, payload)
    if (!event) {
      return NextResponse.json(
        { error: "Trigger conditions not met or trigger inactive" },
        { status: 400 }
      )
    }

    // Get agent configuration
    const agent = await getAgent(trigger.agentId)
    if (!agent) {
      markEventProcessed(event.id, 'failed', { error: 'Agent not found' })
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    // Process webhook asynchronously (don't block the response)
    // In production, this should be a proper job queue
    processWebhookAsync(event.id, trigger.agentId, event.agentInput || '', agent).catch(err => {
      console.error(`Webhook processing error for event ${event.id}:`, err)
    })

    return NextResponse.json({
      success: true,
      eventId: event.id,
      triggerId,
      message: "Webhook received and queued for processing",
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'webhook', triggerId }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}

/**
 * Process webhook asynchronously
 */
async function processWebhookAsync(
  eventId: string,
  agentId: string,
  input: string,
  agent: { name: string; prompt?: string; ragFolderId?: string; useMemory?: boolean; skillIds?: string[] }
): Promise<void> {
  try {
    // Get API key from environment
    const { getEnvConfig } = await import("../../../../backend/config/env")
    const config = getEnvConfig()

    if (!config.CLAUDE_API_KEY) {
      markEventProcessed(eventId, 'failed', { error: 'API key not configured' })
      return
    }

    // Get tools
    const tools = await getTools()

    // Run agent
    const result = await agentClient.run(input, {
      agentId,
      agentName: agent.name,
      agentPrompt: agent.prompt,
      tools,
      ragFolderId: agent.ragFolderId,
      useMemory: agent.useMemory !== false,
      skillIds: agent.skillIds,
      userApiKey: config.CLAUDE_API_KEY,
    })

    markEventProcessed(eventId, 'completed', { output: result.output_text })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    markEventProcessed(eventId, 'failed', { error: errorMessage })
  }
}

/**
 * GET /api/webhook/[triggerId] - Handle GET webhook
 */
export async function GET(request: NextRequest, context: RouteParams) {
  const { triggerId } = await context.params
  return handleWebhook(request, triggerId, 'GET')
}

/**
 * POST /api/webhook/[triggerId] - Handle POST webhook
 */
export async function POST(request: NextRequest, context: RouteParams) {
  const { triggerId } = await context.params
  return handleWebhook(request, triggerId, 'POST')
}

/**
 * PUT /api/webhook/[triggerId] - Handle PUT webhook
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  const { triggerId } = await context.params
  return handleWebhook(request, triggerId, 'PUT')
}




