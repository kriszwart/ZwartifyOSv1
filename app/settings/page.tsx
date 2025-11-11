"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [isSaved, setIsSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    // Load API key from localStorage
    const savedKey = localStorage.getItem('claude_api_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('claude_api_key', apiKey.trim())
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    }
  }

  const handleClear = () => {
    localStorage.removeItem('claude_api_key')
    setApiKey("")
  }

  const maskedKey = apiKey ? `${apiKey.substring(0, 7)}${'*'.repeat(Math.max(0, apiKey.length - 11))}${apiKey.substring(apiKey.length - 4)}` : ""

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none" />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="border-b border-green-400/30 p-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-green-400 hover:text-green-300 transition-colors font-mono"
          >
            ← HOME
          </Link>
          <h1 className="text-2xl font-bold font-mono" style={{ animation: "glitch-slow 4s infinite" }}>
            Settings
          </h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </header>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          {/* Important Notice */}
          <div className="bg-gradient-to-r from-green-400/20 to-cyan-400/20 border-2 border-green-400/50 p-6 rounded-lg mb-8">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🔑</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3 text-green-400">Bring Your Own API Key</h2>
                <p className="text-green-300 mb-4 leading-relaxed">
                  ZwartifyOS is <strong className="text-green-400">100% open source</strong>. To use the agents, you need to provide your own Anthropic API key.
                </p>
                <div className="bg-black/50 border border-green-400/30 p-4 rounded mb-4">
                  <h3 className="text-lg font-bold mb-2 text-green-400">Why?</h3>
                  <ul className="text-green-300/90 space-y-2 list-disc list-inside ml-2">
                    <li><strong className="text-green-400">No middlemen:</strong> You own your API key and pay Anthropic directly</li>
                    <li><strong className="text-green-400">Full transparency:</strong> See all token usage and costs in the Dashboard</li>
                    <li><strong className="text-green-400">Open source:</strong> No hidden fees or locked features</li>
                    <li><strong className="text-green-400">Your data:</strong> Your API key stays in your browser (localStorage)</li>
                  </ul>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <Link
                    href="/docs/quick-start"
                    className="px-4 py-2 bg-green-400/20 border border-green-400/50 text-green-400 font-mono text-sm hover:bg-green-400/30 transition-all rounded"
                  >
                    📖 Get API Key Guide
                  </Link>
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-cyan-400/20 border border-cyan-400/50 text-cyan-400 font-mono text-sm hover:bg-cyan-400/30 transition-all rounded"
                  >
                    🔗 Anthropic Console
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* API Key Input Section */}
          <div className="bg-black/50 border-2 border-green-400/30 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4 text-green-400">Claude API Key</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-green-300/80 mb-2">
                  Your Anthropic API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="flex-1 bg-black border-2 border-green-400/50 text-green-400 font-mono p-3 focus:outline-none focus:border-green-400 rounded-lg"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="px-4 py-2 bg-black border-2 border-green-400/50 text-green-400 font-mono text-sm hover:bg-green-400/10 transition-all rounded"
                  >
                    {showKey ? "👁️ Hide" : "👁️ Show"}
                  </button>
                </div>
                {apiKey && !showKey && (
                  <p className="text-xs text-green-400/60 font-mono mt-2">
                    {maskedKey}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={!apiKey.trim()}
                  className="px-6 py-2 bg-green-400/20 border-2 border-green-400 text-green-400 font-mono hover:bg-green-400 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  {isSaved ? "✓ Saved" : "Save API Key"}
                </button>
                {apiKey && (
                  <button
                    onClick={handleClear}
                    className="px-6 py-2 bg-red-400/20 border-2 border-red-400/50 text-red-400 font-mono hover:bg-red-400/30 transition-all rounded"
                  >
                    Clear
                  </button>
                )}
              </div>

              {isSaved && (
                <div className="bg-green-400/20 border border-green-400/50 p-3 rounded text-green-300 text-sm">
                  ✓ API key saved! It will be used for all agent interactions.
                </div>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-black/50 border border-green-400/30 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-2 text-green-400">🔒 Security</h3>
            <ul className="text-green-300/90 space-y-2 text-sm list-disc list-inside ml-2">
              <li>Your API key is stored <strong className="text-green-400">only in your browser</strong> (localStorage)</li>
              <li>It's <strong className="text-green-400">never sent to our servers</strong> except as a header in API requests</li>
              <li>You can clear it anytime using the "Clear" button</li>
              <li>Never share your API key with anyone</li>
            </ul>
          </div>

          {/* Usage Info */}
          <div className="bg-black/50 border border-green-400/30 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2 text-green-400">💡 How It Works</h3>
            <p className="text-green-300/90 text-sm mb-3">
              Once you save your API key, it will be automatically included in all agent API calls. You can:
            </p>
            <ul className="text-green-300/90 space-y-2 text-sm list-disc list-inside ml-2">
              <li>Use any agent from the <Link href="/agents" className="text-green-400 hover:underline">Agents page</Link></li>
              <li>Create new agents with <Link href="/create-agent" className="text-green-400 hover:underline">G-SAC</Link></li>
              <li>Test agents in the <Link href="/playground" className="text-green-400 hover:underline">Playground</Link></li>
              <li>View your token usage and costs in the <Link href="/dashboard" className="text-green-400 hover:underline">Dashboard</Link></li>
            </ul>
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-green-400/30 text-center text-sm text-green-500 opacity-60">
            <Link href="/" className="hover:text-green-400 transition-colors">
              ← Back to Home
            </Link>
            {" • "}
            <Link href="/docs" className="hover:text-green-400 transition-colors">
              Documentation
            </Link>
            {" • "}
            <Link href="/dashboard" className="hover:text-green-400 transition-colors">
              Dashboard
            </Link>
          </footer>
        </main>
      </div>
    </div>
  )
}

