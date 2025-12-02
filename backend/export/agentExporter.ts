/**
 * Agent Exporter
 * 
 * Main utility for exporting agents in various formats
 */

import { AgentDefinition } from '../db/types'
import { exportAsWordPressPlugin } from './formats/wordpressPlugin'
import { exportAsWidget } from './formats/standaloneWidget'
import { exportAsAPIPackage } from './formats/apiPackage'
import { exportAsNPMPackage } from './formats/npmPackage'

export type ExportFormat = 'wordpress' | 'widget' | 'api' | 'npm'

export interface ExportResult {
  format: ExportFormat
  content: string | Buffer
  mimeType: string
  filename: string
  embedCode?: string
  installInstructions?: string
}

/**
 * Export agent in specified format
 */
export async function exportAgent(
  agent: AgentDefinition,
  format: ExportFormat,
  apiUrl?: string
): Promise<ExportResult> {
  // Default API URL if not provided
  const baseUrl = apiUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const agentApiUrl = `${baseUrl}/api/agents/${agent.id}`

  switch (format) {
    case 'wordpress':
      return exportAsWordPressPlugin(agent, agentApiUrl)
    case 'widget':
      return exportAsWidget(agent, agentApiUrl)
    case 'api':
      return exportAsAPIPackage(agent, agentApiUrl)
    case 'npm':
      return exportAsNPMPackage(agent, agentApiUrl)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Generate embed code for agent
 */
export function generateEmbedCode(
  agent: AgentDefinition,
  apiUrl: string,
  format: ExportFormat
): string {
  const widgetUrl = `${apiUrl}/widget.js`
  
  switch (format) {
    case 'widget':
      return `<script src="${widgetUrl}"></script>
<script>
  ZwartifyWidget.init({
    agentId: '${agent.id}',
    containerId: 'zwartify-widget-${agent.id}'
  });
</script>
<div id="zwartify-widget-${agent.id}"></div>`
    
    case 'wordpress':
      return `[zwartify_agent id="${agent.id}"]`
    
    case 'api':
      return `// API Endpoint: ${apiUrl}
// Use with fetch or your HTTP client
fetch('${apiUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: 'Your message here' })
})`
    
    case 'npm':
      return `npm install @zwartify/agent-${agent.id}`
    
    default:
      return ''
  }
}

/**
 * Generate installation instructions
 */
export function generateInstallInstructions(
  agent: AgentDefinition,
  format: ExportFormat
): string {
  switch (format) {
    case 'wordpress':
      return `1. Download the WordPress plugin ZIP file
2. Go to WordPress Admin → Plugins → Add New
3. Click "Upload Plugin" and select the ZIP file
4. Activate the plugin
5. Use the shortcode [zwartify_agent id="${agent.id}"] in any post or page
6. Or add the widget from Appearance → Widgets`
    
    case 'widget':
      return `1. Copy the embed code provided
2. Paste it into your HTML where you want the agent to appear
3. The widget will automatically load and connect to the agent
4. Customize styling by adding CSS targeting #zwartify-widget-${agent.id}`
    
    case 'api':
      return `1. Download the API package
2. Extract and configure environment variables
3. Deploy to your hosting platform (Docker, Vercel, Netlify, etc.)
4. Use the API endpoint to interact with the agent
5. See README.md in the package for detailed setup instructions`
    
    case 'npm':
      return `1. Install the package: npm install @zwartify/agent-${agent.id}
2. Import in your code: import { ${agent.name} } from '@zwartify/agent-${agent.id}'
3. Use the agent in your application
4. See package README for usage examples`
    
    default:
      return 'Installation instructions not available for this format.'
  }
}

/**
 * Get all available export formats for an agent
 */
export function getAvailableFormats(agent: AgentDefinition): ExportFormat[] {
  // If agent has specific export formats configured, use those
  if (agent.exportFormats && agent.exportFormats.length > 0) {
    return agent.exportFormats as ExportFormat[]
  }
  
  // Default: all formats available
  return ['wordpress', 'widget', 'api', 'npm']
}

/**
 * Check if agent can be exported
 */
export function canExportAgent(agent: AgentDefinition): boolean {
  return agent.isExportable !== false // Default to true if not set
}




