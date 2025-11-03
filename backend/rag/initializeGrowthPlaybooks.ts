/**
 * Initialize Leadnamic-Growth-Playbooks RAG Folder
 * 
 * Creates the RAG folder for G-SAC agent knowledge base.
 * This folder contains growth strategy playbooks, sales scripts, and agent design best practices.
 */

import { createRAGFolder, getRAGFolderByName } from '../rag/storage'

let growthPlaybooksFolderId: string | null = null

/**
 * Initialize the Leadnamic-Growth-Playbooks folder
 * Returns the folder ID if successful, or null if folder already exists
 */
export function initializeGrowthPlaybooksFolder(): string | null {
  try {
    // Check if folder already exists
    const existingFolder = getRAGFolderByName('Leadnamic-Growth-Playbooks')
    if (existingFolder) {
      growthPlaybooksFolderId = existingFolder.id
      return existingFolder.id
    }

    // Create the folder
    const folder = createRAGFolder('Leadnamic-Growth-Playbooks', {
      description: 'Growth strategy playbooks, sales scripts, marketing frameworks, and agent design best practices',
      purpose: 'Knowledge base for the Growth Strategy Agent Creator (G-SAC)',
      category: 'growth-strategy',
      version: '1.0.0',
    })

    growthPlaybooksFolderId = folder.id
    console.log(`✅ Created RAG folder: Leadnamic-Growth-Playbooks (ID: ${folder.id})`)
    
    return folder.id
  } catch (error) {
    console.error('Error initializing Growth Playbooks folder:', error)
    return null
  }
}

/**
 * Get the Growth Playbooks folder ID
 */
export function getGrowthPlaybooksFolderId(): string | null {
  if (growthPlaybooksFolderId) {
    return growthPlaybooksFolderId
  }

  const folder = getRAGFolderByName('Leadnamic-Growth-Playbooks')
  if (folder) {
    growthPlaybooksFolderId = folder.id
    return folder.id
  }

  return null
}

// Initialize on module load (server-side only)
if (typeof window === 'undefined') {
  initializeGrowthPlaybooksFolder()
}

