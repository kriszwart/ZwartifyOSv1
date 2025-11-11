"use client"

import Link from "next/link"

export default function MemoryPage() {
  const memoryTypes = [
    {
      name: "Short-Term Memory",
      icon: "⚡",
      description: "Fast, ephemeral storage for conversation context",
      provider: "Redis",
      useCases: [
        "Session-based conversations",
        "Temporary context storage",
        "Real-time message history",
        "Conversation state management"
      ],
      benefits: [
        "Ultra-fast read/write",
        "Low latency",
        "Perfect for active sessions",
        "Automatic expiration"
      ],
      color: "yellow"
    },
    {
      name: "Long-Term Memory",
      icon: "🧠",
      description: "Persistent, searchable memory for agent learning",
      provider: "Pinecone",
      useCases: [
        "Cross-session learning",
        "Agent knowledge base",
        "Semantic search",
        "Pattern recognition"
      ],
      benefits: [
        "Vector search capabilities",
        "Semantic understanding",
        "Long-term retention",
        "Scalable storage"
      ],
      color: "purple"
    }
  ]

  const features = [
    {
      title: "Bring Your Own Memory",
      description: "Use Redis, Pinecone, or any compatible memory provider. No vendor lock-in.",
      icon: "🔌"
    },
    {
      title: "Dual Memory System",
      description: "Short-term for conversations, long-term for learning. Best of both worlds.",
      icon: "⚡"
    },
    {
      title: "Context-Aware Agents",
      description: "Agents remember previous conversations and learn from interactions.",
      icon: "💭"
    },
    {
      title: "Semantic Search",
      description: "Find relevant memories using meaning, not just keywords.",
      icon: "🔍"
    },
    {
      title: "Automatic Management",
      description: "Memory is automatically stored and retrieved based on relevance.",
      icon: "🤖"
    },
    {
      title: "Privacy Control",
      description: "Control what agents remember and how long data is retained.",
      icon: "🔒"
    }
  ]

  const setupSteps = [
    {
      step: 1,
      title: "Choose Your Memory Provider",
      description: "Select Redis for short-term or Pinecone for long-term memory (or both!)",
      code: `# Short-term memory (Redis)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password

# Long-term memory (Pinecone)
PINECONE_API_KEY=your_api_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=zwartify-memory`
    },
    {
      step: 2,
      title: "Configure in Environment",
      description: "Set environment variables for your chosen memory provider",
      code: `# .env.local
MEMORY_TYPE=dual  # or 'redis', 'pinecone', 'none'
ENABLE_MEMORY=true`
    },
    {
      step: 3,
      title: "Agents Use Memory Automatically",
      description: "Once configured, agents automatically store and retrieve memories",
      code: `// No code changes needed!
// Agents automatically use memory when enabled`
    }
  ]

  const comparisons = [
    {
      feature: "Short-Term Memory",
      without: "Context lost between sessions",
      with: "Conversations persist during active sessions",
      winner: "with"
    },
    {
      feature: "Long-Term Memory",
      without: "Agents start fresh every time",
      with: "Agents learn and remember across sessions",
      winner: "with"
    },
    {
      feature: "User Experience",
      without: "Repeat information every interaction",
      with: "Agents remember preferences and context",
      winner: "with"
    },
    {
      feature: "Agent Intelligence",
      without: "Static responses",
      with: "Evolving, learning behaviour",
      winner: "with"
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      yellow: "border-yellow-400/50 bg-yellow-400/5 text-yellow-300 hover:border-yellow-400 hover:bg-yellow-400/10",
      purple: "border-purple-400/50 bg-purple-400/5 text-purple-300 hover:border-purple-400 hover:bg-purple-400/10",
      green: "border-green-400/50 bg-green-400/5 text-green-300 hover:border-green-400 hover:bg-green-400/10",
      cyan: "border-cyan-400/50 bg-cyan-400/5 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-400/10"
    }
    return colors[color] || colors.green
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
              href="/docs"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Docs
            </Link>
          </div>
          <h1 className="text-2xl font-bold font-mono">Agent Memory</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/agents"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Agents
            </Link>
            <Link
              href="/playground"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Playground
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Agent Memory System
            </h2>
            <p className="text-xl text-green-300/80 max-w-3xl mx-auto mb-6">
              Bring your own memory provider. Redis for short-term, Pinecone for long-term. 
              Agents that remember and learn.
            </p>
            <p className="text-lg text-green-400/60 max-w-2xl mx-auto mb-8">
              Currently in development. Configure your own Redis or Pinecone instance to enable 
              persistent, context-aware agent conversations.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/docs"
                className="px-8 py-4 border-2 border-green-400 bg-green-400/20 text-green-300 hover:bg-green-400/30 transition-colors font-mono font-bold"
              >
                View Documentation →
              </Link>
              <Link
                href="/playground"
                className="px-8 py-4 border-2 border-purple-400 text-purple-400 hover:bg-purple-400/10 transition-colors font-mono"
              >
                Try Playground
              </Link>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="bg-gradient-to-r from-yellow-400/10 to-purple-400/10 border-2 border-yellow-400/50 p-6 rounded-lg mb-12 text-center">
            <div className="text-3xl mb-2">🚧</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Memory System Coming Soon</h3>
            <p className="text-green-300/80">
              The memory system is currently in development. You'll be able to connect your own 
              Redis or Pinecone instance for agent memory. Stay tuned for updates!
            </p>
          </div>

          {/* Memory Types */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Memory Types</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {memoryTypes.map((type, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-lg p-6 transition-all ${getColorClasses(type.color)}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">{type.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">{type.name}</h3>
                      <p className="text-sm opacity-80 mb-2">{type.description}</p>
                      <div className="px-3 py-1 bg-black/50 border border-current/30 rounded inline-block">
                        <span className="text-xs font-mono">{type.provider}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xs font-mono uppercase opacity-60 mb-2">Use Cases:</div>
                    <ul className="space-y-1 text-sm">
                      {type.useCases.map((useCase, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">→</span>
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-current/20">
                    <div className="text-xs font-mono uppercase opacity-60 mb-2">Benefits:</div>
                    <div className="flex flex-wrap gap-2">
                      {type.benefits.map((benefit, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-black/50 border border-current/30 rounded font-mono"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Memory Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-black/50 border-2 border-green-400/30 p-6 rounded-lg hover:border-green-400/50 transition-all"
                >
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-green-400 mb-2">{feature.title}</h3>
                  <p className="text-green-300/70 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Steps */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {setupSteps.map((step, idx) => (
                <div key={idx} className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg">
                  <div className="text-4xl mb-4 text-center">{step.step}️⃣</div>
                  <h3 className="text-xl font-bold text-green-400 mb-3 text-center">{step.title}</h3>
                  <p className="text-green-300/70 text-sm mb-4 text-center">{step.description}</p>
                  <div className="bg-black border border-green-400/30 p-3 rounded font-mono text-xs text-green-400/90 whitespace-pre-wrap overflow-x-auto">
                    {step.code}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison */}
          <div className="bg-gradient-to-r from-purple-400/10 via-cyan-400/10 to-green-400/10 border-2 border-purple-400/50 p-8 rounded-lg mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">With vs Without Memory</h2>
            <div className="space-y-4">
              {comparisons.map((comp, idx) => (
                <div
                  key={idx}
                  className="bg-black/50 border border-green-400/30 p-6 rounded-lg"
                >
                  <div className="grid md:grid-cols-3 gap-4 items-center">
                    <div className="font-bold text-green-400">{comp.feature}</div>
                    <div className={`text-sm ${comp.winner === 'without' ? 'text-green-400' : 'text-green-300/60'}`}>
                      <div className="font-mono text-xs opacity-60 mb-1">Without Memory:</div>
                      {comp.without}
                    </div>
                    <div className={`text-sm ${comp.winner === 'with' ? 'text-green-400 font-bold' : 'text-green-300/60'}`}>
                      <div className="font-mono text-xs opacity-60 mb-1">With Memory:</div>
                      {comp.with}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Details */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Technical Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-black/50 border-2 border-yellow-400/50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Redis (Short-Term)</h3>
                <ul className="space-y-2 text-sm text-green-300/80">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Stores conversation context in memory</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Fast read/write operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Automatic expiration (configurable TTL)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Perfect for session-based storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Low latency, high throughput</span>
                  </li>
                </ul>
              </div>

              <div className="bg-black/50 border-2 border-purple-400/50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-purple-400 mb-4">Pinecone (Long-Term)</h3>
                <ul className="space-y-2 text-sm text-green-300/80">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Vector database for semantic search</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Stores embeddings of conversations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Finds relevant memories by meaning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Persistent across sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>Scales to millions of memories</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-green-400/10 via-purple-400/10 to-cyan-400/10 border-2 border-green-400/50 p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Enable Memory?</h2>
            <p className="text-lg text-green-300/80 mb-6 max-w-2xl mx-auto">
              Once the memory system is available, configure your Redis or Pinecone instance 
              and agents will automatically use memory for context-aware conversations.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/docs"
                className="px-8 py-4 border-2 border-green-400 bg-green-400/20 text-green-300 hover:bg-green-400/30 transition-colors font-mono font-bold"
              >
                View Documentation
              </Link>
              <Link
                href="/playground"
                className="px-8 py-4 border-2 border-purple-400 text-purple-400 hover:bg-purple-400/10 transition-colors font-mono"
              >
                Try Playground
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

