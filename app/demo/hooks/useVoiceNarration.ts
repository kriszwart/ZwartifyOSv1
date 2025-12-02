"use client"

import { useState, useRef, useEffect, useCallback } from "react"

interface UseVoiceNarrationOptions {
  enabled?: boolean
  voiceId?: string
}

export function useVoiceNarration({ enabled = true, voiceId }: UseVoiceNarrationOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context for better browser compatibility
  useEffect(() => {
    if (enabled && typeof window !== "undefined") {
      try {
        // Create audio context on first user interaction
        const initAudioContext = () => {
          if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            if (AudioContextClass) {
              audioContextRef.current = new AudioContextClass()
            }
          }
        }
        
        // Try to initialize on mount (may require user interaction)
        initAudioContext()
        
        // Also initialize on any user interaction
        const events = ["click", "touchstart", "keydown"]
        const handlers = events.map(event => {
          const handler = () => {
            initAudioContext()
            events.forEach(e => document.removeEventListener(e, handler))
          }
          document.addEventListener(event, handler, { once: true })
          return handler
        })
        
        return () => {
          handlers.forEach((handler, i) => {
            document.removeEventListener(events[i], handler)
          })
        }
      } catch (err) {
        console.warn("Audio context initialization failed:", err)
      }
    }
  }, [enabled])

  const speak = useCallback(async (text: string) => {
    if (!enabled) {
      console.log("Voice narration disabled")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log("Starting voice narration for text:", text.substring(0, 50) + "...")

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }

      // Resume audio context if suspended (required by some browsers)
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        try {
          await audioContextRef.current.resume()
          console.log("Audio context resumed")
        } catch (err) {
          console.warn("Failed to resume audio context:", err)
        }
      }

      // Call our API route
      const response = await fetch("/api/elevenlabs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        console.error("ElevenLabs API error:", errorMessage)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (!data.audio) {
        throw new Error("No audio data received from API")
      }

      console.log("Audio data received, creating audio element...")

      // Create audio element and play
      const audio = new Audio(data.audio)
      audioRef.current = audio

      // Set volume
      audio.volume = 1.0

      // Add event listeners for better debugging
      audio.addEventListener("loadstart", () => console.log("Audio load started"))
      audio.addEventListener("loadeddata", () => console.log("Audio data loaded"))
      audio.addEventListener("canplay", () => console.log("Audio can play"))
      audio.addEventListener("play", () => console.log("Audio playing"))
      audio.addEventListener("error", (e) => {
        // Log error details but don't throw - allow demo to continue
        const errorDetails = audio.error 
          ? `Code: ${audio.error.code}, Message: ${audio.error.message}`
          : "Unknown audio error"
        console.warn("Audio element error (voice narration will be skipped):", errorDetails)
        // Silently fail - don't interrupt demo flow
      })

      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          console.log("Audio playback ended")
          setIsLoading(false)
          resolve()
        }
        audio.onerror = (e) => {
          const errorMsg = audio.error 
            ? `Audio error: ${audio.error.code} - ${audio.error.message}`
            : "Failed to play audio"
          console.warn("Audio playback error (voice narration will be skipped):", errorMsg)
          setIsLoading(false)
          // Don't set error or reject - allow demo to continue silently
          // Just resolve so the demo can proceed
          resolve()
        }
        
        // Attempt to play
        const playPromise = audio.play()
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Audio playback started successfully")
            })
            .catch((playError) => {
              const errorMsg = playError.message || "Failed to play audio - browser may require user interaction"
              console.warn("Audio play() failed (voice narration will be skipped):", errorMsg)
              setIsLoading(false)
              // Don't set error or reject - allow demo to continue silently
              // Just resolve so the demo can proceed
              resolve()
            })
        }
      })
    } catch (err) {
      setIsLoading(false)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("Voice narration error:", errorMessage, err)
      // Don't throw - allow demo to continue without voice
    }
  }, [enabled, voiceId])

  const stop = useCallback(() => {
    console.log("Stopping voice narration")
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }
    setIsLoading(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // Ignore errors during cleanup
        })
      }
    }
  }, [])

  return {
    speak,
    stop,
    isLoading,
    error,
  }
}

