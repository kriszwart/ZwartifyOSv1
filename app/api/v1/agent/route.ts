import { NextRequest, NextResponse } from "next/server"

// Route segment configuration
export const dynamic = 'force-dynamic'

/**
 * Versioned Agent Route (v1)
 *
 * Supports /api/v1/agent endpoint
 * For backward compatibility, this re-exports the base handler
 * Future versions can have version-specific logic here
 */

/**
 * OPTIONS /api/v1/agent - Handle CORS preflight requests
 */
export async function OPTIONS() {
  const { OPTIONS: baseHandler } = await import("../../agent/route")
  return baseHandler()
}

/**
 * GET /api/v1/agent - Get agent API information
 */
export async function GET() {
  const { GET: baseHandler } = await import("../../agent/route")
  return baseHandler()
}

/**
 * POST /api/v1/agent - Execute an agent
 */
export async function POST(request: NextRequest) {
  // Re-export the base handler
  // Both /api/agent and /api/v1/agent work the same way for now
  const { POST: baseHandler } = await import("../../agent/route")
  return baseHandler(request)
}

