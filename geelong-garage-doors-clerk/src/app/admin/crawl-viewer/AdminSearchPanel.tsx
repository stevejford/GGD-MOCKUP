"use client"
import { useEffect, useState } from 'react'
import MarkdownViewerDialog from './MarkdownViewerDialog'

type Result = {
  brand: string
  file: string
  chunk_index: number
  url: string | null
  content: string
  distance: number
}

export default function AdminSearchPanel() {
  const [brands, setBrands] = useState<string[]>([])
  const [brand, setBrand] = useState<string>('')
  const [q, setQ] = useState('')
  const [k, setK] = useState(10)
  const [metric, setMetric] = useState<'cosine'|'l2'|'ip'>('cosine')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showMarkdownViewer, setShowMarkdownViewer] = useState(false)
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await fetch('/api/crawl/brands', { cache: 'no-store' })
        const data = await res.json()
        setBrands(data.brands || [])
      } catch {}
    }
    loadBrands()
  }, [])

  const run = async () => {
    setBusy(true); setError(''); setResults([])
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q, brand: brand || undefined, k, metric })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Search failed')
      setResults(data.results || [])
    } catch (e: any) {
      setError(e?.message || 'Search failed')
    } finally {
      setBusy(false)
    }
  }

  const openMarkdownViewer = (result: Result) => {
    setSelectedResult(result)
    setShowMarkdownViewer(true)
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
        <div className="p-6 border-b border-deep-blue-light">
          <h2 className="text-xl font-semibold text-deep-blue mb-2">AI Content Search</h2>
          <p className="text-charcoal/70 text-sm">Search through crawled content using semantic vector search</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Main Search Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-charcoal mb-2">Search Query</label>
              <input
                className="w-full border border-deep-blue-light rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue transition-colors"
                placeholder="Enter your search query..."
                value={q}
                onChange={e=>setQ(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && run()}
              />
            </div>

            <div className="lg:w-48">
              <label className="block text-sm font-medium text-charcoal mb-2">Brand Filter</label>
              <select
                className="w-full border border-deep-blue-light rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue transition-colors"
                value={brand}
                onChange={e=>setBrand(e.target.value)}
              >
                <option value="">All brands</option>
                {brands.map(b => (
                  <option key={b} value={b} className="capitalize">{b.replace('-', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="lg:w-32">
              <label className="block text-sm font-medium text-charcoal mb-2">Results</label>
              <input
                className="w-full border border-deep-blue-light rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue transition-colors text-center"
                type="number"
                min={1}
                max={50}
                value={k}
                onChange={e=>setK(parseInt(e.target.value||'5',10))}
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-deep-blue hover:text-deep-blue-hover font-medium flex items-center gap-1"
            >
              Advanced Options
              <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
            </button>

            <button
              onClick={run}
              disabled={busy || !q.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                busy || !q.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-deep-blue text-white hover:bg-deep-blue-hover shadow-sm hover:shadow-md'
              }`}
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </span>
              ) : (
                'Search Content'
              )}
            </button>
          </div>

          {/* Advanced Options Panel */}
          {showAdvanced && (
            <div className="bg-deep-blue-light/10 rounded-lg p-4 border border-deep-blue-light">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Distance Metric</label>
                  <select
                    className="border border-deep-blue-light rounded px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                    value={metric}
                    onChange={e=>setMetric(e.target.value as any)}
                  >
                    <option value="cosine">Cosine Similarity</option>
                    <option value="l2">Euclidean Distance</option>
                    <option value="ip">Inner Product</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-red-700 font-medium">Search Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-deep-blue">
              Search Results ({results.length})
            </h3>
            <div className="text-sm text-charcoal/70">
              Showing top {results.length} matches
            </div>
          </div>

          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={`${r.brand}:${r.file}:${r.chunk_index}:${i}`} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-5">
                  {/* Result Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-deep-blue-light text-deep-blue px-2 py-1 rounded text-xs font-medium">
                        #{i + 1}
                      </div>
                      <div>
                        <div className="font-medium text-deep-blue capitalize">
                          {r.brand.replace('-', ' ')}
                        </div>
                        <div className="text-xs text-charcoal/60">
                          Chunk {r.chunk_index} • Relevance: {((1 - r.distance) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openMarkdownViewer(r)}
                        className="text-deep-blue hover:text-deep-blue-hover text-sm font-medium flex items-center gap-1"
                      >
                        📄 View Full Page
                      </button>

                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-vibrant-orange hover:text-vibrant-orange-hover text-sm font-medium flex items-center gap-1"
                        >
                          View Source ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="text-xs text-charcoal/60 mb-3 font-mono bg-gray-50 px-2 py-1 rounded">
                    {r.file}
                  </div>

                  {/* Content */}
                  <div
                    className="text-sm text-charcoal leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-deep-blue cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => openMarkdownViewer(r)}
                    title="Click to view full page content"
                  >
                    {r.content.slice(0, 500)}{r.content.length > 500 ? '…' : ''}
                    <div className="text-xs text-deep-blue/60 mt-2 flex items-center gap-1">
                      <span>🔍</span>
                      <span>Click to view full page</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!busy && results.length === 0 && q && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-charcoal mb-2">No Results Found</h3>
          <p className="text-charcoal/60 text-sm">
            Try adjusting your search query or selecting a different brand filter.
          </p>
        </div>
      )}

      {/* Markdown Viewer Dialog */}
      {selectedResult && (
        <MarkdownViewerDialog
          isOpen={showMarkdownViewer}
          onClose={() => {
            setShowMarkdownViewer(false)
            setSelectedResult(null)
          }}
          brand={selectedResult.brand}
          file={selectedResult.file}
          url={selectedResult.url}
        />
      )}
    </div>
  )
}

