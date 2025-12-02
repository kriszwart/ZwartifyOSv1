"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

interface ChangelogBadgeProps {
  className?: string
  showPulse?: boolean
}

export default function ChangelogBadge({ className = "", showPulse = true }: ChangelogBadgeProps) {
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Get latest version from API
        const response = await fetch('/api/changelog')
        if (response.ok) {
          const data = await response.json()
          setLatestVersion(data.latestVersion)
          
          // Check if user has seen this version
          const lastViewedVersion = localStorage.getItem('lastViewedChangelogVersion')
          setIsNew(lastViewedVersion !== data.latestVersion)
        }
      } catch (error) {
        console.error('Error checking changelog version:', error)
      } finally {
        setLoading(false)
      }
    }

    checkVersion()
  }, [])

  const handleClick = () => {
    if (latestVersion) {
      localStorage.setItem('lastViewedChangelogVersion', latestVersion)
      setIsNew(false)
    }
  }

  if (loading || !latestVersion) {
    return null
  }

  return (
    <Link
      href="/changelog"
      onClick={handleClick}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 border-2 border-purple-400/50 bg-purple-400/10 text-purple-300 hover:bg-purple-400/20 hover:border-purple-400 transition-all rounded-lg font-mono text-xs ${className} ${
        showPulse && isNew ? 'animate-pulse' : ''
      }`}
    >
      <span>📋</span>
      <span>v{latestVersion}</span>
      {isNew && (
        <span className="px-1.5 py-0.5 bg-green-400/20 border border-green-400/50 text-green-300 text-[10px] rounded font-bold">
          NEW
        </span>
      )}
      {isNew && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />
      )}
    </Link>
  )
}


