"use client"
import { useState } from 'react'

interface FileViewerDialogProps {
  isOpen: boolean
  onClose: () => void
  brand?: string
  file?: string
  markdown: string
  url: string
  capture: any
  aggregated: string
}

type ViewMode = 'markdown' | 'capture' | 'aggregated'

export default function FileViewerDialog({
  isOpen,
  onClose,
  brand,
  file,
  markdown,
  url,
  capture,
  aggregated
}: FileViewerDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('markdown')

  if (!isOpen) return null

  const renderContent = () => {
    switch (viewMode) {
      case 'markdown':
        return (
          <div className="bg-gray-50 rounded-lg p-4 max-h-[60vh] overflow-auto">
            <pre className="text-sm whitespace-pre-wrap text-charcoal">
              {markdown || 'No markdown content available'}
            </pre>
          </div>
        )
      
      case 'capture':
        return (
          <div className="bg-gray-900 rounded-lg p-4 max-h-[60vh] overflow-auto">
            <pre className="text-xs text-green-400 font-mono">
              {capture ? JSON.stringify(capture, null, 2) : 'No capture data available'}
            </pre>
          </div>
        )
      
      case 'aggregated':
        return (
          <div className="bg-gray-50 rounded-lg p-4 max-h-[60vh] overflow-auto">
            <pre className="text-sm whitespace-pre-wrap text-charcoal">
              {aggregated || 'No aggregated content available'}
            </pre>
          </div>
        )
      
      default:
        return null
    }
  }

  const getTabCount = () => {
    let count = 0
    if (markdown) count++
    if (capture) count++
    if (aggregated) count++
    return count
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-deep-blue mb-1">
              {file ? `File Viewer: ${file}` : `${brand} Content`}
            </h2>
            <div className="flex items-center gap-4 text-sm text-charcoal/70">
              {brand && (
                <span className="capitalize">Brand: {brand.replace('-', ' ')}</span>
              )}
              {url && (
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-vibrant-orange hover:text-vibrant-orange-hover font-medium flex items-center gap-1"
                >
                  View Original ↗
                </a>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        {getTabCount() > 1 && (
          <div className="border-b border-gray-200">
            <div className="flex">
              {markdown && (
                <button
                  onClick={() => setViewMode('markdown')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'markdown'
                      ? 'border-deep-blue text-deep-blue bg-deep-blue-light/10'
                      : 'border-transparent text-charcoal/70 hover:text-charcoal hover:bg-gray-50'
                  }`}
                >
                  📄 Markdown Content
                </button>
              )}
              
              {capture && (
                <button
                  onClick={() => setViewMode('capture')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'capture'
                      ? 'border-deep-blue text-deep-blue bg-deep-blue-light/10'
                      : 'border-transparent text-charcoal/70 hover:text-charcoal hover:bg-gray-50'
                  }`}
                >
                  🌐 Network Capture
                </button>
              )}
              
              {aggregated && (
                <button
                  onClick={() => setViewMode('aggregated')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'aggregated'
                      ? 'border-deep-blue text-deep-blue bg-deep-blue-light/10'
                      : 'border-transparent text-charcoal/70 hover:text-charcoal hover:bg-gray-50'
                  }`}
                >
                  📊 Aggregated Data
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex-1 overflow-hidden">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-charcoal/60">
            {viewMode === 'markdown' && markdown && `${markdown.length.toLocaleString()} characters`}
            {viewMode === 'capture' && capture && 'Network capture data'}
            {viewMode === 'aggregated' && aggregated && `${aggregated.length.toLocaleString()} characters`}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const content = viewMode === 'markdown' ? markdown : 
                              viewMode === 'capture' ? JSON.stringify(capture, null, 2) : 
                              aggregated
                
                const blob = new Blob([content], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${brand || 'content'}-${viewMode}.${viewMode === 'capture' ? 'json' : 'txt'}`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="px-4 py-2 border border-deep-blue-light text-deep-blue rounded-lg hover:bg-deep-blue-light/10 font-medium"
            >
              Download
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-deep-blue text-white rounded-lg hover:bg-deep-blue-hover font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
