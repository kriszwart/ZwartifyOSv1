import { NextResponse } from "next/server"

/**
 * Readiness Probe Endpoint
 * 
 * GET /api/ready - Checks if the service is ready to accept traffic
 * More comprehensive than /health - checks all dependencies
 */

export async function GET() {
  try {
    const checks: Record<string, { status: string; message?: string }> = {}
    let allHealthy = true
    
    // Check API key
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      checks.apiKey = {
        status: "unhealthy",
        message: "Missing CLAUDE_API_KEY environment variable",
      }
      allHealthy = false
    } else {
      checks.apiKey = { status: "healthy" }
    }
    
    // Check Node.js version (should be 18+)
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.split('.')[0].replace('v', ''))
    if (majorVersion < 18) {
      checks.nodeVersion = {
        status: "unhealthy",
        message: `Node.js version ${nodeVersion} is below minimum required version 18`,
      }
      allHealthy = false
    } else {
      checks.nodeVersion = { status: "healthy" }
    }
    
    // In the future, you can add checks for:
    // - Database connectivity
    // - External API availability
    // - File system access
    // - Memory/CPU limits
    
    const status = allHealthy ? "ready" : "not_ready"
    const statusCode = allHealthy ? 200 : 503
    
    return NextResponse.json(
      {
        status,
        checks,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "not_ready",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

