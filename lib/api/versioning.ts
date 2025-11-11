/**
 * API Versioning Support
 *
 * Supports versioned API routes with backward compatibility
 */

export const API_VERSION = 'v1'
export const DEFAULT_API_VERSION = API_VERSION

/**
 * Extract API version from request path
 * Examples:
 * - /api/v1/agent -> v1
 * - /api/agent -> null (unversioned)
 */
export function extractApiVersion(pathname: string): string | null {
  const match = pathname.match(/^\/api\/(v\d+)\//)
  return match ? match[1] : null
}

/**
 * Check if request is for a specific API version
 */
export function isApiVersion(pathname: string, version: string): boolean {
  return pathname.startsWith(`/api/${version}/`)
}

/**
 * Get versioned path
 */
export function getVersionedPath(path: string, version: string = DEFAULT_API_VERSION): string {
  // Remove leading /api if present
  const cleanPath = path.replace(/^\/api/, '')
  // Remove version if present
  const cleanPathWithoutVersion = cleanPath.replace(/^\/v\d+/, '')
  return `/api/${version}${cleanPathWithoutVersion}`
}

/**
 * Redirect unversioned requests to versioned endpoint
 */
export function redirectToVersioned(path: string, version: string = DEFAULT_API_VERSION): string {
  return getVersionedPath(path, version)
}
