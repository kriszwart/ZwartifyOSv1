import { NextRequest, NextResponse } from "next/server"
import { getEnvConfig, isApiKeyAuthEnabled } from "../config/env"

/**
 * API Key Authentication Middleware
 * 
 * Validates API key from request headers or query params
 * 
 * Usage:
 * - Header: Authorization: Bearer <api-key>
 * - Header: X-API-Key: <api-key>
 * - Query param: ?apiKey=<api-key>
 */

export function authenticateApiKey(request: NextRequest): { authorized: boolean; error?: string } {
  // If API key auth is not enabled, allow all requests
  if (!isApiKeyAuthEnabled()) {
    return { authorized: true }
  }

  // If user provides their own Anthropic API key, allow the request
  // The route handler will validate the user's API key when calling Anthropic
  const userApiKey = request.headers.get('x-user-api-key')
  if (userApiKey && userApiKey.trim().length > 0) {
    return { authorized: true }
  }

  const config = getEnvConfig()
  const expectedApiKey = config.API_KEY

  if (!expectedApiKey) {
    // Should not happen if isApiKeyAuthEnabled() returned true
    return { authorized: false, error: "API key authentication is misconfigured" }
  }

  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    if (token === expectedApiKey) {
      return { authorized: true }
    }
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key')
  if (apiKeyHeader === expectedApiKey) {
    return { authorized: true }
  }

  // Check query parameter (less secure, but convenient for testing)
  const { searchParams } = new URL(request.url)
  const apiKeyParam = searchParams.get('apiKey')
  if (apiKeyParam === expectedApiKey) {
    return { authorized: true }
  }

  return {
    authorized: false,
    error: "Invalid or missing API key. Provide via Authorization header (Bearer token), X-API-Key header, or ?apiKey query parameter.",
  }
}

/**
 * Middleware wrapper for API routes
 */
export function withAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
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
    
    return handler(request)
  }
}

