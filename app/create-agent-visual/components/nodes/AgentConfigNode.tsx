"use client"

import { memo, useState, useEffect } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import type { AgentConfigNodeData } from '../../types'

function AgentConfigNode({ data, selected }: NodeProps<any>) {
  const nodeData = data as AgentConfigNodeData & { 
    isSuggestedTarget?: boolean
    isValidTarget?: boolean
    isInvalidTarget?: boolean
  }
  const [isHovered, setIsHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const isSuggestedTarget = nodeData.isSuggestedTarget || false
  const isValidTarget = nodeData.isValidTarget || false
  const isInvalidTarget = nodeData.isInvalidTarget || false

  // Entrance animation
  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const color = '#22c55e' // Green
  const glowColor = 'rgba(34, 197, 94, 0.5)'
  const isActive = selected || isHovered

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animation: isAnimating ? 'nodeEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
      }}
    >
      {/* Outer glow ring */}
      <div
        className={`absolute -inset-3 rounded-2xl transition-all duration-500 ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
        }`}
        style={{
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
          animation: isActive ? 'pulseGlow 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Animated border container */}
      <div
        className={`absolute -inset-[2px] rounded-xl transition-all duration-500 overflow-hidden ${
          isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'
        }`}
      >
        {/* Spinning gradient border */}
        {isActive && (
          <div
            className="absolute inset-0"
            style={{
              background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`,
              animation: 'spinBorder 3s linear infinite',
            }}
          />
        )}
      </div>

      {/* Main card - glassmorphism */}
      <div
        className={`relative px-5 py-4 rounded-xl min-w-[300px] transition-all duration-300 ${
          isActive
            ? 'bg-black/90 shadow-2xl scale-105'
            : 'bg-black/70 group-hover:bg-black/80 group-hover:scale-[1.02]'
        }`}
        style={{
          backdropFilter: 'blur(20px)',
          border: `2px solid ${isActive ? color : `${color}80`}`,
          boxShadow: isActive
            ? `0 0 40px ${glowColor}, 0 20px 60px rgba(0,0,0,0.5)`
            : '0 10px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Status indicator */}
        <div className="absolute -top-1.5 -right-1.5">
          <div
            className={`w-4 h-4 rounded-full border-2 border-black ${
              nodeData.enabled === false ? 'bg-red-400' : 'bg-green-400'
            }`}
            style={{
              boxShadow: nodeData.enabled !== false
                ? `0 0 15px ${color}, 0 0 30px rgba(74, 222, 128, 0.6)`
                : 'none',
              animation: nodeData.enabled !== false && isActive
                ? 'statusPulse 1.5s ease-in-out infinite'
                : 'none',
            }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-400/20">
          <div
            className="text-green-400 text-xl transition-all duration-300"
            style={{
              filter: isActive
                ? `drop-shadow(0 0 15px ${color}) drop-shadow(0 4px 8px rgba(0,0,0,0.5))`
                : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              transform: isActive ? 'translateY(-2px) scale(1.1)' : 'scale(1)',
            }}
          >
            ⚙️
          </div>
          <div
            className="text-green-400 font-mono font-bold text-sm tracking-wider transition-all duration-300"
            style={{
              textShadow: isActive ? `0 0 20px ${glowColor}` : 'none',
            }}
          >
            AGENT CONFIG
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 text-xs font-mono">
          <div
            className="text-green-300/90 transition-all duration-300"
            style={{
              color: isActive ? color : 'rgba(34, 197, 94, 0.9)',
              textShadow: isActive ? `0 0 10px ${glowColor}` : 'none',
            }}
          >
            <span className="text-green-400/70 font-semibold">Name:</span>{' '}
            <span className="text-green-300 font-medium">{nodeData.name || 'Untitled'}</span>
          </div>
          {nodeData.description && (
            <div className="text-green-300/70 text-[11px] leading-relaxed line-clamp-2">
              {nodeData.description}
            </div>
          )}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-green-400/10">
            <span className={`px-2.5 py-1 text-[10px] font-semibold border rounded-md transition-all ${
              nodeData.enabled
                ? 'border-green-400/60 bg-green-400/15 text-green-400 shadow-[0_0_8px_rgba(0,255,0,0.2)]'
                : 'border-red-400/60 bg-red-400/15 text-red-400'
            }`}>
              {nodeData.enabled ? '✓ Enabled' : '✗ Disabled'}
            </span>
            {nodeData.useMemory && (
              <span className="px-2.5 py-1 text-[10px] font-semibold border border-cyan-400/60 bg-cyan-400/15 text-cyan-400 rounded-md shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                🧠 Memory
              </span>
            )}
          </div>
        </div>

        {/* Floating particles for active state */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${3 + (i % 2) * 2}px`,
                  height: `${3 + (i % 2) * 2}px`,
                  background: color,
                  left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 70}%`,
                  top: `${50 + Math.sin(i * 60 * Math.PI / 180) * 70}%`,
                  animation: `floatParticle ${2 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                  boxShadow: `0 0 8px ${color}`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Handles with enhanced styling */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-6 h-6 border-2 border-black transition-all cursor-crosshair hover:scale-125"
        style={{
          zIndex: 10,
          background: isActive ? color : `${color}80`,
          boxShadow: `0 0 16px ${glowColor}, 0 0 32px ${glowColor}40`,
          transform: isHovered ? 'scale(1.4)' : 'scale(1)',
          animation: isHovered ? 'handlePulse 1s ease-in-out infinite' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.animation = 'handlePulse 1s ease-in-out infinite'
          e.currentTarget.style.transform = 'scale(1.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.animation = 'none'
          e.currentTarget.style.transform = 'scale(1)'
        }}
        title="Connect to: Tools, Skills, RAG, MCP"
      />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes nodeEntrance {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        @keyframes spinBorder {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes statusPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 15px currentColor;
          }
          50% {
            transform: scale(1.2);
            box-shadow: 0 0 25px currentColor;
          }
        }
        @keyframes floatParticle {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-15px) scale(1.3);
            opacity: 0.9;
          }
        }
        @keyframes handlePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 12px currentColor, 0 0 24px currentColor;
          }
          50% {
            transform: scale(1.2);
            box-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
          }
        }
      `}</style>
    </div>
  )
}

export default memo(AgentConfigNode)

