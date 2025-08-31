"use client"
import { useState, useEffect } from 'react'

type FileInfo = {
  name: string
  size: number
  modified: string
  type: 'md' | 'json' | 'image' | 'other'
}

export default function FileBrowser() {
  const [brands, setBrands] = useState<string[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [files, setFiles] = useState<FileInfo[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filesPerPage] = useState(25)
  const [searchFilter, setSearchFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'md' | 'json' | 'image'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Load brands
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await fetch('/api/crawl/brands')
        const data = await res.json()
        setBrands(data.brands || [])
      } catch (error) {
        console.error('Failed to load brands:', error)
      }
    }
    loadBrands()
  }, [])

  // Load files when brand changes
  useEffect(() => {
    if (!selectedBrand) {
      setFiles([])
      return
    }

    const loadFiles = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/crawl/files?brand=${selectedBrand}`)
        const data = await res.json()
        
        // Transform file list to include metadata
        const fileInfos: FileInfo[] = (data.files || []).map((filename: string) => ({
          name: filename,
          size: Math.floor(Math.random() * 50000), // Mock size - replace with real data
          modified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          type: filename.endsWith('.md') ? 'md' : 
                filename.endsWith('.json') ? 'json' :
                filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'other'
        }))
        
        setFiles(fileInfos)
      } catch (error) {
        console.error('Failed to load files:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFiles()
  }, [selectedBrand])

  // Filter and sort files
  useEffect(() => {
    let filtered = files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchFilter.toLowerCase())
      const matchesType = typeFilter === 'all' || file.type === typeFilter
      return matchesSearch && matchesType
    })

    // Sort files
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'modified':
          comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredFiles(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [files, searchFilter, typeFilter, sortBy, sortOrder])

  // Load file content
  const loadFileContent = async (filename: string) => {
    if (!selectedBrand) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/crawl/file?brand=${selectedBrand}&file=${encodeURIComponent(filename)}`)
      const data = await res.json()
      setFileContent(data.content || 'Failed to load content')
      setSelectedFile(filename)
    } catch (error) {
      setFileContent('Error loading file')
    } finally {
      setLoading(false)
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage)
  const startIndex = (currentPage - 1) * filesPerPage
  const endIndex = startIndex + filesPerPage
  const currentFiles = filteredFiles.slice(startIndex, endIndex)

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'md': return '📄'
      case 'json': return '📊'
      case 'image': return '🖼️'
      default: return '📁'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <select 
              className="w-full border rounded px-3 py-2 text-sm"
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
            >
              <option value="">Select brand...</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Search Files</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Filter by filename..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">File Type</label>
            <select 
              className="w-full border rounded px-3 py-2 text-sm"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
            >
              <option value="all">All files</option>
              <option value="md">Markdown (.md)</option>
              <option value="json">JSON (.json)</option>
              <option value="image">Images</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Sort By</label>
            <div className="flex gap-2">
              <select 
                className="flex-1 border rounded px-3 py-2 text-sm"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
              >
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="modified">Modified</option>
              </select>
              <button
                className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {currentFiles.length} of {filteredFiles.length} files
          {selectedBrand && ` from ${selectedBrand}`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Files</h3>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading files...</div>
          ) : currentFiles.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {selectedBrand ? 'No files found' : 'Select a brand to view files'}
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                {currentFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedFile === file.name ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => loadFileContent(file.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="text-lg">{getFileIcon(file.type)}</span>
                        <span className="text-sm font-medium truncate">{file.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 ml-2">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Modified: {new Date(file.modified).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between">
                  <button
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* File Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold">
              {selectedFile ? `Content: ${selectedFile}` : 'File Content'}
            </h3>
          </div>
          <div className="p-4">
            {selectedFile ? (
              <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                {fileContent}
              </pre>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a file to view its content
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
