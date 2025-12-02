"use client"

import { useState } from "react"
import Link from "next/link"
import { ExportFormat, generateEmbedCode, generateInstallInstructions } from "../../backend/export/agentExporter"

interface PublicAgent {
  id: string
  name: string
  description?: string
  version: string
  category?: string
  tags?: string[]
  exportFormats?: string[]
  installCount?: number
  createdAt: string
  updatedAt: string
  isPublic?: boolean
  isExportable?: boolean
}

interface AgentPreviewModalProps {
  agent: PublicAgent
  onClose: () => void
  onInstall?: (agentId: string) => void
}

export default function AgentPreviewModal({ agent, onClose, onInstall }: AgentPreviewModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('widget')
  const [copied, setCopied] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const apiUrl = `${baseUrl}/api/agents/${agent.id}`
  
  const embedCode = generateEmbedCode(agent as any, apiUrl, selectedFormat)
  const installInstructions = generateInstallInstructions(agent as any, selectedFormat)

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
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data.files, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename || `zwartify-${agent.id}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else {
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

  const handleInstall = () => {
    if (onInstall) {
      onInstall(agent.id)
    }
  }

  const availableFormats = agent.exportFormats || ['wordpress', 'widget', 'api', 'npm']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-black border-2 border-green-400/50 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-green-400/30">
          <div>
            <h2 className="text-2xl font-bold text-green-400 font-mono">{agent.name}</h2>
            {agent.description && (
              <p className="text-green-300/70 text-sm mt-1">{agent.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-green-400/60 hover:text-green-400 text-2xl font-mono"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Agent Info */}
          <div className="bg-black/50 border border-green-400/30 p-4 rounded-lg">
            <div className="flex flex-wrap gap-2 mb-3">
              {agent.category && (
                <span className="px-2 py-1 text-xs bg-green-400/10 text-green-400 border border-green-400/30 rounded font-mono">
                  {agent.category}
                </span>
              )}
              {agent.tags && agent.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="px-2 py-1 text-xs bg-green-400/5 text-green-400/70 border border-green-400/20 rounded font-mono">
                  {tag}
                </span>
              ))}
              {agent.installCount && agent.installCount > 0 && (
                <span className="px-2 py-1 text-xs bg-blue-400/10 text-blue-400 border border-blue-400/30 rounded font-mono">
                  {agent.installCount} installs
                </span>
              )}
            </div>
            <div className="text-xs text-green-400/60 font-mono">
              Version: {agent.version} • Created: {new Date(agent.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Export Format Selector */}
          <div>
            <h3 className="text-lg font-bold text-green-400 mb-4 font-mono">Export Format</h3>
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

          {/* Embed Code */}
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

          {/* Installation Instructions */}
          <div className="bg-black/50 border-2 border-green-400/30 p-4 rounded-lg">
            <h4 className="text-sm font-bold text-green-400 font-mono uppercase mb-2">Installation Instructions</h4>
            <div className="text-sm text-green-300/80 font-mono whitespace-pre-wrap">
              {installInstructions}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-green-400/30 bg-black/50">
          <Link
            href={`/agent/${agent.id}`}
            className="px-4 py-2 bg-green-400/10 text-green-400 border border-green-400/30 rounded font-mono text-sm hover:bg-green-400/20 transition-colors"
          >
            View Details
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-6 py-2 bg-green-400/20 text-green-400 border-2 border-green-400/50 rounded-lg font-mono font-bold hover:bg-green-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : `Download ${selectedFormat.charAt(0).toUpperCase() + selectedFormat.slice(1)}`}
            </button>
            {onInstall && (
              <button
                onClick={handleInstall}
                className="px-6 py-2 bg-blue-400/20 text-blue-400 border-2 border-blue-400/50 rounded-lg font-mono font-bold hover:bg-blue-400/30 transition-colors"
              >
                Install
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}




