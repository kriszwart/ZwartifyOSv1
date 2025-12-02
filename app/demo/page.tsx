"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { enhancedDemoSteps, EnhancedDemoStep } from "./data/demoSteps"
import TokenDisplay from "./components/TokenDisplay"
import { DemoProvider, useDemo } from "./context/DemoContext"
import { useDemoOrchestrator } from "./components/DemoOrchestrator"
import { useVoiceNarration } from "./hooks/useVoiceNarration"

function DemoPageContent() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [displayedText, setDisplayedText] = useState("")
  const [cumulativeTokens, setCumulativeTokens] = useState({ input: 0, output: 0, total: 0, cost: 0 })
  const [executingAction, setExecutingAction] = useState(false)
  const [actionResult, setActionResult] = useState<any>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const typeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const demo = useDemo()
  const { executeAction } = useDemoOrchestrator()
  const { speak, stop, isLoading: voiceLoading, error: voiceError } = useVoiceNarration({ enabled: voiceEnabled })

  useEffect(() => {
    if (isPlaying && !isPaused && currentStep < enhancedDemoSteps.length) {
      const step = enhancedDemoSteps[currentStep]
      setDisplayedText("")
      setActionError(null)
      setActionResult(null)
      
      // Start voice narration if enabled and content is string
      // Only start after user interaction (when demo is playing)
      let voicePromise: Promise<void> | null = null
      if (voiceEnabled && typeof step.content === "string" && step.content && isPlaying) {
        console.log("Starting voice narration for step:", step.id, step.title)
        voicePromise = speak(step.content).catch((err) => {
          console.error("Voice narration failed for step:", step.id, err)
          // Continue even if voice fails
        })
      }
      
      // Auto-execute action if step has one
      let actionPromise: Promise<any> | null = null
      if (step.action && step.action.type !== "none") {
        setExecutingAction(true)
        actionPromise = executeAction(step.action)
          .then((result) => {
            setActionResult(result)
            if (result?.tokenUsage) {
              setCumulativeTokens(prev => ({
                input: prev.input + (result.tokenUsage.inputTokens || 0),
                output: prev.output + (result.tokenUsage.outputTokens || 0),
                total: prev.total + (result.tokenUsage.totalTokens || 0),
                cost: prev.cost + (result.tokenUsage.estimatedCost || 0),
              }))
            }
            return result
          })
          .catch((error) => {
            console.error("Action execution error:", error)
            setActionError(error instanceof Error ? error.message : "Failed to execute action")
            return null
          })
          .finally(() => {
            setExecutingAction(false)
          })
      }
      
      // Handle React components differently
      if (typeof step.content === "string" && step.content) {
        // Typewriter effect for string content
        const contentString = step.content
        let charIndex = 0
        const stepStartTime = Date.now()
        const stepDuration = step.duration * 1000 // Convert to milliseconds
        
        typeIntervalRef.current = setInterval(() => {
          if (charIndex < contentString.length && !isPaused) {
            setDisplayedText(contentString.substring(0, charIndex + 1))
            charIndex++
          } else if (charIndex >= contentString.length) {
            if (typeIntervalRef.current) {
              clearInterval(typeIntervalRef.current)
              typeIntervalRef.current = null
            }
            
            // Wait for voice and action to complete, then ensure minimum duration
            Promise.all([
              voicePromise || Promise.resolve(),
              actionPromise || Promise.resolve(),
            ]).then((results) => {
              const actionResult = results[1] // Get action result
              
              // Update cumulative tokens from step (if action didn't provide real ones)
              if (step.tokenUsage && !actionResult?.tokenUsage) {
                setCumulativeTokens(prev => ({
                  input: prev.input + step.tokenUsage!.inputTokens,
                  output: prev.output + step.tokenUsage!.outputTokens,
                  total: prev.total + step.tokenUsage!.totalTokens,
                  cost: prev.cost + step.tokenUsage!.estimatedCost,
                }))
              }
              
              // Calculate remaining time to meet minimum duration
              const elapsed = Date.now() - stepStartTime
              const remaining = Math.max(0, stepDuration - elapsed)
              
              // Wait for remaining time (or minimum 1 second) before advancing
              if (!isPaused) {
                stepTimeoutRef.current = setTimeout(() => {
                  if (!isPaused && currentStep < enhancedDemoSteps.length - 1) {
                    setCurrentStep(prev => prev + 1)
                  } else if (currentStep >= enhancedDemoSteps.length - 1) {
                    setIsPlaying(false)
                    stop() // Stop any remaining voice
                  }
                }, Math.max(remaining, 1000)) // At least 1 second buffer
              }
            })
          }
        }, 30)

        return () => {
          if (typeIntervalRef.current) {
            clearInterval(typeIntervalRef.current)
            typeIntervalRef.current = null
          }
          if (stepTimeoutRef.current) {
            clearTimeout(stepTimeoutRef.current)
            stepTimeoutRef.current = null
          }
          stop() // Stop voice if component unmounts
        }
      } else {
        // For React components, show immediately
        setDisplayedText("")
        const stepStartTime = Date.now()
        const stepDuration = step.duration * 1000 // Convert to milliseconds
        
        // Wait for action to complete, then ensure minimum duration
        Promise.all([
          voicePromise || Promise.resolve(),
          actionPromise || Promise.resolve(),
        ]).then((results) => {
          const actionResult = results[1] // Get action result
          
          // Update cumulative tokens from step (if action didn't provide real ones)
          if (step.tokenUsage && !actionResult?.tokenUsage) {
            setCumulativeTokens(prev => ({
              input: prev.input + step.tokenUsage!.inputTokens,
              output: prev.output + step.tokenUsage!.outputTokens,
              total: prev.total + step.tokenUsage!.totalTokens,
              cost: prev.cost + step.tokenUsage!.estimatedCost,
            }))
          }
          
          // Calculate remaining time to meet minimum duration
          const elapsed = Date.now() - stepStartTime
          const remaining = Math.max(0, stepDuration - elapsed)
          
          if (!isPaused) {
            stepTimeoutRef.current = setTimeout(() => {
              if (!isPaused && currentStep < enhancedDemoSteps.length - 1) {
                setCurrentStep(prev => prev + 1)
              } else if (currentStep >= enhancedDemoSteps.length - 1) {
                setIsPlaying(false)
                stop() // Stop any remaining voice
              }
            }, Math.max(remaining, 1000)) // At least 1 second buffer
          }
        })

        return () => {
          if (stepTimeoutRef.current) {
            clearTimeout(stepTimeoutRef.current)
            stepTimeoutRef.current = null
          }
          stop() // Stop voice if component unmounts
        }
      }
    }
  }, [currentStep, isPlaying, isPaused, voiceEnabled])

  const startDemo = () => {
    setCurrentStep(0)
    setDisplayedText("")
    setCumulativeTokens({ input: 0, output: 0, total: 0, cost: 0 })
    setIsPlaying(true)
    setIsPaused(false)
  }

  const pauseDemo = () => {
    setIsPaused(true)
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current)
      typeIntervalRef.current = null
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current)
      stepTimeoutRef.current = null
    }
    stop() // Pause voice narration
  }

  const resumeDemo = () => {
    setIsPaused(false)
    // Resume will happen automatically via useEffect when isPaused becomes false
  }

  const resetDemo = () => {
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentStep(0)
    setDisplayedText("")
    setCumulativeTokens({ input: 0, output: 0, total: 0, cost: 0 })
    setExecutingAction(false)
    setActionResult(null)
    setActionError(null)
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current)
      typeIntervalRef.current = null
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current)
      stepTimeoutRef.current = null
    }
    stop() // Stop any playing voice
    demo.reset()
  }

  const handleExecuteAction = async () => {
    const step = enhancedDemoSteps[currentStep]
    if (!step.action || step.action.type === "none") {
      return
    }

    setExecutingAction(true)
    setActionError(null)
    setActionResult(null)

    try {
      const result = await executeAction(step.action)
      setActionResult(result)
      
      // Update token usage if available from result
      if (result.tokenUsage) {
        setCumulativeTokens(prev => ({
          input: prev.input + (result.tokenUsage.inputTokens || 0),
          output: prev.output + (result.tokenUsage.outputTokens || 0),
          total: prev.total + (result.tokenUsage.totalTokens || 0),
          cost: prev.cost + (result.tokenUsage.estimatedCost || 0),
        }))
      }
    } catch (error) {
      console.error("Action execution error:", error)
      setActionError(error instanceof Error ? error.message : "Failed to execute action")
    } finally {
      setExecutingAction(false)
    }
  }

  const currentStepData = enhancedDemoSteps[currentStep]
  const isStringContent = typeof currentStepData.content === "string"
  const VisualComponent = currentStepData.visualComponent

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
          <h1 className="text-2xl font-bold font-mono">ZwartifyOS Demo</h1>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-sm font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => {
                  setVoiceEnabled(e.target.checked)
                  if (!e.target.checked) stop()
                }}
                className="w-4 h-4 border-green-400/50 bg-black text-green-400 focus:ring-green-400 rounded"
              />
              <span className="text-green-400/80">🔊 Voice</span>
            </label>
            {voiceLoading && (
              <span className="text-green-400/60 text-xs font-mono animate-pulse">Speaking...</span>
            )}
            {voiceError && (
              <div className="flex flex-col gap-1">
                <span className="text-red-400/80 text-xs font-mono">Voice Error</span>
                <span className="text-red-400/60 text-xs font-mono max-w-xs truncate" title={voiceError}>
                  {voiceError.length > 40 ? voiceError.substring(0, 40) + "..." : voiceError}
                </span>
              </div>
            )}
            <Link
              href="/create-agent-visual"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Visual Builder
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Introduction */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              The Promethean Moment
            </h2>
            <p className="text-green-300/80 mb-6 max-w-2xl mx-auto">
              Agents with skills. Real tools. Real reasoning. Real execution.
            </p>
            {!isPlaying && currentStep === 0 && (
              <button
                onClick={startDemo}
                className="px-8 py-4 border-2 border-purple-400 bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 transition-all font-mono font-bold text-lg"
              >
                ▶ Start Demo
              </button>
            )}
            {isPlaying && !isPaused && (
              <div className="flex gap-4">
                <button
                  onClick={pauseDemo}
                  className="px-8 py-4 border-2 border-yellow-400 bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400/30 transition-all font-mono font-bold text-lg"
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={resetDemo}
                  className="px-8 py-4 border-2 border-red-400 bg-red-400/20 text-red-300 hover:bg-red-400/30 transition-all font-mono font-bold text-lg"
                >
                  ⏹ Stop
                </button>
              </div>
            )}
            {isPlaying && isPaused && (
              <div className="flex gap-4">
                <button
                  onClick={resumeDemo}
                  className="px-8 py-4 border-2 border-green-400 bg-green-400/20 text-green-300 hover:bg-green-400/30 transition-all font-mono font-bold text-lg"
                >
                  ▶ Resume
                </button>
                <button
                  onClick={resetDemo}
                  className="px-8 py-4 border-2 border-red-400 bg-red-400/20 text-red-300 hover:bg-red-400/30 transition-all font-mono font-bold text-lg"
                >
                  ⏹ Stop
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-400/60 font-mono">
                Step {currentStep + 1} of {enhancedDemoSteps.length} • {currentStepData.scriptTimestamp}
              </span>
              <span className="text-sm text-green-400/60 font-mono">
                {Math.round(((currentStep + 1) / enhancedDemoSteps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-black/50 border border-green-400/30 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / enhancedDemoSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Step Display */}
          <div className="bg-black/50 border-2 border-green-400/50 p-8 rounded-lg mb-8 min-h-[400px]">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-5xl">{currentStepData.icon}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-green-400 mb-2">{currentStepData.title}</h3>
                <p className="text-green-300/80 text-sm font-mono mb-4">{currentStepData.description}</p>
              </div>
            </div>

            {/* Content */}
            {isStringContent ? (
              <div className="bg-black/50 border border-green-400/20 p-6 rounded font-mono text-sm text-green-300 whitespace-pre-wrap min-h-[200px]">
                {displayedText}
                {isPlaying && typeof currentStepData.content === "string" && displayedText.length < currentStepData.content.length && (
                  <span className="animate-pulse text-green-400">▊</span>
                )}
              </div>
            ) : (
              <div className="bg-black/50 border border-green-400/20 p-6 rounded min-h-[200px]">
                {currentStepData.content}
              </div>
            )}

            {/* Visual Component */}
            {VisualComponent && (
              <div className="mt-6">
                <VisualComponent />
              </div>
            )}

            {/* Step Token Usage */}
            {currentStepData.tokenUsage && (
              <div className="mt-6">
                <TokenDisplay tokenUsage={currentStepData.tokenUsage} label="Step Token Usage" />
              </div>
            )}

            {/* Action Execution */}
            {currentStepData.action && currentStepData.action.type !== "none" && (
              <div className="mt-6 space-y-4">
                <button
                  onClick={handleExecuteAction}
                  disabled={executingAction}
                  className="w-full px-6 py-3 border-2 border-purple-400 bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 transition-all font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {executingAction ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Execute This Step</span>
                    </>
                  )}
                </button>

                {actionError && (
                  <div className="bg-red-400/10 border-2 border-red-400/50 p-4 rounded-lg">
                    <div className="text-red-400 font-mono text-sm font-bold mb-2">Error:</div>
                    <div className="text-red-300/80 text-sm font-mono">{actionError}</div>
                  </div>
                )}

                {actionResult && (
                  <div className="bg-green-400/10 border-2 border-green-400/50 p-4 rounded-lg">
                    <div className="text-green-400 font-mono text-sm font-bold mb-2">✓ Success:</div>
                    {actionResult.agent && (
                      <div className="text-green-300/80 text-sm font-mono mb-2">
                        Agent created: <span className="text-green-400">{actionResult.agent.name}</span> (ID: {actionResult.agent.id})
                      </div>
                    )}
                    {actionResult.result && (
                      <div className="text-green-300/80 text-sm font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {actionResult.result.substring(0, 500)}
                        {actionResult.result.length > 500 && "..."}
                      </div>
                    )}
                    {actionResult.path && (
                      <div className="text-green-300/80 text-sm font-mono mt-2">
                        Navigated to: <span className="text-green-400">{actionResult.path}</span>
                      </div>
                    )}
                    {actionResult.tokenUsage && (
                      <div className="mt-3">
                        <TokenDisplay tokenUsage={actionResult.tokenUsage} label="Real Token Usage" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cumulative Token Usage */}
          {cumulativeTokens.total > 0 && (
            <div className="mb-8">
              <TokenDisplay 
                tokenUsage={{
                  inputTokens: cumulativeTokens.input,
                  outputTokens: cumulativeTokens.output,
                  totalTokens: cumulativeTokens.total,
                  estimatedCost: cumulativeTokens.cost,
                }} 
                label="Cumulative Token Usage" 
                size="large" 
              />
            </div>
          )}

          {/* Step Navigation */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 border-2 border-green-400/50 text-green-400/70 hover:bg-green-400/10 hover:text-green-400 transition-all font-mono disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <div className="flex gap-2">
              {enhancedDemoSteps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentStep
                      ? 'bg-green-400 w-8'
                      : idx < currentStep
                      ? 'bg-green-400/50'
                      : 'bg-green-400/20'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentStep(Math.min(enhancedDemoSteps.length - 1, currentStep + 1))}
              disabled={currentStep === enhancedDemoSteps.length - 1}
              className="px-6 py-3 border-2 border-green-400/50 text-green-400/70 hover:bg-green-400/10 hover:text-green-400 transition-all font-mono disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>

          {/* Call to Action */}
          {currentStep === enhancedDemoSteps.length - 1 && !isPlaying && (
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-green-400/10 to-purple-400/10 border-2 border-green-400/50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-green-400">Ready to Build?</h3>
                <p className="text-green-300/80 mb-6 max-w-2xl mx-auto">
                  ZwartifyOS is production-ready. Code-first. Open-source. Token-transparent.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link
                    href="/create-agent-visual"
                    className="px-8 py-4 border-2 border-cyan-400 bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30 transition-all font-mono font-bold"
                  >
                    🎨 Visual Builder
                  </Link>
                  <Link
                    href="/create-agent"
                    className="px-8 py-4 border-2 border-purple-400 bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 transition-all font-mono font-bold"
                  >
                    Create Agent
                  </Link>
                  <Link
                    href="/docs"
                    className="px-8 py-4 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-all font-mono"
                  >
                    Documentation
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function DemoPage() {
  return (
    <DemoProvider>
      <DemoPageContent />
    </DemoProvider>
  )
}
