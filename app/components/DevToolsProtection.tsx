"use client"

import { useEffect } from "react"

/**
 * DevTools Protection Component
 * 
 * Prevents casual access to developer tools via right-click and keyboard shortcuts.
 * Note: This is not foolproof - determined users can still access dev tools.
 * Client-side code is always visible in the browser.
 */
export default function DevToolsProtection() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Disable common keyboard shortcuts for dev tools
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 - Open DevTools
      if (e.key === "F12") {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac) - Open DevTools
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "I" || e.key === "i")
      ) {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac) - Open Console
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "J" || e.key === "j")
      ) {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac) - Inspect Element
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "C" || e.key === "c")
      ) {
        e.preventDefault()
        return false
      }

      // Ctrl+U - View Source
      if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u")) {
        e.preventDefault()
        return false
      }

      // Ctrl+S - Save Page (can be used to view source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "S" || e.key === "s")) {
        e.preventDefault()
        return false
      }
    }

    // Disable text selection shortcuts that might reveal code
    const handleSelectStart = (e: Event) => {
      // Allow normal text selection, but prevent if Ctrl/Cmd is held
      if ((e as KeyboardEvent).ctrlKey || (e as KeyboardEvent).metaKey) {
        e.preventDefault()
        return false
      }
    }

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("selectstart", handleSelectStart)

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("selectstart", handleSelectStart)
    }
  }, [])

  return null
}

