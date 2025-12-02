"use client"

import Link from "next/link"

export default function VisualBuilderPreview() {
  return (
    <div className="my-6">
      <div className="bg-black/70 border-2 border-cyan-400/50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎨</div>
            <h3 className="text-xl font-bold text-cyan-400">Visual Builder</h3>
          </div>
          <Link
            href="/create-agent-visual"
            className="px-4 py-2 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 transition-all font-mono text-sm"
          >
            Open Visual Builder →
          </Link>
        </div>
        <div className="space-y-3 text-green-300/80 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>See the architecture visually</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>See the skills and data flow</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>Test and debug workflows</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>Export code and deploy</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-cyan-400/10 border border-cyan-400/30 rounded text-xs text-cyan-300/80 font-mono">
          Code-first, visual-assisted. The Visual Builder helps you test and debug, then you export and deploy.
        </div>
      </div>
    </div>
  )
}

