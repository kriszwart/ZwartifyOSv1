"use client"

interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
}

interface TokenDisplayProps {
  tokenUsage: TokenUsage
  label?: string
  size?: "small" | "medium" | "large"
}

export default function TokenDisplay({ tokenUsage, label = "Token Usage", size = "medium" }: TokenDisplayProps) {
  const sizeClasses = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  }

  const valueSizeClasses = {
    small: "text-lg",
    medium: "text-xl",
    large: "text-2xl",
  }

  return (
    <div className="bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-green-400/10 border-2 border-cyan-400/50 p-4 rounded-lg">
      <div className="text-xs text-cyan-400/60 mb-3 font-mono font-bold uppercase tracking-wider">{label}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className={`text-cyan-400/60 font-mono mb-1 ${sizeClasses[size]}`}>Input</div>
          <div className={`font-bold text-cyan-400 ${valueSizeClasses[size]}`}>
            {tokenUsage.inputTokens.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-cyan-400/60 font-mono mb-1 ${sizeClasses[size]}`}>Output</div>
          <div className={`font-bold text-cyan-400 ${valueSizeClasses[size]}`}>
            {tokenUsage.outputTokens.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-purple-400/60 font-mono mb-1 ${sizeClasses[size]}`}>Total</div>
          <div className={`font-bold text-purple-400 ${valueSizeClasses[size]}`}>
            {tokenUsage.totalTokens.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-green-400/60 font-mono mb-1 ${sizeClasses[size]}`}>Cost</div>
          <div className={`font-bold text-green-400 ${valueSizeClasses[size]}`}>
            ${tokenUsage.estimatedCost.toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  )
}

