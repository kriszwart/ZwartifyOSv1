"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import ChangelogBadge from "../components/ChangelogBadge"

interface ChangelogVersion {
  version: string
  date: string
  added: string[]
  changed: string[]
  fixed: string[]
  highlights: string[]
  releaseUrl?: string
}

interface ChangelogData {
  versions: ChangelogVersion[]
  latestVersion: string
  latestDate: string
}

export default function ChangelogPage() {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [changelogData, setChangelogData] = useState<ChangelogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const loadChangelog = async () => {
      try {
        const response = await fetch('/api/changelog')
        if (response.ok) {
          const data = await response.json()
          setChangelogData(data)
          // Expand latest version by default
          if (data.versions.length > 0) {
            setExpandedVersion(data.versions[0].version)
          }
        }
      } catch (error) {
        console.error('Error loading changelog:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChangelog()
  }, [])

  const getColorClasses = (type: 'added' | 'changed' | 'fixed' | 'version') => {
    const colors: Record<string, string> = {
      added: "border-green-400/50 bg-green-400/5 text-green-300",
      changed: "border-cyan-400/50 bg-cyan-400/5 text-cyan-300",
      fixed: "border-yellow-400/50 bg-yellow-400/5 text-yellow-300",
      version: "border-purple-400/50 bg-purple-400/5 text-purple-300",
    }
    return colors[type] || colors.version
  }

  const isMajorVersion = (version: string): boolean => {
    const parts = version.split('.')
    return parts.length > 0 && (parts[0] !== '0' || (parts[0] === '0' && parts[1] !== '0'))
  }

  const filteredVersions = changelogData?.versions.filter(version => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      version.version.toLowerCase().includes(query) ||
      version.date.toLowerCase().includes(query) ||
      version.added.some(item => item.toLowerCase().includes(query)) ||
      version.changed.some(item => item.toLowerCase().includes(query)) ||
      version.fixed.some(item => item.toLowerCase().includes(query)) ||
      version.highlights.some(item => item.toLowerCase().includes(query))
    )
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-green-400 font-mono">Loading changelog...</div>
      </div>
    )
  }

  if (!changelogData) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-400/60 font-mono mb-4">Failed to load changelog</div>
          <Link href="/" className="text-green-400 hover:text-green-300 font-mono">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none" />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="border-b border-green-400/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              ← HOME
            </Link>
            <span className="text-green-400/50">|</span>
            <Link
              href="/roadmap"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Roadmap
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono" style={{ animation: "glitch-slow 4s infinite" }}>
              Changelog
            </h1>
            <ChangelogBadge showPulse={false} />
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/roadmap"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Roadmap
            </Link>
            <Link
              href="/agents"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Agents
            </Link>
            <Link
              href="/docs"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Docs
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              What's New
            </h2>
            <p className="text-xl text-green-300/80 max-w-3xl mx-auto mb-6">
              Track every update, feature, and improvement to ZwartifyOS
            </p>
            {changelogData.latestVersion && (
              <div className="inline-block px-6 py-3 bg-purple-400/20 border-2 border-purple-400 rounded-lg mb-6">
                <div className="text-sm font-mono text-purple-300/60 mb-1">Latest Version</div>
                <div className="text-2xl font-bold font-mono text-purple-400">
                  v{changelogData.latestVersion}
                </div>
                <div className="text-xs font-mono text-purple-300/60 mt-1">
                  {changelogData.latestDate}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search versions, features, fixes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border-2 border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400 rounded-lg"
            />
          </div>

          {/* Version Cards */}
          <div className="space-y-6">
            {filteredVersions.map((version, index) => {
              const isExpanded = expandedVersion === version.version
              const isMajor = isMajorVersion(version.version)
              
              return (
                <div key={version.version} className="relative">
                  {/* Connection Line */}
                  {index < filteredVersions.length - 1 && (
                    <div className="absolute left-8 top-24 w-0.5 h-16 bg-gradient-to-b from-green-400/50 to-transparent" />
                  )}
                  
                  <div
                    className={`border-2 rounded-lg p-6 transition-all cursor-pointer ${
                      isMajor 
                        ? "border-purple-400/50 bg-purple-400/5 text-purple-300 hover:border-purple-400 hover:bg-purple-400/10" 
                        : getColorClasses('version')
                    } ${isExpanded ? 'shadow-lg shadow-green-400/20' : ''}`}
                    onClick={() => setExpandedVersion(isExpanded ? null : version.version)}
                  >
                    <div className="flex items-start gap-6">
                      {/* Version Number & Icon */}
                      <div className="flex-shrink-0">
                        <div className={`w-16 h-16 rounded-full border-2 border-current flex items-center justify-center text-2xl bg-black/50 ${isMajor ? 'animate-pulse' : ''}`}>
                          {isMajor ? '🚀' : '📦'}
                        </div>
                        <div className="text-xs font-mono text-center mt-2 opacity-60">
                          {version.date}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-2xl font-bold font-mono ${isMajor ? 'text-purple-400' : ''}`}>
                            v{version.version}
                          </h3>
                          {isMajor && (
                            <span className="px-2 py-1 text-xs font-mono border border-purple-400/50 bg-purple-400/10 text-purple-300 rounded">
                              MAJOR
                            </span>
                          )}
                          {version.releaseUrl && (
                            <a
                              href={version.releaseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-green-400/60 hover:text-green-400 text-xs font-mono"
                            >
                              🔗 Release
                            </a>
                          )}
                        </div>

                        {/* Highlights */}
                        {version.highlights.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-2">
                              {version.highlights.slice(0, 3).map((highlight, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 text-xs font-mono bg-green-400/10 border border-green-400/30 text-green-300 rounded"
                                >
                                  {highlight}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Expandable Details */}
                        {isExpanded && (
                          <div className="mt-4 space-y-4 animate-fade-in">
                            {/* Added */}
                            {version.added.length > 0 && (
                              <div>
                                <h4 className="text-lg font-bold text-green-400 mb-2 font-mono">
                                  ✨ Added
                                </h4>
                                <ul className="space-y-2 ml-4">
                                  {version.added.map((item, idx) => (
                                    <li key={idx} className="text-sm text-green-300/90 flex items-start gap-2">
                                      <span className="text-green-400 mt-1">→</span>
                                      <div className="flex-1 prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {item}
                                        </ReactMarkdown>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Changed */}
                            {version.changed.length > 0 && (
                              <div>
                                <h4 className="text-lg font-bold text-cyan-400 mb-2 font-mono">
                                  🔄 Changed
                                </h4>
                                <ul className="space-y-2 ml-4">
                                  {version.changed.map((item, idx) => (
                                    <li key={idx} className="text-sm text-cyan-300/90 flex items-start gap-2">
                                      <span className="text-cyan-400 mt-1">→</span>
                                      <div className="flex-1 prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {item}
                                        </ReactMarkdown>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Fixed */}
                            {version.fixed.length > 0 && (
                              <div>
                                <h4 className="text-lg font-bold text-yellow-400 mb-2 font-mono">
                                  🐛 Fixed
                                </h4>
                                <ul className="space-y-2 ml-4">
                                  {version.fixed.map((item, idx) => (
                                    <li key={idx} className="text-sm text-yellow-300/90 flex items-start gap-2">
                                      <span className="text-yellow-400 mt-1">→</span>
                                      <div className="flex-1 prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {item}
                                        </ReactMarkdown>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expand Indicator */}
                      <button className="text-2xl opacity-40 hover:opacity-100 transition-opacity">
                        {isExpanded ? "−" : "+"}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredVersions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-green-400/60 font-mono">No versions found matching "{searchQuery}"</div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-green-400/30 text-center">
            <p className="text-green-400/60 font-mono text-sm mb-4">
              Follow development on GitHub
            </p>
            <Link
              href="https://github.com/kriszwart/ZwartifyOSv1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-colors font-mono"
            >
              View on GitHub →
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}

