"use client"
import { useState } from 'react'
import Link from 'next/link'
import FileViewerDialog from './FileViewerDialog'

interface FileBrowserTabProps {
  brands: string[]
  selectedBrand?: string
  selectedFile?: string
  files: string[]
  markdown: string
  url: string
  capture: any
  aggregated: string
}

export default function FileBrowserTab({
  brands,
  selectedBrand,
  selectedFile,
  files,
  markdown,
  url,
  capture,
  aggregated
}: FileBrowserTabProps) {
  const [searchFilter, setSearchFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'md' | 'json' | 'image'>('all')
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const filesPerPage = 50

  // Filter files
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.toLowerCase().includes(searchFilter.toLowerCase())
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'md' && file.endsWith('.md')) ||
      (typeFilter === 'json' && file.endsWith('.json')) ||
      (typeFilter === 'image' && file.match(/\.(jpg|jpeg|png|gif|webp)$/i))
    return matchesSearch && matchesType
  })

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage)
  const startIndex = (currentPage - 1) * filesPerPage
  const currentFiles = filteredFiles.slice(startIndex, startIndex + filesPerPage)

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.md')) return '📄'
    if (filename.endsWith('.json')) return '📊'
    if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return '🖼️'
    return '📁'
  }

  const getFileType = (filename: string) => {
    if (filename.endsWith('.md')) return 'Markdown'
    if (filename.endsWith('.json')) return 'JSON'
    if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'Image'
    return 'File'
  }

  return (
    <div className="space-y-6">
      {/* Brand Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
        <div className="p-6 border-b border-deep-blue-light">
          <h2 className="text-xl font-semibold text-deep-blue mb-2">Brand Selection</h2>
          <p className="text-charcoal/70 text-sm">Choose a brand to browse its crawled files</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {brands.map(brand => (
              <Link 
                key={brand} 
                href={`?brand=${encodeURIComponent(brand)}`} 
                className={`px-4 py-3 rounded-lg border text-center font-medium transition-all hover:shadow-sm ${
                  brand === selectedBrand 
                    ? 'bg-deep-blue text-white border-deep-blue shadow-sm' 
                    : 'border-deep-blue-light text-deep-blue hover:bg-deep-blue-light/10'
                }`}
              >
                <div className="capitalize text-sm">{brand.replace('-', ' ')}</div>
                <div className="text-xs opacity-75 mt-1">Brand</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* File Browser */}
      {selectedBrand && (
        <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
          <div className="p-6 border-b border-deep-blue-light">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-deep-blue mb-2 capitalize">
                  {selectedBrand.replace('-', ' ')} Files
                </h2>
                <p className="text-charcoal/70 text-sm">
                  {filteredFiles.length} of {files.length} files
                </p>
              </div>
              
              {selectedFile && (
                <button
                  onClick={() => setShowFileDialog(true)}
                  className="px-4 py-2 bg-vibrant-orange text-white rounded-lg hover:bg-vibrant-orange-hover font-medium"
                >
                  View Selected File
                </button>
              )}
            </div>
          </div>
          
          {/* Filters */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search files..."
                  className="w-full border border-deep-blue-light rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                />
              </div>
              
              <div className="md:w-48">
                <select 
                  className="w-full border border-deep-blue-light rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                >
                  <option value="all">All files</option>
                  <option value="md">Markdown (.md)</option>
                  <option value="json">JSON (.json)</option>
                  <option value="image">Images</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* File List */}
          <div className="max-h-96 overflow-y-auto">
            {currentFiles.length === 0 ? (
              <div className="p-8 text-center text-charcoal/60">
                <div className="text-4xl mb-4">📂</div>
                <div className="text-lg font-medium mb-2">No files found</div>
                <div className="text-sm">Try adjusting your search or filter criteria</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {currentFiles.map((file, index) => (
                  <Link
                    key={file}
                    href={`?brand=${encodeURIComponent(selectedBrand)}&file=${encodeURIComponent(file)}`}
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                      file === selectedFile ? 'bg-deep-blue-light/10 border-r-4 border-deep-blue' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xl">{getFileIcon(file)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-charcoal truncate">{file}</div>
                        <div className="text-xs text-charcoal/60">{getFileType(file)}</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-charcoal/60 ml-4">
                      #{startIndex + index + 1}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <button
                className="px-4 py-2 border border-deep-blue-light rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-deep-blue-light/10"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-charcoal/70">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <button
                className="px-4 py-2 border border-deep-blue-light rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-deep-blue-light/10"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Aggregated Content Preview */}
      {selectedBrand && aggregated && (
        <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
          <div className="p-6 border-b border-deep-blue-light">
            <h3 className="text-lg font-semibold text-deep-blue mb-2">Aggregated Content Preview</h3>
            <p className="text-charcoal/70 text-sm">Combined data for this brand</p>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-auto">
              <pre className="text-xs text-charcoal whitespace-pre-wrap">
                {aggregated.slice(0, 500)}
                {aggregated.length > 500 && '...'}
              </pre>
            </div>
            <button
              onClick={() => setShowFileDialog(true)}
              className="mt-3 text-sm text-deep-blue hover:text-deep-blue-hover font-medium"
            >
              View Full Aggregated Content →
            </button>
          </div>
        </div>
      )}

      {/* File Viewer Dialog */}
      {showFileDialog && (
        <FileViewerDialog
          isOpen={showFileDialog}
          onClose={() => setShowFileDialog(false)}
          brand={selectedBrand}
          file={selectedFile}
          markdown={markdown}
          url={url}
          capture={capture}
          aggregated={aggregated}
        />
      )}
    </div>
  )
}
