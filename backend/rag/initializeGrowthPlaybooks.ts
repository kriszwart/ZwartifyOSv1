/**
 * Initialize Growth Playbooks RAG Folder
 * 
 * Creates and manages the RAG folder for Growth Playbooks used by G-SAC
 */

import { createRAGFolder, getRAGFolderByName } from './storage'

const GROWTH_PLAYBOOKS_FOLDER_NAME = 'Growth Playbooks'

let growthPlaybooksFolderId: string | undefined

/**
 * Get or create the Growth Playbooks folder ID
 */
export function getGrowthPlaybooksFolderId(): string | undefined {
  // Return cached ID if available
  if (growthPlaybooksFolderId) {
    return growthPlaybooksFolderId
  }

  // Try to find existing folder
  const existingFolder = getRAGFolderByName(GROWTH_PLAYBOOKS_FOLDER_NAME)
  
  if (existingFolder) {
    growthPlaybooksFolderId = existingFolder.id
    return growthPlaybooksFolderId
  }

  // Create new folder if it doesn't exist
  try {
    const folder = createRAGFolder(GROWTH_PLAYBOOKS_FOLDER_NAME, {
      purpose: 'growth-strategy-playbooks',
      usedBy: 'g-sac',
      description: 'RAG folder containing growth strategy playbooks and templates for G-SAC agent creation',
    })
    
    growthPlaybooksFolderId = folder.id
    return growthPlaybooksFolderId
  } catch (error) {
    console.error('Error creating Growth Playbooks folder:', error)
    return undefined
  }
}

/**
 * Initialize the Growth Playbooks folder on module load
 */
if (typeof window === 'undefined') {
  // Server-side initialization
  try {
    getGrowthPlaybooksFolderId()
  } catch (error) {
    console.error('Error initializing Growth Playbooks folder:', error)
  }
}

