/**
 * Structured Error Logging
 *
 * Provides structured error logging with categorization,
 * stack traces, and optional error tracking service integration
 */

export enum ErrorCategory {
  USER_ERROR = 'user_error',      // Invalid input, validation errors
  SYSTEM_ERROR = 'system_error',   // Internal errors, bugs
  API_ERROR = 'api_error',        // External API failures
  NETWORK_ERROR = 'network_error', // Network issues
  AUTH_ERROR = 'auth_error',      // Authentication/authorization failures
  RATE_LIMIT_ERROR = 'rate_limit_error', // Rate limit exceeded
  UNKNOWN_ERROR = 'unknown_error',
}

export interface ErrorLog {
  timestamp: string
  category: ErrorCategory
  message: string
  error?: string
  stack?: string
  context?: Record<string, unknown>
  userId?: string
  agentId?: string
  requestId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Create structured error log
 */
export function createErrorLog(
  error: Error | unknown,
  category: ErrorCategory = ErrorCategory.UNKNOWN_ERROR,
  context?: Record<string, unknown>
): ErrorLog {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  // Determine severity based on category
  const severity = getSeverity(category)

  return {
    timestamp: new Date().toISOString(),
    category,
    message,
    error: error instanceof Error ? error.name : typeof error,
    stack,
    context,
    severity,
  }
}

/**
 * Determine severity based on error category
 */
function getSeverity(category: ErrorCategory): ErrorLog['severity'] {
  switch (category) {
    case ErrorCategory.USER_ERROR:
      return 'low'
    case ErrorCategory.AUTH_ERROR:
    case ErrorCategory.RATE_LIMIT_ERROR:
      return 'medium'
    case ErrorCategory.API_ERROR:
    case ErrorCategory.NETWORK_ERROR:
      return 'high'
    case ErrorCategory.SYSTEM_ERROR:
      return 'critical'
    default:
      return 'medium'
  }
}

/**
 * Log error with structured format
 */
export function logError(
  error: Error | unknown,
  category: ErrorCategory = ErrorCategory.UNKNOWN_ERROR,
  context?: Record<string, unknown>
): ErrorLog {
  const errorLog = createErrorLog(error, category, context)

  // Console logging (structured JSON in production, readable in development)
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(errorLog))
  } else {
    console.error(`[${errorLog.category}] ${errorLog.message}`, {
      error: errorLog.error,
      stack: errorLog.stack,
      context: errorLog.context,
    })
  }

  // TODO: Integrate with error tracking service (Sentry, Rollbar, etc.)
  // if (process.env.ERROR_TRACKING_SERVICE === 'sentry') {
  //   Sentry.captureException(error, { tags: { category }, extra: context })
  // }

  return errorLog
}

/**
 * Create user-friendly error message
 */
export function getUserFriendlyMessage(
  error: Error | unknown,
  category: ErrorCategory
): string {
  // Don't expose internal errors to users
  if (category === ErrorCategory.SYSTEM_ERROR) {
    return 'An internal error occurred. Please try again later.'
  }

  if (category === ErrorCategory.API_ERROR) {
    return 'Unable to connect to the AI service. Please try again later.'
  }

  if (category === ErrorCategory.NETWORK_ERROR) {
    return 'Network error. Please check your connection and try again.'
  }

  if (category === ErrorCategory.AUTH_ERROR) {
    return 'Authentication failed. Please check your API key.'
  }

  if (category === ErrorCategory.RATE_LIMIT_ERROR) {
    return 'Too many requests. Please try again later.'
  }

  // For user errors, return the actual message
  if (category === ErrorCategory.USER_ERROR) {
    return error instanceof Error ? error.message : String(error)
  }

  // Default message
  return 'An error occurred. Please try again.'
}

/**
 * Error handler for API routes
 */
export function handleApiError(
  error: Error | unknown,
  category: ErrorCategory = ErrorCategory.UNKNOWN_ERROR,
  context?: Record<string, unknown>
): { status: number; message: string; log: ErrorLog } {
  const errorLog = logError(error, category, context)
  const userMessage = getUserFriendlyMessage(error, category)

  // Determine HTTP status code
  let status = 500
  switch (category) {
    case ErrorCategory.USER_ERROR:
      status = 400
      break
    case ErrorCategory.AUTH_ERROR:
      status = 401
      break
    case ErrorCategory.RATE_LIMIT_ERROR:
      status = 429
      break
    case ErrorCategory.API_ERROR:
    case ErrorCategory.NETWORK_ERROR:
      status = 502
      break
    case ErrorCategory.SYSTEM_ERROR:
      status = 500
      break
    default:
      status = 500
  }

  return {
    status,
    message: userMessage,
    log: errorLog,
  }
}
