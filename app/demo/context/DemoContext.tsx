"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface CreatedAgent {
  id: string
  name: string
  description?: string
}

interface ExecutionResult {
  agentId: string
  input: string
  output: string
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCost: number
  }
}

interface DemoState {
  createdAgents: CreatedAgent[]
  executionResults: ExecutionResult[]
  currentAgentId?: string
  navigationHistory: string[]
}

interface DemoContextType {
  state: DemoState
  addCreatedAgent: (agent: CreatedAgent) => void
  addExecutionResult: (result: ExecutionResult) => void
  setCurrentAgentId: (agentId: string) => void
  addNavigation: (path: string) => void
  reset: () => void
  getLatestAgent: () => CreatedAgent | null
  getLatestResult: () => ExecutionResult | null
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>({
    createdAgents: [],
    executionResults: [],
    navigationHistory: [],
  })

  const addCreatedAgent = (agent: CreatedAgent) => {
    setState(prev => ({
      ...prev,
      createdAgents: [...prev.createdAgents, agent],
      currentAgentId: agent.id,
    }))
  }

  const addExecutionResult = (result: ExecutionResult) => {
    setState(prev => ({
      ...prev,
      executionResults: [...prev.executionResults, result],
    }))
  }

  const setCurrentAgentId = (agentId: string) => {
    setState(prev => ({ ...prev, currentAgentId: agentId }))
  }

  const addNavigation = (path: string) => {
    setState(prev => ({
      ...prev,
      navigationHistory: [...prev.navigationHistory, path],
    }))
  }

  const reset = () => {
    setState({
      createdAgents: [],
      executionResults: [],
      navigationHistory: [],
    })
  }

  const getLatestAgent = () => {
    return state.createdAgents.length > 0
      ? state.createdAgents[state.createdAgents.length - 1]
      : null
  }

  const getLatestResult = () => {
    return state.executionResults.length > 0
      ? state.executionResults[state.executionResults.length - 1]
      : null
  }

  return (
    <DemoContext.Provider
      value={{
        state,
        addCreatedAgent,
        addExecutionResult,
        setCurrentAgentId,
        addNavigation,
        reset,
        getLatestAgent,
        getLatestResult,
      }}
    >
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error("useDemo must be used within DemoProvider")
  }
  return context
}

