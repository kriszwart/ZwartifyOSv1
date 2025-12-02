"use client"

export default function SkillsComparison() {
  return (
    <div className="grid md:grid-cols-2 gap-6 my-6">
      {/* Search Side */}
      <div className="bg-red-400/10 border-2 border-red-400/30 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🔍</div>
          <h3 className="text-xl font-bold text-red-400">Search / Retrieval</h3>
        </div>
        <ul className="space-y-2 text-red-300/80 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-red-400">→</span>
            <span>Returns results</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">→</span>
            <span>Shows information</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">→</span>
            <span>No analysis</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">→</span>
            <span>No synthesis</span>
          </li>
        </ul>
      </div>

      {/* Skills Side */}
      <div className="bg-green-400/10 border-2 border-green-400/50 p-6 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.2)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🧠</div>
          <h3 className="text-xl font-bold text-green-400">Skills / Intelligence</h3>
        </div>
        <ul className="space-y-2 text-green-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Provides analysis</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Synthesizes insights</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Runs real tools</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Executes reasoning</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

