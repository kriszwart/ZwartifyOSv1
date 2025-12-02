"use client"

import { useState } from "react"
import { AgentDefinition } from "../../backend/db/types"
import { ExportFormat, generateEmbedCode, generateInstallInstructions, getAvailableFormats } from "../../backend/export/agentExporter"

interface AgentExportTabProps {
  agent: AgentDefinition
}

export default function AgentExportTab({ agent }: AgentExportTabProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('widget')
  const [copied, setCopied] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const availableFormats = getAvailableFormats(agent)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const apiUrl = `${baseUrl}/api/agents/${agent.id}`
  
  const embedCode = generateEmbedCode(agent, apiUrl, selectedFormat)
  const installInstructions = generateInstallInstructions(agent, selectedFormat)

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch(`/api/agents/${agent.id}/export?format=${selectedFormat}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      if (selectedFormat === 'wordpress') {
        // WordPress returns JSON with file structure
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data.files, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename || `zwartify-${agent.id}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        // Other formats return the file directly
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `zwartify-${agent.id}-${selectedFormat}`
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export agent. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-green-400 mb-4">Export Format</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['wordpress', 'widget', 'api', 'npm'] as ExportFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => setSelectedFormat(format)}
              disabled={!availableFormats.includes(format)}
              className={`px-4 py-3 rounded-lg border-2 font-mono text-sm transition-all ${
                selectedFormat === format
                  ? 'border-green-400 bg-green-400/20 text-green-400'
                  : availableFormats.includes(format)
                  ? 'border-green-400/30 bg-green-400/5 text-green-400/70 hover:border-green-400/50 hover:bg-green-400/10'
                  : 'border-gray-600 bg-gray-800/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              {format.charAt(0).toUpperCase() + format.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-black/50 border-2 border-green-400/30 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-green-400 font-mono uppercase">Embed Code</h4>
          <button
            onClick={() => handleCopy(embedCode, 'embed')}
            className="px-3 py-1 text-xs bg-green-400/10 text-green-400 border border-green-400/30 rounded font-mono hover:bg-green-400/20 transition-colors"
          >
            {copied === 'embed' ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <pre className="text-xs text-green-300/80 font-mono bg-black/50 p-3 rounded overflow-x-auto">
          {embedCode}
        </pre>
      </div>

      <div className="bg-black/50 border-2 border-green-400/30 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-green-400 font-mono uppercase">Installation Instructions</h4>
        </div>
        <div className="text-sm text-green-300/80 font-mono whitespace-pre-wrap">
          {installInstructions}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-6 py-3 bg-green-400/20 text-green-400 border-2 border-green-400/50 rounded-lg font-mono font-bold hover:bg-green-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? 'Exporting...' : `Download ${selectedFormat.charAt(0).toUpperCase() + selectedFormat.slice(1)} Package`}
        </button>
      </div>

      {/* Export Settings */}
      <div className="bg-black/50 border-2 border-green-400/30 p-4 rounded-lg">
        <h4 className="text-sm font-bold text-green-400 font-mono uppercase mb-3">Export Settings</h4>
        <div className="space-y-2 text-sm text-green-300/80 font-mono">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={agent.isPublic || false}
              disabled
              className="w-4 h-4"
            />
            <label>Make Public (show in marketplace)</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={agent.isExportable !== false}
              disabled
              className="w-4 h-4"
            />
            <label>Allow Export</label>
          </div>
          {agent.category && (
            <div>
              <span className="text-green-400/60">Category: </span>
              <span>{agent.category}</span>
            </div>
          )}
          {agent.tags && agent.tags.length > 0 && (
            <div>
              <span className="text-green-400/60">Tags: </span>
              <span>{agent.tags.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



