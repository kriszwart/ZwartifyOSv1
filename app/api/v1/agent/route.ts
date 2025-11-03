import { NextRequest, NextResponse } from "next/server"

/**
 * Versioned Agent Route (v1)
 * 
 * Supports /api/v1/agent endpoint
 * For backward compatibility, this re-exports the base handler
 * Future versions can have version-specific logic here
 */
export async function POST(request: NextRequest) {
  // Re-export the base handler
  // Both /api/agent and /api/v1/agent work the same way for now
  const { POST: baseHandler } = await import("../agent/route")
  return baseHandler(request)
}

