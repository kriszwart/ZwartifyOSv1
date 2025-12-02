import { Node, Edge } from '@xyflow/react'
import type { CustomNodeData } from '../types'

export interface ValidationError {
  nodeId?: string
  edgeId?: string
  type: 'missing_node' | 'invalid_connection' | 'orphaned_node' | 'missing_output_input'
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

/**
 * Validate workflow structure
 */
export function validateWorkflow(
  nodes: Node<CustomNodeData>[],
  edges: Edge[]
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Check for required nodes
  const hasAgentConfig = nodes.some(n => n.type === 'agentConfig')
  const hasOutput = nodes.some(n => n.type === 'output')

  if (!hasAgentConfig) {
    errors.push({
      type: 'missing_node',
      message: 'AgentConfig node is required',
      severity: 'error',
    })
  }

  if (!hasOutput) {
    errors.push({
      type: 'missing_node',
      message: 'Output node is required',
      severity: 'error',
    })
  }

  // Check for orphaned nodes (nodes with no connections)
  const connectedNodeIds = new Set<string>()
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })

  nodes.forEach(node => {
    // AgentConfig and Output can be orphaned if workflow is incomplete
    if (node.type !== 'agentConfig' && node.type !== 'output') {
      if (!connectedNodeIds.has(node.id)) {
        warnings.push({
          nodeId: node.id,
          type: 'orphaned_node',
          message: `${node.type} node is not connected`,
          severity: 'warning',
        })
      }
    }
  })

  // Check Output node has at least one input
  const outputNode = nodes.find(n => n.type === 'output')
  if (outputNode) {
    const hasInput = edges.some(e => e.target === outputNode.id)
    if (!hasInput) {
      errors.push({
        nodeId: outputNode.id,
        type: 'missing_output_input',
        message: 'Output node must have at least one input connection',
        severity: 'error',
      })
    }
  }

  // Validate connections
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)

    if (!sourceNode || !targetNode) {
      errors.push({
        edgeId: edge.id,
        type: 'invalid_connection',
        message: 'Connection references non-existent node',
        severity: 'error',
      })
      return
    }

    // Validate connection rules
    if (sourceNode.type === 'agentConfig') {
      if (!['tool', 'skill', 'rag', 'mcp'].includes(targetNode.type || '')) {
        errors.push({
          edgeId: edge.id,
          type: 'invalid_connection',
          message: `AgentConfig can only connect to Tools, Skills, RAG, or MCP nodes (not ${targetNode.type})`,
          severity: 'error',
        })
      }
    } else if (['tool', 'skill', 'rag', 'mcp'].includes(sourceNode.type || '')) {
      if (targetNode.type !== 'output') {
        errors.push({
          edgeId: edge.id,
          type: 'invalid_connection',
          message: `${sourceNode.type} can only connect to Output node (not ${targetNode.type})`,
          severity: 'error',
        })
      }
    } else if (sourceNode.type === 'output') {
      errors.push({
        edgeId: edge.id,
        type: 'invalid_connection',
        message: 'Output node cannot be a source',
        severity: 'error',
      })
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Get validation summary message
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return '✓ Workflow is valid'
  }

  const errorCount = result.errors.length
  const warningCount = result.warnings.length

  if (errorCount > 0) {
    return `✗ ${errorCount} error${errorCount !== 1 ? 's' : ''}${warningCount > 0 ? `, ${warningCount} warning${warningCount !== 1 ? 's' : ''}` : ''}`
  }

  return `⚠ ${warningCount} warning${warningCount !== 1 ? 's' : ''}`
}




