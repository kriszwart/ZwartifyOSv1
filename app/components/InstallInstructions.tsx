"use client"

import { useState } from "react"
import { ExportFormat } from "../../backend/export/agentExporter"

interface InstallInstructionsProps {
  format: ExportFormat
  agentId: string
  agentName: string
  apiUrl?: string
}

export default function InstallInstructions({
  format,
  agentId,
  agentName,
  apiUrl = '',
}: InstallInstructionsProps) {
  const [copied, setCopied] = useState(false)

  const getInstructions = () => {
    switch (format) {
      case 'wordpress':
        return {
          title: 'WordPress Installation',
          steps: [
            'Download the WordPress plugin ZIP file',
            'Go to WordPress Admin → Plugins → Add New',
            'Click "Upload Plugin" and select the ZIP file',
            'Activate the plugin',
            `Use the shortcode [zwartify_agent id="${agentId}"] in any post or page`,
            'Or add the widget from Appearance → Widgets',
          ],
          code: `[zwartify_agent id="${agentId}"]`,
        }
      case 'widget':
        return {
          title: 'Widget Installation',
          steps: [
            'Copy the embed code provided',
            'Paste it into your HTML where you want the agent to appear',
            'The widget will automatically load and connect to the agent',
            `Customize styling by adding CSS targeting #zwartify-widget-${agentId}`,
          ],
          code: `<script src="${apiUrl}/widget.js"></script>
<script>
  ZwartifyWidget.init({
    agentId: '${agentId}',
    containerId: 'zwartify-widget-${agentId}'
  });
</script>
<div id="zwartify-widget-${agentId}"></div>`,
        }
      case 'api':
        return {
          title: 'API Package Installation',
          steps: [
            'Download the API package',
            'Extract and configure environment variables (see .env.example)',
            'Deploy to your hosting platform:',
            '  - Docker: docker build -t agent . && docker run -p 3000:3000 agent',
            '  - Vercel: vercel deploy',
            '  - Netlify: netlify deploy',
            'Use the API endpoint to interact with the agent',
            'See README.md in the package for detailed setup instructions',
          ],
          code: `// API Endpoint: ${apiUrl}
fetch('${apiUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: 'Your message here' })
})`,
        }
      case 'npm':
        return {
          title: 'NPM Package Installation',
          steps: [
            `Install the package: npm install @zwartify/agent-${agentId}`,
            `Import in your code: import { ${agentName.replace(/[^a-zA-Z0-9]/g, '')} } from '@zwartify/agent-${agentId}'`,
            'Use the agent in your application',
            'See package README for usage examples',
          ],
          code: `npm install @zwartify/agent-${agentId}`,
        }
      default:
        return {
          title: 'Installation',
          steps: ['Installation instructions not available for this format.'],
          code: '',
        }
    }
  }

  const instructions = getInstructions()

  const handleCopy = () => {
    if (instructions.code) {
      navigator.clipboard.writeText(instructions.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-green-400 font-mono">{instructions.title}</h3>
      
      <div className="bg-black/50 border border-green-400/30 p-4 rounded-lg">
        <h4 className="text-sm font-bold text-green-400/80 font-mono mb-3 uppercase">Steps</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-green-300/80 font-mono">
          {instructions.steps.map((step, index) => (
            <li key={index} className="pl-2">{step}</li>
          ))}
        </ol>
      </div>

      {instructions.code && (
        <div className="bg-black/50 border border-green-400/30 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-green-400/80 font-mono uppercase">Code</h4>
            <button
              onClick={handleCopy}
              className="px-3 py-1 text-xs bg-green-400/10 text-green-400 border border-green-400/30 rounded font-mono hover:bg-green-400/20 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre className="text-xs text-green-300/80 font-mono bg-black/50 p-3 rounded overflow-x-auto">
            {instructions.code}
          </pre>
        </div>
      )}
    </div>
  )
}



