"use client"

export default function PlatformOverview() {
  const platformComponents = [
    { name: "Agents", icon: "🤖", color: "green" },
    { name: "Skills", icon: "🧠", color: "purple" },
    { name: "RAG", icon: "📚", color: "cyan" },
    { name: "Memory", icon: "💾", color: "yellow" },
    { name: "Scheduling", icon: "⏰", color: "blue" },
    { name: "Token Tracking", icon: "📊", color: "pink" },
  ]

  return (
    <div className="my-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {platformComponents.map((component) => (
          <div
            key={component.name}
            className="bg-black/50 border-2 border-green-400/30 p-4 rounded-lg hover:border-green-400/60 transition-all text-center"
          >
            <div className="text-4xl mb-2">{component.icon}</div>
            <div className="text-green-400 font-mono font-semibold text-sm">{component.name}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-gradient-to-r from-green-400/10 to-purple-400/10 border border-green-400/30 rounded-lg">
        <div className="text-center">
          <div className="text-green-400 font-bold text-lg mb-2">One Person. Full System. Zero Lock-In.</div>
          <div className="text-green-300/80 text-sm font-mono">
            MIT Licensed • You Own Your Agents • You Own Your Data
          </div>
        </div>
      </div>
    </div>
  )
}

