"use client"
import { useState, useEffect } from 'react'

interface MarkdownViewerDialogProps {
  isOpen: boolean
  onClose: () => void
  brand: string
  file: string
  url?: string | null
}

export default function MarkdownViewerDialog({
  isOpen,
  onClose,
  brand,
  file,
  url
}: MarkdownViewerDialogProps) {
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && brand && file) {
      loadMarkdown()
    }
  }, [isOpen, brand, file])

  const loadMarkdown = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/crawl/file?brand=${encodeURIComponent(brand)}&file=${encodeURIComponent(file)}`)
      if (!res.ok) throw new Error('Failed to load file')
      const data = await res.json()
      setMarkdown(data.content || 'No content available')
    } catch (err: any) {
      setError(err.message || 'Failed to load markdown')
    } finally {
      setLoading(false)
    }
  }

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${brand}-${file}`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-deep-blue mb-1">
              Markdown Viewer
            </h2>
            <div className="flex items-center gap-4 text-sm text-charcoal/70">
              <span className="capitalize">Brand: {brand.replace('-', ' ')}</span>
              <span>File: {file}</span>
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

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-deep-blue border-t-transparent rounded-full animate-spin"></div>
                <span className="text-charcoal/70">Loading markdown...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-charcoal mb-2">Error Loading File</h3>
                <p className="text-charcoal/60 text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              {/* Rendered Markdown */}
              <div className="p-6">
                <div className="prose prose-lg max-w-none">
                  <div 
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ 
                      __html: renderMarkdownToHtml(markdown) 
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-charcoal/60">
            {markdown && `${markdown.length.toLocaleString()} characters`}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={downloadMarkdown}
              disabled={!markdown}
              className="px-4 py-2 border border-deep-blue-light text-deep-blue rounded-lg hover:bg-deep-blue-light/10 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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

// Simple markdown to HTML converter
function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return ''
  
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-deep-blue mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-deep-blue mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-deep-blue mt-8 mb-6">$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-vibrant-orange hover:text-vibrant-orange-hover underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-sm my-4" />')
    
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded-lg p-4 overflow-x-auto my-4"><code class="text-sm">$1</code></pre>')
    
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
    
    // Lists
    .replace(/^\* (.+)$/gim, '<li class="ml-4">• $1</li>')
    .replace(/^- (.+)$/gim, '<li class="ml-4">• $1</li>')
    
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, '<br>')
  
  // Wrap in paragraphs
  html = '<p class="mb-4">' + html + '</p>'
  
  // Clean up empty paragraphs
  html = html.replace(/<p class="mb-4"><\/p>/g, '')
  
  return html
}
