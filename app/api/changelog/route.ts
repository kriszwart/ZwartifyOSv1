import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface ChangelogVersion {
  version: string
  date: string
  added: string[]
  changed: string[]
  fixed: string[]
  highlights: string[]
  releaseUrl?: string
}

export interface ChangelogResponse {
  versions: ChangelogVersion[]
  latestVersion: string
  latestDate: string
}

// Cache parsed changelog
let cachedChangelog: ChangelogResponse | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Parse CHANGELOG.md file
 */
function parseChangelog(): ChangelogResponse {
  try {
    const changelogPath = join(process.cwd(), 'CHANGELOG.md')
    const content = readFileSync(changelogPath, 'utf-8')
    
    const versions: ChangelogVersion[] = []
    const lines = content.split('\n')
    
    let currentVersion: ChangelogVersion | null = null
    let currentSection: 'added' | 'changed' | 'fixed' | null = null
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Match version header: ## [1.0.0] - 2025-11-11
      const versionMatch = line.match(/^## \[([\d.]+)\]\s*-\s*(.+)$/)
      if (versionMatch) {
        // Save previous version if exists
        if (currentVersion) {
          versions.push(currentVersion)
        }
        
        // Start new version
        currentVersion = {
          version: versionMatch[1],
          date: versionMatch[2],
          added: [],
          changed: [],
          fixed: [],
          highlights: [],
        }
        currentSection = null
        continue
      }
      
      // Match release URL: [1.0.0]: https://...
      const urlMatch = line.match(/^\[([\d.]+)\]:\s*(.+)$/)
      if (urlMatch && currentVersion && currentVersion.version === urlMatch[1]) {
        currentVersion.releaseUrl = urlMatch[2]
        continue
      }
      
      // Match section headers
      if (line === '### Added') {
        currentSection = 'added'
        continue
      } else if (line === '### Changed') {
        currentSection = 'changed'
        continue
      } else if (line === '### Fixed') {
        currentSection = 'fixed'
        continue
      }
      
      // Parse list items (including nested items with 2 spaces)
      if (line.startsWith('- ') && currentVersion && currentSection) {
        const item = line.substring(2).trim()
        
        // Extract highlights (bold items or major features)
        if (item.startsWith('**') && item.includes('**')) {
          const highlightMatch = item.match(/\*\*(.+?)\*\*/)
          if (highlightMatch) {
            currentVersion.highlights.push(highlightMatch[1])
          }
        }
        
        // Add to appropriate section
        if (currentSection === 'added') {
          currentVersion.added.push(item)
        } else if (currentSection === 'changed') {
          currentVersion.changed.push(item)
        } else if (currentSection === 'fixed') {
          currentVersion.fixed.push(item)
        }
      } else if (line.startsWith('  - ') && currentVersion && currentSection) {
        // Handle nested list items (sub-items)
        const item = line.substring(4).trim()
        const section = currentVersion[currentSection]
        if (section.length > 0) {
          // Append to last item as a sub-item
          section[section.length - 1] += `\n  ${item}`
        }
      }
    }
    
    // Don't forget the last version
    if (currentVersion) {
      versions.push(currentVersion)
    }
    
    // Get latest version
    const latestVersion = versions.length > 0 ? versions[0] : null
    
    return {
      versions,
      latestVersion: latestVersion?.version || '0.0.0',
      latestDate: latestVersion?.date || '',
    }
  } catch (error) {
    console.error('Error parsing changelog:', error)
    return {
      versions: [],
      latestVersion: '0.0.0',
      latestDate: '',
    }
  }
}

/**
 * GET /api/changelog
 * Returns parsed changelog data
 */
export async function GET() {
  try {
    // Use cache if available and fresh
    const now = Date.now()
    if (cachedChangelog && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedChangelog)
    }
    
    // Parse changelog
    const changelog = parseChangelog()
    
    // Update cache
    cachedChangelog = changelog
    cacheTimestamp = now
    
    return NextResponse.json(changelog)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to parse changelog',
        versions: [],
        latestVersion: '0.0.0',
        latestDate: '',
      },
      { status: 500 }
    )
  }
}

