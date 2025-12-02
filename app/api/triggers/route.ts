import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../backend/utils/errorLogger"
import { 
  createTrigger,
  listTriggers,
  TriggerType,
  TriggerStatus,
  WebhookConfig,
  ScheduleConfig,
  AgentCompletionConfig,
} from "../../../backend/triggers/triggerManager"

// Route segment configuration
export const dynamic = 'force-dynamic'

/**
 * POST /api/triggers - Create a new trigger
 * 
 * Body:
 * - name: string (required)
 * - agentId: string (required)
 * - type: 'webhook' | 'schedule' | 'agent_completion' (required)
 * - config: object (required) - Type-specific configuration
 * - conditions?: array - Conditions that must be met
 * - inputTemplate?: string - Template for agent input
 * - metadata?: object
 */
export async function POST(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const body = await request.json()
    
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      )
    }

    if (!body.agentId || typeof body.agentId !== 'string') {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      )
    }

    if (!body.type || !['webhook', 'schedule', 'agent_completion'].includes(body.type)) {
      return NextResponse.json(
        { error: "type must be 'webhook', 'schedule', or 'agent_completion'" },
        { status: 400 }
      )
    }

    if (!body.config || typeof body.config !== 'object') {
      return NextResponse.json(
        { error: "config is required" },
        { status: 400 }
      )
    }

    // Validate type-specific config
    let config: WebhookConfig | ScheduleConfig | AgentCompletionConfig

    switch (body.type) {
      case 'webhook':
        config = {
          type: 'webhook',
          secret: body.config.secret,
          allowedMethods: body.config.allowedMethods,
          allowedOrigins: body.config.allowedOrigins,
        }
        break
      case 'schedule':
        if (!body.config.scheduleId) {
          return NextResponse.json(
            { error: "config.scheduleId is required for schedule triggers" },
            { status: 400 }
          )
        }
        config = {
          type: 'schedule',
          scheduleId: body.config.scheduleId,
        }
        break
      case 'agent_completion':
        if (!body.config.sourceAgentId) {
          return NextResponse.json(
            { error: "config.sourceAgentId is required for agent_completion triggers" },
            { status: 400 }
          )
        }
        config = {
          type: 'agent_completion',
          sourceAgentId: body.config.sourceAgentId,
          onStatus: body.config.onStatus,
          outputConditions: body.config.outputConditions,
        }
        break
      default:
        return NextResponse.json(
          { error: `Unknown trigger type: ${body.type}` },
          { status: 400 }
        )
    }

    const trigger = createTrigger({
      name: body.name,
      agentId: body.agentId,
      type: body.type as TriggerType,
      config,
      conditions: body.conditions,
      inputTemplate: body.inputTemplate,
      metadata: body.metadata,
    })

    // Generate webhook URL for webhook triggers
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const webhookUrl = trigger.type === 'webhook' 
      ? `${protocol}://${host}/api/webhook/${trigger.id}`
      : undefined

    return NextResponse.json({
      success: true,
      trigger: {
        id: trigger.id,
        name: trigger.name,
        agentId: trigger.agentId,
        type: trigger.type,
        status: trigger.status,
        createdAt: trigger.createdAt.toISOString(),
        webhookUrl,
      },
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'create_trigger' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.statusCode }
    )
  }
}

/**
 * GET /api/triggers - List triggers
 * 
 * Query params:
 * - type?: 'webhook' | 'schedule' | 'agent_completion'
 * - status?: 'active' | 'paused' | 'disabled'
 * - agentId?: string
 */
export async function GET(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as TriggerType | null
    const status = searchParams.get('status') as TriggerStatus | null
    const agentId = searchParams.get('agentId')

    const triggers = listTriggers({
      type: type || undefined,
      status: status || undefined,
      agentId: agentId || undefined,
    })

    // Generate webhook URLs
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'

    return NextResponse.json({
      success: true,
      triggers: triggers.map(t => ({
        id: t.id,
        name: t.name,
        agentId: t.agentId,
        type: t.type,
        status: t.status,
        triggerCount: t.triggerCount,
        lastTriggeredAt: t.lastTriggeredAt?.toISOString(),
        createdAt: t.createdAt.toISOString(),
        webhookUrl: t.type === 'webhook' 
          ? `${protocol}://${host}/api/webhook/${t.id}`
          : undefined,
      })),
      count: triggers.length,
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'list_triggers' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.statusCode }
    )
  }
}



