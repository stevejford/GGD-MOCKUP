"use client"
import { useState, useEffect } from 'react'
import PlateEditor from '@/components/cms/PlateEditor'
import { Descendant } from 'slate'

interface CompetitorPage {
  brand: string
  file: string
  title: string
  url: string
  content: string
  assets: any[]
}

interface RecreatedPage {
  title: string
  slug: string
  content_json: Descendant[]
  content_html: string
  content_markdown: string
  meta_description: string
  meta_keywords: string[]
  featured_image?: string
  assets: any[]
  seo_score: number
  reading_time: number
  original_brand: string
  original_url: string
  original_file: string
}

export default function PageRecreationPanel() {
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedFile, setSelectedFile] = useState('')
  const [brands, setBrands] = useState<string[]>([])
  const [files, setFiles] = useState<string[]>([])
  const [pageData, setPageData] = useState<CompetitorPage | null>(null)
  const [recreatedPage, setRecreatedPage] = useState<RecreatedPage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'select' | 'preview' | 'edit' | 'publish'>('select')

  // Recreation options
  const [rewriteMethod, setRewriteMethod] = useState<'light' | 'medium' | 'heavy'>('medium')
  const [contentType, setContentType] = useState<'blog' | 'product' | 'service'>('blog')
  const [targetAudience, setTargetAudience] = useState<'residential' | 'commercial' | 'trade'>('residential')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'technical'>('professional')
  const [includeAssets, setIncludeAssets] = useState(true)

  // Load brands on mount
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
      const response = await fetch('/api/admin/content-recreator?action=brands')
      const data = await response.json()
      if (data.ok) {
        setBrands(data.brands)
      }
    } catch (error) {
      console.error('Error loading brands:', error)
    }
  }

  const loadFiles = async (brand: string) => {
    try {
      const response = await fetch(`/api/admin/content-recreator?action=files&brand=${brand}`)
      const data = await response.json()
      if (data.ok) {
        setFiles(data.files)
      }
    } catch (error) {
      console.error('Error loading files:', error)
    }
  }

  const loadPageData = async () => {
    if (!selectedBrand || !selectedFile) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/content-recreator?action=page-data&brand=${selectedBrand}&file=${selectedFile}`)
      const data = await response.json()
      if (data.ok) {
        setPageData(data.data)
        setActiveTab('preview')
      } else {
        setError(data.error || 'Failed to load page data')
      }
    } catch (error) {
      setError('Failed to load page data')
    } finally {
      setLoading(false)
    }
  }

  const recreatePage = async () => {
    if (!selectedBrand || !selectedFile) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/content-recreator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recreate-page',
          brand: selectedBrand,
          file: selectedFile,
          options: {
            rewriteMethod,
            contentType,
            targetAudience,
            tone,
            includeAssets
          }
        })
      })

      const data = await response.json()
      if (data.ok) {
        setRecreatedPage(data.recreatedPage)
        setActiveTab('edit')
      } else {
        setError(data.error || 'Failed to recreate page')
      }
    } catch (error) {
      setError('Failed to recreate page')
    } finally {
      setLoading(false)
    }
  }

  const saveContent = async (status: 'draft' | 'pending_approval') => {
    if (!recreatedPage) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/content-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          content: {
            ...recreatedPage,
            status,
            rewrite_method: rewriteMethod,
            created_by: 'admin'
          },
          assets: recreatedPage.assets
        })
      })

      const data = await response.json()
      if (data.ok) {
        setActiveTab('publish')
      } else {
        setError(data.error || 'Failed to save content')
      }
    } catch (error) {
      setError('Failed to save content')
    } finally {
      setLoading(false)
    }
  }

  const updateContent = (newContent: Descendant[]) => {
    if (recreatedPage) {
      setRecreatedPage({
        ...recreatedPage,
        content_json: newContent
      })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
      <div className="p-6 border-b border-deep-blue-light">
        <h2 className="text-xl font-semibold text-deep-blue mb-2">Page Recreation Engine</h2>
        <p className="text-charcoal/70 text-sm">
          Recreate competitor pages with AI-powered rewriting and brand integration.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-deep-blue-light">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'select', label: 'Select Page', icon: '📄' },
            { id: 'preview', label: 'Preview', icon: '👁️' },
            { id: 'edit', label: 'Edit Content', icon: '✏️' },
            { id: 'publish', label: 'Publish', icon: '🚀' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              disabled={
                (tab.id === 'preview' && !pageData) ||
                (tab.id === 'edit' && !recreatedPage) ||
                (tab.id === 'publish' && !recreatedPage)
              }
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-deep-blue text-deep-blue'
                  : 'border-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/30 disabled:text-charcoal/30 disabled:cursor-not-allowed'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Select Page Tab */}
        {activeTab === 'select' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Select Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value)
                    setSelectedFile('')
                    setPageData(null)
                    setRecreatedPage(null)
                  }}
                  className="w-full border border-deep-blue-light rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                >
                  <option value="">Choose a brand...</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Select Page</label>
                <select
                  value={selectedFile}
                  onChange={(e) => {
                    setSelectedFile(e.target.value)
                    setPageData(null)
                    setRecreatedPage(null)
                  }}
                  disabled={!selectedBrand}
                  className="w-full border border-deep-blue-light rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue disabled:bg-gray-100"
                >
                  <option value="">Choose a page...</option>
                  {files.map(file => (
                    <option key={file} value={file}>{file.replace('.md', '')}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedBrand && selectedFile && (
              <div className="bg-deep-blue-light rounded-lg p-6">
                <h3 className="text-lg font-semibold text-deep-blue mb-4">Recreation Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Rewrite Method</label>
                    <select
                      value={rewriteMethod}
                      onChange={(e) => setRewriteMethod(e.target.value as any)}
                      className="w-full border border-deep-blue-light rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                    >
                      <option value="light">Light - Minimal changes</option>
                      <option value="medium">Medium - Improved content</option>
                      <option value="heavy">Heavy - Complete rewrite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Content Type</label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value as any)}
                      className="w-full border border-deep-blue-light rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                    >
                      <option value="blog">Blog Post</option>
                      <option value="product">Product Page</option>
                      <option value="service">Service Page</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Target Audience</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value as any)}
                      className="w-full border border-deep-blue-light rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="trade">Trade Professionals</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Tone</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as any)}
                      className="w-full border border-deep-blue-light rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeAssets}
                        onChange={(e) => setIncludeAssets(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-charcoal">Include Assets</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={loadPageData}
                    disabled={loading}
                    className="bg-deep-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-deep-blue-hover disabled:bg-gray-300 transition-colors"
                  >
                    {loading ? 'Loading...' : '👁️ Preview Original'}
                  </button>
                  
                  <button
                    onClick={recreatePage}
                    disabled={loading}
                    className="bg-vibrant-orange text-white px-6 py-2 rounded-lg font-medium hover:bg-vibrant-orange-hover disabled:bg-gray-300 transition-colors"
                  >
                    {loading ? 'Recreating...' : '🤖 Recreate with AI'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && pageData && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-charcoal">{pageData.title}</h3>
                  <p className="text-sm text-charcoal/70">{pageData.brand} • {pageData.file}</p>
                  {pageData.url && (
                    <a href={pageData.url} target="_blank" rel="noopener noreferrer" className="text-sm text-deep-blue hover:underline">
                      {pageData.url}
                    </a>
                  )}
                </div>
                <span className="bg-deep-blue text-white px-3 py-1 rounded text-sm">Original</span>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-charcoal font-sans">
                    {pageData.content.substring(0, 2000)}
                    {pageData.content.length > 2000 && '...'}
                  </pre>
                </div>
              </div>

              {pageData.assets && pageData.assets.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-charcoal mb-3">Assets ({pageData.assets.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {pageData.assets.slice(0, 8).map((asset, index) => (
                      <div key={index} className="bg-white rounded p-3 border">
                        <div className="text-xs text-charcoal/70 mb-1">
                          {asset.url.split('/').pop()?.substring(0, 20)}...
                        </div>
                        <div className="text-xs text-charcoal/50">
                          {asset.mime_type || 'Unknown type'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Content Tab */}
        {activeTab === 'edit' && recreatedPage && (
          <div className="space-y-6">
            <div className="bg-vibrant-orange-light rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-vibrant-orange">{recreatedPage.title}</h3>
                  <p className="text-sm text-charcoal/70">
                    Recreated from {recreatedPage.original_brand} • {rewriteMethod} rewrite
                  </p>
                  <div className="flex gap-4 text-xs text-charcoal/60 mt-2">
                    <span>📖 {recreatedPage.reading_time} min read</span>
                    <span>📊 SEO Score: {recreatedPage.seo_score}/100</span>
                    <span>🏷️ {recreatedPage.meta_keywords.length} keywords</span>
                  </div>
                </div>
                <span className="bg-vibrant-orange text-white px-3 py-1 rounded text-sm">Recreated</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-charcoal mb-2">Meta Description</h4>
                  <p className="text-sm text-charcoal/80 bg-white rounded p-3">
                    {recreatedPage.meta_description}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-charcoal mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-1">
                    {recreatedPage.meta_keywords.map((keyword, index) => (
                      <span key={index} className="bg-white text-charcoal px-2 py-1 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <PlateEditor
              initialValue={recreatedPage.content_json}
              onChange={updateContent}
              placeholder="Edit your recreated content..."
              className="min-h-[500px]"
            />

            <div className="flex gap-4">
              <button
                onClick={() => saveContent('draft')}
                disabled={loading}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 disabled:bg-gray-300 transition-colors"
              >
                {loading ? 'Saving...' : '💾 Save as Draft'}
              </button>
              
              <button
                onClick={() => saveContent('pending_approval')}
                disabled={loading}
                className="bg-vibrant-orange text-white px-6 py-2 rounded-lg font-medium hover:bg-vibrant-orange-hover disabled:bg-gray-300 transition-colors"
              >
                {loading ? 'Submitting...' : '📋 Submit for Approval'}
              </button>
            </div>
          </div>
        )}

        {/* Publish Tab */}
        {activeTab === 'publish' && (
          <div className="text-center py-12">
            <div className="bg-green-50 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-green-600 mb-2">Content Saved Successfully!</h3>
              <p className="text-sm text-green-700 mb-4">
                Your recreated page has been saved and is ready for the approval workflow.
              </p>
              <button
                onClick={() => {
                  setActiveTab('select')
                  setSelectedBrand('')
                  setSelectedFile('')
                  setPageData(null)
                  setRecreatedPage(null)
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Create Another Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
