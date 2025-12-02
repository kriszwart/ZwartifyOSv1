/**
 * Image Utilities for Demo
 * Handles fetching images from URLs and converting to base64
 */

/**
 * Fetch image from URL and convert to base64 data URL
 * @param url - Image URL to fetch
 * @returns Promise resolving to base64 data URL
 */
export async function fetchImageFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'no-cache',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }
    
    const blob = await response.blob()
    
    // Validate it's an image
    if (!blob.type.startsWith('image/')) {
      throw new Error(`URL does not point to an image: ${blob.type}`)
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert image to base64'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read image'))
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error fetching image from URL:', error)
    throw error
  }
}

/**
 * Validate that a URL points to an accessible image
 * @param url - URL to validate
 * @returns Promise resolving to true if valid, false otherwise
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'cors' })
    if (!response.ok) return false
    
    const contentType = response.headers.get('content-type')
    return contentType?.startsWith('image/') ?? false
  } catch {
    return false
  }
}

/**
 * Get image data URL from asset reference or direct URL
 * @param assetRef - Asset reference (e.g., "creatioScreenshotUrl") or direct URL
 * @param assets - Assets object to resolve references
 * @returns Promise resolving to base64 data URL
 */
export async function getImageFromAsset(
  assetRef: string,
  assets: Record<string, any>
): Promise<string> {
  // If it's a direct URL, use it
  if (assetRef.startsWith('http://') || assetRef.startsWith('https://')) {
    return fetchImageFromUrl(assetRef)
  }
  
  // Otherwise, resolve from assets
  const url = assets[assetRef] || assetRef
  if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
    return fetchImageFromUrl(url)
  }
  
  throw new Error(`Invalid asset reference: ${assetRef}`)
}

