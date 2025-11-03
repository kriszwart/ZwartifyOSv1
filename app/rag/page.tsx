"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface RAGFolder {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
}

interface RAGFile {
  id: string
  folderId: string
  filename: string
  fileSize: number
  mimeType?: string
  uploadedAt: string
  processed: boolean
  chunkCount: number
}

export default function RAGPage() {
  const [folders, setFolders] = useState<RAGFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<RAGFolder | null>(null)
  const [files, setFiles] = useState<RAGFile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadFolders()
  }, [])

  useEffect(() => {
    if (selectedFolder) {
      loadFiles(selectedFolder.id)
    }
  }, [selectedFolder])

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/rag/folders')
      const data = await response.json()
      setFolders(data.folders || [])
    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = async (folderId: string) => {
    try {
      const response = await fetch(`/api/rag/folders/${folderId}/files`)
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error loading files:', error)
    }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/rag/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName }),
      })

      if (response.ok) {
        setShowCreateForm(false)
        setFolderName('')
        loadFolders()
      }
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this folder and all its files?')) return

    try {
      const response = await fetch(`/api/rag/folders/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (selectedFolder?.id === id) {
          setSelectedFolder(null)
          setFiles([])
        }
        loadFolders()
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedFolder) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/rag/folders/${selectedFolder.id}/files`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        loadFiles(selectedFolder.id)
        e.target.value = '' // Reset input
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none" />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="border-b border-green-400/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              ← HOME
            </Link>
            <span className="text-green-400/50">|</span>
            <button
              onClick={() => window.history.back()}
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              ← Back
            </button>
          </div>
          <h1 className="text-2xl font-bold font-mono">RAG Management</h1>
          <Link
            href="/agents"
            className="text-green-400 hover:text-green-300 transition-colors font-mono"
          >
            AGENTS →
          </Link>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-green-400">RAG Folders</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-colors font-mono"
            >
              {showCreateForm ? 'Cancel' : '+ Create Folder'}
            </button>
          </div>

          {/* Create Folder Form */}
          {showCreateForm && (
            <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-bold mb-4 text-green-400">Create New RAG Folder</h3>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <label className="block text-sm font-mono mb-2 text-green-300">
                    Folder Name *
                  </label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-green-400/30 text-green-400 font-mono focus:outline-none focus:border-green-400"
                    placeholder="e.g., employee_policy_documents"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-green-400 bg-green-400/20 text-green-400 hover:bg-green-400/30 transition-colors font-mono"
                >
                  Create Folder
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Folders List */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-bold mb-4 text-green-400">Folders</h3>
              {loading ? (
                <div className="text-center py-12 text-green-400/60 font-mono">
                  Loading folders...
                </div>
              ) : folders.length === 0 ? (
                <div className="text-center py-12 text-green-400/60 font-mono">
                  No folders found. Create your first folder above.
                </div>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder)}
                      className={`bg-black/50 border-2 p-4 rounded-lg cursor-pointer transition-all ${
                        selectedFolder?.id === folder.id
                          ? 'border-green-400 bg-green-400/10'
                          : 'border-green-400/30 hover:border-green-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-green-400 mb-1">{folder.name}</h4>
                          <div className="text-xs text-green-400/60 font-mono">
                            {new Date(folder.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFolder(folder.id)
                          }}
                          className="ml-2 px-2 py-1 text-xs font-mono border border-red-400/50 text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Files Panel */}
            <div className="lg:col-span-2">
              {!selectedFolder ? (
                <div className="text-center py-12 text-green-400/60 font-mono">
                  Select a folder to view files
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-green-400">
                      Files in {selectedFolder.name}
                    </h3>
                    <label className="px-4 py-2 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-colors font-mono cursor-pointer">
                      {uploading ? 'Uploading...' : '+ Upload File'}
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                        accept=".txt,.md,.pdf,.html,.json,.csv,.log,.py,.js,.ts,.css,.xml,.yaml,.yml"
                      />
                    </label>
                  </div>

                  {files.length === 0 ? (
                    <div className="text-center py-12 text-green-400/60 font-mono">
                      No files in this folder. Upload files to get started.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="bg-black/50 border-2 border-green-400/50 p-4 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-green-400">{file.filename}</span>
                                {file.processed ? (
                                  <span className="px-2 py-1 text-xs font-mono border border-green-400/50 bg-green-400/10 text-green-400">
                                    Processed
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-mono border border-yellow-400/50 bg-yellow-400/10 text-yellow-400">
                                    Processing...
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-green-400/60 font-mono space-y-1">
                                <div>Size: {formatFileSize(file.fileSize)}</div>
                                {file.processed && (
                                  <div>Chunks: {file.chunkCount}</div>
                                )}
                                <div>Uploaded: {new Date(file.uploadedAt).toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

