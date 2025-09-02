"use client"
import { useEffect, useState } from 'react'

interface PageData {
  brand: string
  file: string
  url: string
  title: string
  description?: string
  h1?: string
  markdownContent: string
  assets: {
    page_url: string
    asset_urls: string[]
    image_urls: string[]
    pdf_urls: string[]
    txt_urls: string[]
  }
  embeddings: Array<{
    id: number
    brand: string
    file: string
    chunk_index: number
    url: string
    content: string
  }>
  localAssetPaths: string[]
}

interface ContentAnalysis {
  brand: string
  file: string
  title: string
  url: string
  contentLength: number
  assetCount: number
  embeddingCount: number
}

export default function ContentRecreatorPanel() {
  const [brands, setBrands] = useState<string[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState('')
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis[]>([])
  const [rewordSuggestions, setRewordSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'explore' | 'analyze' | 'recreate'>('explore')

  // Load brands on component mount
  useEffect(() => {
    loadBrands()
  }, [])

  // Load files when brand changes
  useEffect(() => {
    if (selectedBrand) {
      loadFiles(selectedBrand)
    }
  }, [selectedBrand])

  const loadBrands = async () => {
    try {
      const res = await fetch('/api/admin/content-recreator?action=brands')
      const data = await res.json()
      if (data.ok) {
        setBrands(data.brands)
      }
    } catch (error) {
      console.error('Failed to load brands:', error)
    }
  }

  const loadFiles = async (brand: string) => {
    try {
      const res = await fetch(`/api/admin/content-recreator?action=files&brand=${brand}`)
      const data = await res.json()
      if (data.ok) {
        setFiles(data.files)
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }

  const loadPageData = async () => {
    if (!selectedBrand || !selectedFile) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/content-recreator?action=page-data&brand=${selectedBrand}&file=${selectedFile}`)
      const data = await res.json()
      if (data.ok) {
        setPageData(data.data)
      } else {
        setError(data.error || 'Failed to load page data')
      }
    } catch (error) {
      setError('Failed to load page data')
    } finally {
      setLoading(false)
    }
  }

  const generateRewordSuggestions = async (content: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/content-recreator?action=reword-suggestions&content=${encodeURIComponent(content)}`)
      const data = await res.json()
      if (data.ok) {
        setRewordSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeContentGaps = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/content-recreator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-content-gaps',
          targetBrand: 'geelong-garage-doors'
        })
      })
      const data = await res.json()
      if (data.ok) {
        setContentAnalysis(data.analysis)
      } else {
        setError(data.error || 'Failed to analyze content')
      }
    } catch (error) {
      setError('Failed to analyze content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
      <div className="p-6 border-b border-deep-blue-light">
        <h2 className="text-xl font-semibold text-deep-blue mb-2">Content Recreation Tool</h2>
        <p className="text-charcoal/70 text-sm">
          Analyze competitor content, match embeddings to assets, and create reworded versions for your brand.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-deep-blue-light">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'explore', label: 'Explore Content' },
            { id: 'analyze', label: 'Content Analysis' },
            { id: 'recreate', label: 'Recreate Pages' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-deep-blue text-deep-blue'
                  : 'border-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Explore Content Tab */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full border border-deep-blue-light rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                >
                  <option value="">Select brand...</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Page</label>
                <select
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  disabled={!selectedBrand}
                  className="w-full border border-deep-blue-light rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue disabled:bg-gray-100"
                >
                  <option value="">Select page...</option>
                  {files.map(file => (
                    <option key={file} value={file}>{file.replace('.md', '')}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={loadPageData}
                  disabled={!selectedBrand || !selectedFile || loading}
                  className="w-full bg-deep-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-deep-blue-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Loading...' : 'Load Page Data'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {pageData && (
              <div className="space-y-6">
                <div className="bg-deep-blue-light rounded-lg p-4">
                  <h3 className="font-semibold text-deep-blue mb-2">{pageData.title}</h3>
                  <p className="text-sm text-charcoal/70 mb-2">{pageData.url}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Content Length:</span>
                      <span className="ml-2">{pageData.markdownContent.length.toLocaleString()} chars</span>
                    </div>
                    <div>
                      <span className="font-medium">Images:</span>
                      <span className="ml-2">{pageData.assets.image_urls.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">PDFs:</span>
                      <span className="ml-2">{pageData.assets.pdf_urls.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">Embeddings:</span>
                      <span className="ml-2">{pageData.embeddings.length}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-charcoal mb-3">Content Preview</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-charcoal whitespace-pre-wrap">
                        {pageData.markdownContent.substring(0, 1000)}
                        {pageData.markdownContent.length > 1000 && '...'}
                      </pre>
                    </div>
                    <button
                      onClick={() => generateRewordSuggestions(pageData.markdownContent.substring(0, 500))}
                      className="mt-3 bg-vibrant-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-vibrant-orange-hover transition-colors"
                    >
                      Generate Reword Suggestions
                    </button>
                  </div>

                  <div>
                    <h4 className="font-semibold text-charcoal mb-3">Assets ({pageData.assets.image_urls.length})</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {pageData.assets.image_urls.slice(0, 10).map((url, index) => (
                        <div key={index} className="text-xs text-charcoal/70 mb-1 break-all">
                          {url.split('/').pop()}
                        </div>
                      ))}
                      {pageData.assets.image_urls.length > 10 && (
                        <div className="text-xs text-charcoal/50">
                          ... and {pageData.assets.image_urls.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {rewordSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-charcoal mb-3">Reword Suggestions</h4>
                    <div className="space-y-3">
                      {rewordSuggestions.map((suggestion, index) => (
                        <div key={index} className="bg-vibrant-orange-light rounded-lg p-4">
                          <div className="text-sm font-medium text-charcoal mb-2">Suggestion {index + 1}:</div>
                          <div className="text-sm text-charcoal/80">
                            {suggestion.substring(0, 200)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content Analysis Tab */}
        {activeTab === 'analyze' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-charcoal">Content Gap Analysis</h3>
                <p className="text-sm text-charcoal/70">
                  Analyze competitor content to identify opportunities for your brand.
                </p>
              </div>
              <button
                onClick={analyzeContentGaps}
                disabled={loading}
                className="bg-deep-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-deep-blue-hover disabled:bg-gray-300 transition-colors"
              >
                {loading ? 'Analyzing...' : 'Analyze Content Gaps'}
              </button>
            </div>

            {contentAnalysis.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border border-deep-blue-light rounded-lg">
                  <thead className="bg-deep-blue-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-deep-blue">Brand</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-deep-blue">Page</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-deep-blue">Content</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-deep-blue">Assets</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-deep-blue">Embeddings</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-deep-blue">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-deep-blue-light">
                    {contentAnalysis.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-charcoal">{item.brand}</td>
                        <td className="px-4 py-3 text-sm text-charcoal">{item.title}</td>
                        <td className="px-4 py-3 text-sm text-charcoal">{item.contentLength.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-charcoal">{item.assetCount}</td>
                        <td className="px-4 py-3 text-sm text-charcoal">{item.embeddingCount}</td>
                        <td className="px-4 py-3">
                          <button className="text-vibrant-orange hover:text-vibrant-orange-hover text-sm font-medium">
                            Recreate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Recreate Pages Tab */}
        {activeTab === 'recreate' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🚧</div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">Page Recreation Coming Soon</h3>
              <p className="text-charcoal/70">
                This feature will allow you to automatically recreate competitor pages with reworded content and matched assets.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
