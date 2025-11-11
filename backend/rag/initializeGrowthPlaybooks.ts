/**
 * Initialize Zwartify-Growth-Playbooks RAG Folder
 * 
 * Creates the RAG folder for G-SAC agent knowledge base.
 * This folder contains growth strategy playbooks, sales scripts, and agent design best practices.
 */

import { createRAGFolder, getRAGFolderByName } from '../rag/storage'

let growthPlaybooksFolderId: string | null = null

/**
 * Initialize the Zwartify-Growth-Playbooks folder
 * Returns the folder ID if successful, or null if folder already exists
 */
export function initializeGrowthPlaybooksFolder(): string | null {
  try {
    // Check if folder already exists
    const existingFolder = getRAGFolderByName('Zwartify-Growth-Playbooks')
    if (existingFolder) {
      growthPlaybooksFolderId = existingFolder.id
      return existingFolder.id
    }

    // Create the folder
    const folder = createRAGFolder('Zwartify-Growth-Playbooks', {
      description: 'Growth strategy playbooks, sales scripts, marketing frameworks, and agent design best practices',
      purpose: 'Knowledge base for the Growth Strategy Agent Creator (G-SAC)',
      category: 'growth-strategy',
      version: '1.0.0',
    })

    growthPlaybooksFolderId = folder.id
    console.log(`✅ Created RAG folder: Zwartify-Growth-Playbooks (ID: ${folder.id})`)
    
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

  const folder = getRAGFolderByName('Zwartify-Growth-Playbooks')
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

