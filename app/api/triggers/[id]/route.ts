import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../../backend/utils/errorLogger"
import { 
  getTrigger,
  updateTrigger,
  deleteTrigger,
  getTriggerEventHistory,
} from "../../../../backend/triggers/triggerManager"

// Route segment configuration
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/triggers/[id] - Get trigger details
 */
export async function GET(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    const trigger = getTrigger(id)

    if (!trigger) {
      return NextResponse.json(
        { error: "Trigger not found" },
        { status: 404 }
      )
    }

    // Get recent event history
    const recentEvents = getTriggerEventHistory(id, 10)

    // Generate webhook URL
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'

    return NextResponse.json({
      success: true,
      trigger: {
        id: trigger.id,
        name: trigger.name,
        agentId: trigger.agentId,
        type: trigger.type,
        status: trigger.status,
        config: trigger.config,
        conditions: trigger.conditions,
        inputTemplate: trigger.inputTemplate,
        triggerCount: trigger.triggerCount,
        lastTriggeredAt: trigger.lastTriggeredAt?.toISOString(),
        createdAt: trigger.createdAt.toISOString(),
        updatedAt: trigger.updatedAt.toISOString(),
        metadata: trigger.metadata,
        webhookUrl: trigger.type === 'webhook' 
          ? `${protocol}://${host}/api/webhook/${trigger.id}`
          : undefined,
      },
      recentEvents: recentEvents.map(e => ({
        id: e.id,
        status: e.status,
        createdAt: e.createdAt.toISOString(),
        processedAt: e.processedAt?.toISOString(),
        error: e.error,
      })),
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'get_trigger' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}

/**
 * PATCH /api/triggers/[id] - Update trigger
 * 
 * Body:
 * - name?: string
 * - status?: 'active' | 'paused' | 'disabled'
 * - conditions?: array
 * - inputTemplate?: string
 * - metadata?: object
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    const body = await request.json()

    const trigger = getTrigger(id)
    if (!trigger) {
      return NextResponse.json(
        { error: "Trigger not found" },
        { status: 404 }
      )
    }

    // Validate status if provided
    if (body.status && !['active', 'paused', 'disabled'].includes(body.status)) {
      return NextResponse.json(
        { error: "status must be 'active', 'paused', or 'disabled'" },
        { status: 400 }
      )
    }

    const updated = updateTrigger(id, {
      name: body.name,
      status: body.status,
      conditions: body.conditions,
      inputTemplate: body.inputTemplate,
      metadata: body.metadata,
    })

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update trigger" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trigger: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'update_trigger' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}

/**
 * DELETE /api/triggers/[id] - Delete trigger
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    const deleted = deleteTrigger(id)

    if (!deleted) {
      return NextResponse.json(
        { error: "Trigger not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted: id,
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'delete_trigger' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}




