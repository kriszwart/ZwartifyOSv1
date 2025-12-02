/**
 * Platform Detector
 * 
 * Detects which platforms are needed based on user requests
 * Used by G-SAC to auto-configure MCP servers
 */

import { mcpRegistry, MCPServerConfig } from './registry'

export interface PlatformRequirement {
  platform: string
  confidence: number // 0-1
  keywords: string[]
}

/**
 * Detect platform requirements from a text description
 */
export function detectPlatformRequirements(text: string): PlatformRequirement[] {
  const lowerText = text.toLowerCase()
  const requirements: PlatformRequirement[] = []

  // Platform keyword mappings
  const platformKeywords: Record<string, string[]> = {
    slack: ['slack', 'workspace', 'channel', 'team chat', 'team communication'],
    discord: ['discord', 'server', 'guild', 'community', 'voice channel'],
    twitter: ['twitter', 'x.com', 'tweet', 'tweeting', 'twitter api', 'social media'],
    linkedin: ['linkedin', 'linked in', 'professional network', 'linkedin post'],
    email: ['email', 'mail', 'send email', 'email campaign', 'inbox'],
    calendar: ['calendar', 'schedule', 'meeting', 'appointment', 'event'],
    crm: ['crm', 'salesforce', 'hubspot', 'pipedrive', 'lead', 'contact', 'deal'],
    github: ['github', 'git', 'repository', 'repo', 'pull request', 'issue'],
    google: ['google sheets', 'google docs', 'spreadsheet', 'gsheet'],
    notion: ['notion', 'notion page', 'notion database'],
    jira: ['jira', 'ticket', 'bug', 'task management'],
  }

  for (const [platform, keywords] of Object.entries(platformKeywords)) {
    const matches = keywords.filter(keyword => lowerText.includes(keyword))
    if (matches.length > 0) {
      // Calculate confidence based on number of keyword matches
      const confidence = Math.min(0.5 + (matches.length * 0.15), 1.0)
      requirements.push({
        platform,
        confidence,
        keywords: matches,
      })
    }
  }

  // Sort by confidence (highest first)
  return requirements.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Get MCP server configurations for detected platforms
 */
export function getMCPConfigsForPlatforms(
  requirements: PlatformRequirement[],
  minConfidence: number = 0.5
): MCPServerConfig[] {
  const configs: MCPServerConfig[] = []
  const addedUrls = new Set<string>()

  for (const req of requirements) {
    if (req.confidence < minConfidence) continue

    const servers = mcpRegistry.getServersForPlatform(req.platform)
    for (const server of servers) {
      if (!addedUrls.has(server.serverUrl)) {
        configs.push(server)
        addedUrls.add(server.serverUrl)
      }
    }
  }

  return configs
}

/**
 * Auto-configure MCP servers for an agent based on its description/prompt
 */
export function autoConfigureMCP(agentDescription: string, agentPrompt?: string): string[] {
  const fullText = `${agentDescription} ${agentPrompt || ''}`
  const requirements = detectPlatformRequirements(fullText)
  const configs = getMCPConfigsForPlatforms(requirements)
  
  return configs.map(c => c.serverUrl)
}

