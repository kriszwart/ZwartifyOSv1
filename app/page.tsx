"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"

export const dynamic = 'force-dynamic'

export default function Home() {
  const [matrixColumns, setMatrixColumns] = useState<Array<{id: number, left: number, duration: number, delay: number, chars: string}>>([])
  const [terminalVisible, setTerminalVisible] = useState(false)
  const [terminalInput, setTerminalInput] = useState("")
  const [terminalHistory, setTerminalHistory] = useState<string[]>([])
  const [glitchActive, setGlitchActive] = useState(false)
  const [screenTear, setScreenTear] = useState(false)
  const [quantumParticles, setQuantumParticles] = useState<Array<{id: number, x: number, y: number, teleporting: boolean, jitterDuration: number}>>([])
  const [sparkles, setSparkles] = useState<Array<{id: number, left: number, top: number, delay: number, colorClass: string, shadowColor: string}>>([])
  const [calendarDate, setCalendarDate] = useState<string>("")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cursorTrail, setCursorTrail] = useState<Array<{x: number, y: number, id: number, timestamp: number}>>([])
  const [showStaticNoise, setShowStaticNoise] = useState(false)
  const [showTerminalHint, setShowTerminalHint] = useState(false)
  const [descriptionHasMutation, setDescriptionHasMutation] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  
  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  // Calculate different calendar dates and rotate through them
  useEffect(() => {
    const birthDate = new Date("2025-10-31")
    
    const formats = [
      // Gregorian (default)
      `Born October 31st, 2025`,
      
      // ISO format
      `Born 2025-10-31`,
      
      // Different regional formats
      `Born 31 October 2025`, // European
      `Born Oct 31, 2025`, // US short
      `Born 2025年10月31日`, // Chinese
      
      // Unix timestamp
      `Born ${Math.floor(birthDate.getTime() / 1000)}`,
      
      // Day of year
      `Born day ${Math.floor((birthDate.getTime() - new Date(birthDate.getFullYear(), 0, 0).getTime()) / 86400000)} of 2025`,
      
      // Julian day (approximate)
      `Born Julian day ${Math.floor(birthDate.getTime() / 86400000) + 2440587.5}`,
      
      // Week number
      `Born week ${getWeekNumber(birthDate)} of 2025`,
      
      // Zodiac/Temporal
      `Born Scorpio season, 2025`,
      `Born Samhain eve, 2025`,
    ]
    
    // Rotate through formats every 3 seconds
    let currentIndex = 0
    setCalendarDate(formats[currentIndex])
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % formats.length
      setCalendarDate(formats[currentIndex])
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  // Generate matrix columns on mount
  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~"
    const columns = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 15 + Math.random() * 20, // Random 15-35s
      delay: Math.random() * 5,
      chars: Array.from({ length: 20 + Math.floor(Math.random() * 15) }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('\n')
    }))
    setMatrixColumns(columns)
  }, [])

  // Initialize quantum particles
  useEffect(() => {
    const particles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      teleporting: false,
      jitterDuration: 0.5 + Math.random() * 0.5 // Pre-calculate animation duration
    }))
    setQuantumParticles(particles)
  }, [])

  // Initialize sparkles once
  useEffect(() => {
    const sparkleArray = Array.from({ length: 25 }, (_, i) => {
      const randomMutation = Math.random()
      let colorClass = 'bg-green-400'
      let shadowColor = '#00ff00'

      if (randomMutation > 0.85) {
        colorClass = 'bg-cyan-400'
        shadowColor = '#00ffff'
      } else if (randomMutation > 0.70) {
        colorClass = 'bg-pink-500'
        shadowColor = '#ff00ff'
      }

      return {
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        colorClass,
        shadowColor
      }
    })
    setSparkles(sparkleArray)
  }, [])

  // Random quantum particle teleportation
  useEffect(() => {
    const teleportInterval = setInterval(() => {
      setQuantumParticles(prev => {
        const newParticles = [...prev]
        const randomIndex = Math.floor(Math.random() * newParticles.length)
        newParticles[randomIndex] = {
          ...newParticles[randomIndex],
          teleporting: true,
          x: Math.random() * 100,
          y: Math.random() * 100
        }
        setTimeout(() => {
          setQuantumParticles(p => {
            const updated = [...p]
            updated[randomIndex] = { ...updated[randomIndex], teleporting: false }
            return updated
          })
        }, 1000)
        return newParticles
      })
    }, 2000 + Math.random() * 3000) // Random 2-5s

    return () => clearInterval(teleportInterval)
  }, [])

  // Random RGB glitch bursts
  useEffect(() => {
    const triggerGlitch = () => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 100)

      // Schedule next glitch at random interval
      const nextGlitch = 3000 + Math.random() * 7000 // 3-10 seconds
      setTimeout(triggerGlitch, nextGlitch)
    }

    const initialDelay = setTimeout(triggerGlitch, 2000)
    return () => clearTimeout(initialDelay)
  }, [])

  // Random screen tear effect
  useEffect(() => {
    const triggerTear = () => {
      setScreenTear(true)
      setTimeout(() => setScreenTear(false), 200)

      // Schedule next tear at random interval
      const nextTear = 5000 + Math.random() * 10000 // 5-15 seconds
      setTimeout(triggerTear, nextTear)
    }

    const initialDelay = setTimeout(triggerTear, 4000)
    return () => clearTimeout(initialDelay)
  }, [])

  // Initialize probabilistic UI elements once
  useEffect(() => {
    setShowStaticNoise(Math.random() > 0.3)
    setShowTerminalHint(Math.random() > 0.5)
    setDescriptionHasMutation(Math.random() > 0.7)
  }, [])

  // Mouse follow effects
  useEffect(() => {
    let lastMouseUpdate = 0
    
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      // Throttle mouse updates to ~60fps for performance
      if (now - lastMouseUpdate < 16) {
        return
      }
      lastMouseUpdate = now
      
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      // Add to trail (keep last 25 points for smooth effect)
      setCursorTrail(prev => {
        const newTrail = [...prev.slice(-24), { x: e.clientX, y: e.clientY, id: Date.now(), timestamp: now }]
        return newTrail
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    // Cleanup trail particles (remove old ones)
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      setCursorTrail(prev => prev.filter(point => now - point.timestamp < 500))
    }, 100)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(cleanupInterval)
    }
  }, [])

  // Secret key combo for terminal (Ctrl+Shift+T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setTerminalVisible(prev => !prev)
      }

      if (e.key === 'Escape') {
        setTerminalVisible(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!terminalInput.trim()) return

    const responses: Record<string, string> = {
      'help': '> Available commands: help, status, hack, reveal, quantum, exit',
      'status': '> SYSTEM STATUS: QUANTUM ENTANGLED | ALL SYSTEMS NOMINAL',
      'hack': '> ACCESS GRANTED: WELCOME TO THE MATRIX',
      'reveal': '> THE FUTURE IS NOT WRITTEN. IT IS RENDERED.',
      'quantum': '> SCHRÖDINGER\'S UI: SIMULTANEOUSLY OBSOLETE AND CUTTING-EDGE',
      'exit': '> TERMINAL CLOSED'
    }

    const response = responses[terminalInput.toLowerCase()] || `> UNKNOWN COMMAND: ${terminalInput}`
    setTerminalHistory(prev => [...prev, `$ ${terminalInput}`, response])
    setTerminalInput("")

    if (terminalInput.toLowerCase() === 'exit') {
      setTimeout(() => setTerminalVisible(false), 500)
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Reverse Matrix Rain */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        {matrixColumns.map(col => (
          <div
            key={col.id}
            className="matrix-column"
            style={{
              left: `${col.left}%`,
              animationDuration: `${col.duration}s`,
              animationDelay: `${col.delay}s`,
            }}
          >
            {col.chars}
          </div>
        ))}
      </div>

      {/* Quantum Particles with Teleportation */}
      <div className="fixed inset-0 pointer-events-none">
        {quantumParticles.map((particle, idx) => (
          <div key={particle.id}>
            <div
              className={`absolute w-3 h-3 bg-green-400 rounded-full ${particle.teleporting ? 'animate-[quantum-teleport_1s_ease-in-out]' : ''}`}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                boxShadow: '0 0 10px #00ff00, 0 0 20px #00ff00',
                animation: particle.teleporting
                  ? 'quantum-teleport 1s ease-in-out'
                  : `quantum-jitter ${particle.jitterDuration}s infinite`
              }}
            />
            {/* Entanglement lines connecting nearby particles */}
            {quantumParticles.slice(idx + 1).map(otherParticle => {
              const dx = otherParticle.x - particle.x
              const dy = otherParticle.y - particle.y
              const distance = Math.sqrt(dx * dx + dy * dy)

              // Only show connection if particles are close
              if (distance < 30) {
                const angle = Math.atan2(dy, dx) * 180 / Math.PI
                return (
                  <div
                    key={`${particle.id}-${otherParticle.id}`}
                    className="absolute h-px bg-green-400/30 origin-left"
                    style={{
                      left: `${particle.x}%`,
                      top: `${particle.y}%`,
                      width: `${distance}%`,
                      transform: `rotate(${angle}deg)`,
                      boxShadow: '0 0 2px #00ff00'
                    }}
                  />
                )
              }
              return null
            })}
          </div>
        ))}
      </div>

      {/* Enhanced Sparkles with random color mutations */}
      <div className="fixed inset-0 pointer-events-none">
        {sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className={`sparkle ${sparkle.colorClass}`}
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.delay}s`,
              boxShadow: `0 0 6px ${sparkle.shadowColor}`,
            }}
          />
        ))}
      </div>

      {/* Static Noise Overlay */}
      {showStaticNoise && (
        <div className="static-noise fixed inset-0 pointer-events-none opacity-5" />
      )}

      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none" />

      {/* Mouse Follow Effects */}
      {/* Cursor Glow */}
      {mousePosition.x > 0 && mousePosition.y > 0 && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,0,0.4) 0%, rgba(0,255,0,0.2) 40%, transparent 70%)',
            boxShadow: '0 0 20px rgba(0,255,0,0.3), 0 0 40px rgba(0,255,0,0.2)',
            transition: 'all 0.1s ease-out',
          }}
        />
      )}
      
      {/* Cursor Trail Particles */}
      {cursorTrail.map((point, i) => {
        const opacity = (i / cursorTrail.length) * 0.6
        const size = 2 + (i / cursorTrail.length) * 2
        return (
          <div
            key={point.id}
            className="fixed pointer-events-none z-40"
            style={{
              left: point.x,
              top: point.y,
              transform: 'translate(-50%, -50%)',
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: `rgba(0, 255, 0, ${opacity})`,
              boxShadow: `0 0 ${size * 2}px rgba(0, 255, 0, ${opacity * 0.5})`,
              transition: 'all 0.1s ease-out',
            }}
          />
        )
      })}

      {/* Hidden Terminal */}
      {terminalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl mx-4 bg-black border-2 border-green-400 p-6 shadow-[0_0_50px_rgba(0,255,0,0.3)]">
            <div className="flex justify-between items-center mb-4">
              <div className="text-green-400 font-mono flex items-center gap-2">
                <span className="quantum-glyph text-xl">⚛</span>
                <span>QUANTUM TERMINAL</span>
              </div>
              <button
                onClick={() => setTerminalVisible(false)}
                className="text-green-400 hover:text-green-300"
              >
                [ESC]
              </button>
            </div>
            <div className="h-64 overflow-y-auto mb-4 font-mono text-sm space-y-1">
              <div className="text-green-500/70">&gt; Welcome to ZwartifyOS Terminal</div>
              <div className="text-green-500/70">&gt; Type 'help' for available commands</div>
              {terminalHistory.map((line, i) => (
                <div key={i} className="text-green-400">{line}</div>
              ))}
            </div>
            <form onSubmit={handleTerminalSubmit} className="flex gap-2">
              <span className="text-green-400 font-mono">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono caret-green-400"
                placeholder="Enter command..."
                autoFocus
              />
            </form>
          </div>
        </div>
      )}

      <main className={`relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16 ${screenTear ? 'screen-tear' : ''}`}>
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Title - Professional, Clean */}
          <h1
            ref={titleRef}
            className="text-6xl md:text-8xl font-bold mb-4 text-green-400"
            style={{
              textShadow: "0 0 20px rgba(0, 255, 0, 0.3)",
            }}
          >
            ZwartifyOS
          </h1>

          {/* Tagline */}
          <p className="text-2xl md:text-3xl text-green-300 max-w-3xl mx-auto leading-relaxed mb-2 font-semibold">
            Build, Deploy, and Scale AI Agents — in Hours, Not Months
          </p>
          <p className="text-lg md:text-xl text-green-400/80 max-w-2xl mx-auto mb-8">
            Open-source agent framework built on Claude API, Next.js, and TypeScript. Production-ready. MIT-licensed.
          </p>

          {/* Open Source Philosophy */}
          <div className="mt-8 mb-4 max-w-3xl mx-auto">
            <div className="bg-black/50 border-2 border-green-400/30 p-6 rounded-lg hover:border-green-400/50 transition-all">
              <h3 className="text-xl font-bold mb-3 text-green-400">🌱 Why Open Source?</h3>
              <p className="text-green-300/90 mb-3 leading-relaxed">
                ZwartifyOS is open source because we believe agent platforms should empower users, not act as middlemen.
              </p>
              <ul className="text-sm text-green-300/80 space-y-1.5 list-disc list-inside ml-2">
                <li>Agent platforms should be <strong className="text-green-400">transparent and auditable</strong></li>
                <li>Users should <strong className="text-green-400">own their agents and data</strong>, not rent them</li>
                <li>Innovation comes from <strong className="text-green-400">open collaboration</strong>, not walled gardens</li>
                <li>Middlemen who add no value beyond access control are <strong className="text-green-400">rip-off merchants</strong></li>
              </ul>
              <p className="text-sm text-green-400/70 mt-4 italic">
                The value is in the code, the tools, the architecture—not in artificial scarcity.
              </p>
            </div>
          </div>

          {/* Buttons - Professional */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Link
              href="/demo"
              className="px-8 py-4 bg-green-400 text-black font-semibold uppercase tracking-wider
                       hover:bg-green-300 transition-all duration-300 rounded-lg
                       shadow-lg hover:shadow-green-400/50"
            >
              🚀 Try Demo
            </Link>

            <Link
              href="/docs"
              className="px-8 py-4 bg-transparent border-2 border-green-400 text-green-400 font-semibold uppercase tracking-wider
                       hover:bg-green-400 hover:text-black transition-all duration-300 rounded-lg"
            >
              📖 Documentation
            </Link>

            <a
              href="https://github.com/kriszwart/ZwartifyOSv1"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-transparent border-2 border-green-400 text-green-400 font-semibold uppercase tracking-wider
                       hover:bg-green-400 hover:text-black transition-all duration-300 rounded-lg"
            >
              ⭐ GitHub
            </a>
          </div>

          {/* API Key Notice */}
          <div className="mt-12 mb-8 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-green-400/20 to-cyan-400/20 border-2 border-green-400/50 p-6 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🔑</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-green-400">Bring Your Own API Key</h3>
                  <p className="text-green-300 mb-4 text-sm leading-relaxed">
                    ZwartifyOS is <strong className="text-green-400">100% open source</strong>. To use agents, you need your own Anthropic API key. 
                    No middlemen, no hidden fees—you pay Anthropic directly and see all token usage.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/settings"
                      className="px-4 py-2 bg-green-400/20 border border-green-400/50 text-green-400 font-mono text-sm hover:bg-green-400/30 transition-all rounded"
                    >
                      ⚙️ Add API Key
                    </Link>
                    <Link
                      href="/docs/quick-start"
                      className="px-4 py-2 bg-cyan-400/20 border border-cyan-400/50 text-cyan-400 font-mono text-sm hover:bg-cyan-400/30 transition-all rounded"
                    >
                      📖 Get Started Guide
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="mt-16 mb-12">
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/create-agent-visual"
                className="px-6 py-3 bg-cyan-400/20 border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-400/30 transition-all rounded-lg font-semibold text-sm"
              >
                🎨 Visual Builder
              </Link>
              <Link
                href="/create-agent"
                className="px-6 py-3 bg-purple-400/20 border-2 border-purple-400 text-purple-300 hover:bg-purple-400/30 transition-all rounded-lg font-semibold text-sm"
              >
                ✨ Create Agent
              </Link>
              <Link
                href="/roadmap"
                className="px-6 py-3 bg-cyan-400/20 border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-400/30 transition-all rounded-lg font-semibold text-sm"
              >
                🗺️ Roadmap
              </Link>
              <Link
                href="/agents"
                className="px-6 py-3 bg-green-400/20 border-2 border-green-400 text-green-300 hover:bg-green-400/30 transition-all rounded-lg font-semibold text-sm"
              >
                🤖 Agents
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-yellow-400/20 border-2 border-yellow-400 text-yellow-300 hover:bg-yellow-400/30 transition-all rounded-lg font-semibold text-sm"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/playground"
                className="px-6 py-3 bg-blue-400/20 border-2 border-blue-400 text-blue-300 hover:bg-blue-400/30 transition-all rounded-lg font-semibold text-sm"
              >
                🎮 Playground
              </Link>
              <Link
                href="/settings"
                className="px-6 py-3 bg-orange-400/20 border-2 border-orange-400 text-orange-300 hover:bg-orange-400/30 transition-all rounded-lg font-semibold text-sm"
              >
                ⚙️ Settings
              </Link>
            </div>
          </div>

          {/* Architecture Overview Section */}
          <div className="mt-20 mb-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center text-green-400">Architecture Overview</h2>
            <div className="bg-black/50 border-2 border-green-400/30 p-6 rounded-lg">
              <p className="text-green-300 mb-4 text-center">
                ZwartifyOS coordinates intelligence the way Unix coordinated programs.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-2">ACCV Stack</h3>
                  <ul className="text-sm text-green-300/90 space-y-1">
                    <li>• <strong>Agents</strong> - Intelligent userland programs</li>
                    <li>• <strong>Cursor</strong> - Local code generation</li>
                    <li>• <strong>Claude</strong> - Code review & API</li>
                    <li>• <strong>Vercel</strong> - Instant deployment</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-2">Core Components</h3>
                  <ul className="text-sm text-green-300/90 space-y-1">
                    <li>• <strong>Tools</strong> - Extensible capabilities</li>
                    <li>• <strong>RAG</strong> - Knowledge base system</li>
                    <li>• <strong>Memory</strong> - Conversation persistence</li>
                    <li>• <strong>Scheduling</strong> - Automated runs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20 mb-16 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-green-400">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "🎨", title: "Visual Builder", desc: "Build agents visually with drag-and-drop nodes", link: "/create-agent-visual" },
                { icon: "🤖", title: "Agent Management", desc: "Create, configure, and monitor agents", link: "/agents" },
                { icon: "🧠", title: "RAG System", desc: "Knowledge base management for contextual agents", link: "/rag" },
                { icon: "💾", title: "Memory & Context", desc: "Conversation persistence and context management", link: "/memory" },
                { icon: "⏰", title: "Scheduling", desc: "Automated agent runs with cron expressions", link: "/dashboard" },
                { icon: "✨", title: "G-SAC Creator", desc: "Agents that create agents from natural language", link: "/create-agent" },
                { icon: "📊", title: "Token Tracking", desc: "Comprehensive usage and cost monitoring", link: "/dashboard" },
              ].map((feature, idx) => (
                <Link
                  key={idx}
                  href={feature.link}
                  className="bg-black/50 border-2 border-green-400/30 p-6 rounded-lg hover:border-green-400/50 transition-all cursor-pointer group"
                >
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-green-400 mb-2 group-hover:text-green-300">{feature.title}</h3>
                  <p className="text-sm text-green-300/80">{feature.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Demo Section */}
          <div className="mt-20 mb-16 max-w-3xl mx-auto">
            <div className="bg-black/50 border-2 border-green-400/30 p-8 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4 text-green-400">See It In Action</h2>
              <p className="text-green-300 mb-6">
                Describe your agent in plain English. G-SAC builds and deploys it automatically.
              </p>
              <Link
                href="/demo"
                className="inline-block px-6 py-3 bg-green-400 text-black font-semibold rounded-lg hover:bg-green-300 transition-all"
              >
                View Interactive Demo →
              </Link>
            </div>
          </div>

          {/* Holographic Accent with Random Variations */}
          <div className="mt-16 space-y-2">
            <div
              className="holographic-gradient text-4xl font-mono opacity-50"
              style={{
                animation: 'holographic 3s ease infinite, quantum-jitter 1s infinite'
              }}
            >
              &gt; _ SYSTEM_READY
            </div>
            {/* Hidden Terminal Hint - appears probabilistically */}
            {showTerminalHint && (
              <div className="text-xs text-green-500/40 font-mono animate-fade-in">
                [Ctrl+Shift+T to access Quantum Terminal]
              </div>
            )}
          </div>

          {/* Mysterious Hex Messages */}
          {screenTear && (
            <div className="absolute bottom-1/4 left-0 right-0 text-xs font-mono text-pink-500/30 animate-fade-in pointer-events-none">
              0x5A 0x77 0x61 0x72 0x74 0x69 0x66 0x79
            </div>
          )}

          {/* Demo Video Section */}
          <div className="mt-20 mb-16 max-w-5xl mx-auto w-full">
            <div className="bg-black/50 border-2 border-green-400/30 p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-green-400 text-center">See ZwartifyOS in Action</h2>
              <p className="text-green-300/80 text-sm text-center mb-6">
                Watch the demo showing ZwartifyOS homepage and key features
              </p>
              <div className="w-full rounded-lg overflow-hidden border border-green-400/20">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/XE0iBKLWhkE"
                    title="ZwartifyOS Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Demo GIF Section */}
          <div className="mt-20 mb-16 max-w-5xl mx-auto w-full">
            <div className="bg-black/50 border-2 border-green-400/30 p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-green-400 text-center">Quick Preview</h2>
              <p className="text-green-300/80 text-sm text-center mb-6">
                Animated preview of ZwartifyOS interface
              </p>
              <div className="w-full rounded-lg overflow-hidden border border-green-400/20">
                <img
                  src="/ZwartifyOS30lores.gif"
                  alt="ZwartifyOS Demo"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-0 w-full py-6 text-center text-sm text-green-500/60">
          <div className="space-y-2">
            <div>
              <a
                href="https://github.com/kriszwart/ZwartifyOSv1"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-400 transition-colors"
              >
                GitHub
              </a>
              {" • "}
              <Link href="/docs" className="hover:text-green-400 transition-colors">
                Documentation
              </Link>
              {" • "}
              <Link href="/demo" className="hover:text-green-400 transition-colors">
                Demo
              </Link>
              {" • "}
              <Link href="/roadmap" className="hover:text-green-400 transition-colors">
                Roadmap
              </Link>
              {" • "}
              <Link href="/settings" className="hover:text-green-400 transition-colors">
                Settings
              </Link>
            </div>
            <div>
              <span>MIT License © 2025 ZwartifyOS</span>
              {" • "}
              <span className="text-green-400/50">v1.0.0</span>
              {" • "}
              <Link href="/settings" className="hover:text-green-400 transition-colors text-green-400/70">
                Configure API Key
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
