import { NextRequest, NextResponse } from "next/server"
import { authenticateApiKey } from "./auth"
import { checkRateLimit } from "./rateLimit"

/**
 * Combined middleware: Authentication + Rate Limiting + Request Size Limits
 */

const MAX_REQUEST_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Check request size
 */
async function checkRequestSize(request: NextRequest): Promise<{ allowed: boolean; error?: string }> {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (size > MAX_REQUEST_SIZE) {
      return {
        allowed: false,
        error: `Request too large. Maximum size is ${MAX_REQUEST_SIZE / 1024 / 1024}MB`,
      }
    }
  }
  
  return { allowed: true }
}

/**
 * Apply all middleware (auth, rate limit, size check)
 */
export async function applyMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Check request size
  const sizeCheck = await checkRequestSize(request)
  if (!sizeCheck.allowed) {
    return NextResponse.json(
      { error: "Bad Request", message: sizeCheck.error },
      { status: 413 }
    )
  }
  
  // Check authentication
  const authResult = authenticateApiKey(request)
  if (!authResult.authorized) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: authResult.error || "Authentication required",
      },
      { status: 401 }
    )
  }
  
  // Check rate limit
  const rateLimitResult = checkRateLimit(request)
  if (!rateLimitResult.allowed) {
    const resetDate = new Date(rateLimitResult.resetAt).toISOString()
    
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Too many requests. Please try again after ${resetDate}`,
        resetAt: resetDate,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX_REQUESTS || '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
        },
      }
    )
  }
  
  // All checks passed
  return null
}

/**
 * Get rate limit headers for successful responses
 */
export function getRateLimitHeaders(request: NextRequest): Record<string, string> {
  const rateLimitResult = checkRateLimit(request)
  
  return {
    'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
  }
}

