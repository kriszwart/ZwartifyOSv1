import { NextRequest, NextResponse } from "next/server"
import { isRateLimitEnabled, getEnvConfig } from "../config/env"

/**
 * Simple in-memory rate limiter
 * 
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get API key first (more accurate for authenticated requests)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return `api_key:${authHeader.substring(7).substring(0, 10)}` // First 10 chars for ID
  }
  
  const apiKeyHeader = request.headers.get('x-api-key')
  if (apiKeyHeader) {
    return `api_key:${apiKeyHeader.substring(0, 10)}`
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
  
  return `ip:${ip}`
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(request: NextRequest): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  // If rate limiting is disabled, allow all requests
  if (!isRateLimitEnabled()) {
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: Date.now() + 60000,
    }
  }
  
  const config = getEnvConfig()
  const maxRequests = parseInt(config.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  const windowMs = parseInt(config.RATE_LIMIT_WINDOW_MS || '60000', 10)
  
  const clientId = getClientId(request)
  const now = Date.now()
  
  const entry = rateLimitStore.get(clientId)
  
  // If no entry or window expired, create new entry
  if (!entry || now >= entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    }
    rateLimitStore.set(clientId, newEntry)
    
    // Clean up old entries periodically (simple cleanup)
    if (rateLimitStore.size > 10000) {
      for (const [key, value] of rateLimitStore.entries()) {
        if (now >= value.resetAt) {
          rateLimitStore.delete(key)
        }
      }
    }
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: newEntry.resetAt,
    }
  }
  
  // Increment count
  entry.count++
  
  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
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
    
    // Add rate limit headers to successful responses
    const response = await handler(request)
    
    response.headers.set('X-RateLimit-Limit', process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString())
    
    return response
  }
}

