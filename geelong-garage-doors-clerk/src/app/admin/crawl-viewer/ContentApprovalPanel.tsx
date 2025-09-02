"use client"
import { useState, useEffect } from 'react'
import PlateEditor from '@/components/cms/PlateEditor'
import { Descendant } from 'slate'

interface ContentItem {
  id: number
  title: string
  slug: string
  content_type: 'blog' | 'product' | 'service'
  original_brand: string
  original_url: string
  rewrite_method: 'light' | 'medium' | 'heavy'
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'rejected'
  content_json: Descendant[]
  content_html: string
  meta_description: string
  meta_keywords: string[]
  featured_image?: string
  seo_score: number
  reading_time: number
  created_by: string
  created_at: string
  updated_at: string
  approved_by?: string
  approved_at?: string
  published_at?: string
}

interface ContentStats {
  byStatus: Record<string, number>
  byType: Record<string, number>
  total: number
}

export default function ContentApprovalPanel() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [stats, setStats] = useState<ContentStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'published' | 'rejected' | 'all'>('pending')
  const [showPreview, setShowPreview] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const itemsPerPage = 10

  useEffect(() => {
    loadStats()
    loadContent()
  }, [activeTab, currentPage])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/content-manager?action=stats')
      const data = await response.json()
      if (data.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadContent = async () => {
    setLoading(true)
    setError('')
    try {
      const status = activeTab === 'all' ? '' : activeTab
      const response = await fetch(
        `/api/admin/content-manager?action=list&status=${status}&limit=${itemsPerPage}&offset=${currentPage * itemsPerPage}`
      )
      const data = await response.json()
      
      if (data.ok) {
        if (currentPage === 0) {
          setContentItems(data.content)
        } else {
          setContentItems(prev => [...prev, ...data.content])
        }
        setHasMore(data.pagination.hasMore)
      } else {
        setError(data.error || 'Failed to load content')
      }
    } catch (error) {
      setError('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const changeStatus = async (itemId: number, newStatus: 'approved' | 'rejected' | 'published') => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/content-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-status',
          id: itemId,
          status: newStatus,
          approvedBy: 'admin' // In real app, get from auth context
        })
      })

      const data = await response.json()
      if (data.ok) {
        // Refresh content and stats
        setCurrentPage(0)
        await loadStats()
        await loadContent()
        setSelectedItem(null)
      } else {
        setError(data.error || 'Failed to update status')
      }
    } catch (error) {
      setError('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const deleteContent = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/content-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id: itemId
        })
      })

      const data = await response.json()
      if (data.ok) {
        setCurrentPage(0)
        await loadStats()
        await loadContent()
        setSelectedItem(null)
      } else {
        setError(data.error || 'Failed to delete content')
      }
    } catch (error) {
      setError('Failed to delete content')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-600'
      case 'pending_approval': return 'bg-yellow-100 text-yellow-600'
      case 'approved': return 'bg-green-100 text-green-600'
      case 'published': return 'bg-blue-100 text-blue-600'
      case 'rejected': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'Pending Approval'
      default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
      <div className="p-6 border-b border-deep-blue-light">
        <h2 className="text-xl font-semibold text-deep-blue mb-2">Content Approval Workflow</h2>
        <p className="text-charcoal/70 text-sm">
          Review and approve AI-generated content before publishing.
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="p-6 border-b border-deep-blue-light bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.pending_approval || 0}</div>
              <div className="text-sm text-charcoal/70">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.byStatus.approved || 0}</div>
              <div className="text-sm text-charcoal/70">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.byStatus.published || 0}</div>
              <div className="text-sm text-charcoal/70">Published</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.byStatus.draft || 0}</div>
              <div className="text-sm text-charcoal/70">Drafts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-deep-blue">{stats.total}</div>
              <div className="text-sm text-charcoal/70">Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-deep-blue-light">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'pending', label: 'Pending Approval', count: stats?.byStatus.pending_approval || 0 },
            { id: 'approved', label: 'Approved', count: stats?.byStatus.approved || 0 },
            { id: 'published', label: 'Published', count: stats?.byStatus.published || 0 },
            { id: 'rejected', label: 'Rejected', count: stats?.byStatus.rejected || 0 },
            { id: 'all', label: 'All Content', count: stats?.total || 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any)
                setCurrentPage(0)
                setSelectedItem(null)
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-deep-blue text-deep-blue'
                  : 'border-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/30'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="bg-deep-blue-light text-deep-blue px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-charcoal">
              {getStatusLabel(activeTab)} Content
            </h3>
            
            {contentItems.length === 0 && !loading ? (
              <div className="text-center py-8 text-charcoal/60">
                No content found for this status.
              </div>
            ) : (
              <div className="space-y-3">
                {contentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedItem?.id === item.id ? 'border-deep-blue bg-deep-blue-light/20' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-charcoal line-clamp-1">{item.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-charcoal/70 line-clamp-2 mb-2">
                      {item.meta_description}
                    </p>
                    
                    <div className="flex justify-between items-center text-xs text-charcoal/60">
                      <div className="flex gap-3">
                        <span>📄 {item.content_type}</span>
                        <span>🔄 {item.rewrite_method}</span>
                        <span>📊 {item.seo_score}/100</span>
                      </div>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={loading}
                    className="w-full py-2 text-sm text-deep-blue hover:bg-deep-blue-light/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content Preview/Editor */}
          <div className="space-y-4">
            {selectedItem ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-charcoal">{selectedItem.title}</h3>
                    <p className="text-sm text-charcoal/70">
                      From {selectedItem.original_brand} • {selectedItem.rewrite_method} rewrite
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="px-3 py-1 text-sm bg-gray-100 text-charcoal rounded hover:bg-gray-200 transition-colors"
                    >
                      {showPreview ? '✏️ Edit' : '👁️ Preview'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>SEO Score:</strong> {selectedItem.seo_score}/100
                    </div>
                    <div>
                      <strong>Reading Time:</strong> {selectedItem.reading_time} min
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(selectedItem.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Created By:</strong> {selectedItem.created_by}
                    </div>
                  </div>
                </div>

                {showPreview ? (
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: selectedItem.content_html }} />
                  </div>
                ) : (
                  <PlateEditor
                    initialValue={selectedItem.content_json}
                    readOnly={true}
                    className="max-h-96 overflow-y-auto"
                  />
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedItem.status === 'pending_approval' && (
                    <>
                      <button
                        onClick={() => changeStatus(selectedItem.id, 'approved')}
                        disabled={loading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => changeStatus(selectedItem.id, 'rejected')}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 transition-colors"
                      >
                        ❌ Reject
                      </button>
                    </>
                  )}
                  
                  {selectedItem.status === 'approved' && (
                    <button
                      onClick={() => changeStatus(selectedItem.id, 'published')}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                    >
                      🚀 Publish
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteContent(selectedItem.id)}
                    disabled={loading}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 disabled:bg-gray-300 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-charcoal/60">
                Select content from the list to review and approve.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
