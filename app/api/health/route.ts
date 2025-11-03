import { NextResponse } from "next/server"

/**
 * Health Check Endpoint
 * 
 * GET /api/health - Basic health check
 * GET /api/ready - Readiness probe (checks dependencies)
 */

export async function GET() {
  try {
    // Check if API key is configured (required dependency)
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        {
          status: "unhealthy",
          message: "Missing required environment variable: CLAUDE_API_KEY",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

