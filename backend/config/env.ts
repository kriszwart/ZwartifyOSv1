/**
 * Environment Configuration
 * 
 * Validates required environment variables on startup
 * Provides type-safe access to environment variables
 */

interface EnvConfig {
  CLAUDE_API_KEY: string
  NODE_ENV: 'development' | 'production' | 'test'
  API_KEY?: string // Optional API key for authentication
  RATE_LIMIT_ENABLED?: string
  RATE_LIMIT_MAX_REQUESTS?: string
  RATE_LIMIT_WINDOW_MS?: string
}

const requiredEnvVars = ['CLAUDE_API_KEY'] as const
const optionalEnvVars = [
  'API_KEY',
  'RATE_LIMIT_ENABLED',
  'RATE_LIMIT_MAX_REQUESTS',
  'RATE_LIMIT_WINDOW_MS'
] as const

/**
 * Validates environment variables on startup
 * Throws error if required variables are missing
 */
export function validateEnvironment(): void {
  const missing: string[] = []
  
  for (const varName of requiredEnvVars) {
    // Check both CLAUDE_API_KEY and ANTHROPIC_API_KEY (backward compatibility)
    if (varName === 'CLAUDE_API_KEY') {
      if (!process.env.CLAUDE_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        missing.push('CLAUDE_API_KEY or ANTHROPIC_API_KEY')
      }
    } else if (!process.env[varName]) {
      missing.push(varName)
    }
  }
  
  if (missing.length > 0) {
    const errorMessage = `
❌ Missing required environment variables:

${missing.map(v => `  - ${v}`).join('\n')}

Please add these to your .env.local file:

${missing.map(v => {
  if (v.includes('CLAUDE_API_KEY')) {
    return 'CLAUDE_API_KEY=sk-ant-your-api-key-here'
  }
  return `${v}=your-value-here`
}).join('\n')}

See docs/quick-start.md for setup instructions.
    `.trim()
    
    throw new Error(errorMessage)
  }
  
  // Log successful validation (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment validation passed')
  }
}

/**
 * Get environment configuration with defaults
 */
export function getEnvConfig(): EnvConfig {
  return {
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
    API_KEY: process.env.API_KEY,
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED || 'false',
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '60000', // 1 minute
  }
}

/**
 * Check if API key authentication is enabled
 */
export function isApiKeyAuthEnabled(): boolean {
  return !!process.env.API_KEY && process.env.API_KEY.trim().length > 0
}

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitEnabled(): boolean {
  return process.env.RATE_LIMIT_ENABLED === 'true'
}

// Validate on module load (only in Node.js environment, not in browser)
if (typeof window === 'undefined') {
  try {
    validateEnvironment()
  } catch (error) {
    // In development, log the error but don't crash
    // In production, this should fail fast
    if (process.env.NODE_ENV === 'production') {
      console.error(error)
      process.exit(1)
    } else {
      console.warn('⚠️  Environment validation warning:', error instanceof Error ? error.message : error)
    }
  }
}

