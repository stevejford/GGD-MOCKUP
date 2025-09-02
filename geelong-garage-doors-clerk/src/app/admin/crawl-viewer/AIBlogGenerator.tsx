"use client"
import { useState } from 'react'

interface BlogPost {
  title: string
  metaDescription: string
  content: string
  tags: string[]
  targetKeywords: string[]
  readingTime: number
  seoScore: number
}

interface ContentStrategy {
  suggestedTopics: Array<{
    topic: string
    priority: 'high' | 'medium' | 'low'
    reasoning: string
    competitorCoverage: string[]
    estimatedTraffic: string
  }>
  contentGaps: string[]
  competitiveAdvantages: string[]
  recommendedContentTypes: string[]
}

export default function AIBlogGenerator() {
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState<'residential' | 'commercial' | 'trade'>('residential')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'technical'>('professional')
  const [generatedBlog, setGeneratedBlog] = useState<BlogPost | null>(null)
  const [contentStrategy, setContentStrategy] = useState<ContentStrategy | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'generate' | 'strategy' | 'semantic'>('generate')
  const [semanticQuery, setSemanticQuery] = useState('')
  const [semanticResults, setSemanticResults] = useState<any[]>([])

  const generateBlogPost = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    setLoading(true)
    setError('')
    try {
      // First, get competitor insights using semantic search
      const semanticResponse = await fetch(`/api/admin/content-recreator?action=semantic-search&query=${encodeURIComponent(topic)}&limit=10`)
      const semanticData = await semanticResponse.json()
      
      const competitorInsights = semanticData.ok ? semanticData.results.map((r: any) => r.content) : []

      // Generate blog post with AI
      const response = await fetch('/api/admin/content-recreator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-blog-post',
          topic,
          audience,
          tone,
          competitorInsights
        })
      })

      const data = await response.json()
      if (data.ok) {
        setGeneratedBlog(data.blogPost)
      } else {
        setError(data.error || 'Failed to generate blog post')
      }
    } catch (error) {
      setError('Failed to generate blog post')
    } finally {
      setLoading(false)
    }
  }

  const generateContentStrategy = async () => {
    setLoading(true)
    setError('')
    try {
      // Get competitor data summary
      const competitorData = [
        { brand: 'B&D', topics: ['sectional doors', 'roller doors', 'motors'], contentCount: 493 },
        { brand: 'Steel-Line', topics: ['residential doors', 'commercial doors', 'automation'], contentCount: 456 },
        { brand: '4D Doors', topics: ['premium doors', 'Hormann products', 'installation'], contentCount: 99 },
        { brand: 'Centurion', topics: ['access control', 'automation', 'security'], contentCount: 182 },
        { brand: 'Eco Garage Doors', topics: ['eco-friendly', 'custom doors', 'maintenance'], contentCount: 111 },
        { brand: 'Taurean', topics: ['commercial doors', 'industrial solutions'], contentCount: 28 }
      ]

      const response = await fetch('/api/admin/content-recreator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-content-strategy',
          competitorData
        })
      })

      const data = await response.json()
      if (data.ok) {
        setContentStrategy(data.strategy)
      } else {
        setError(data.error || 'Failed to generate content strategy')
      }
    } catch (error) {
      setError('Failed to generate content strategy')
    } finally {
      setLoading(false)
    }
  }

  const performSemanticSearch = async () => {
    if (!semanticQuery.trim()) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/content-recreator?action=semantic-search&query=${encodeURIComponent(semanticQuery)}&limit=15`)
      const data = await response.json()
      
      if (data.ok) {
        setSemanticResults(data.results)
      } else {
        setError(data.error || 'Failed to perform semantic search')
      }
    } catch (error) {
      setError('Failed to perform semantic search')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
      <div className="p-6 border-b border-deep-blue-light">
        <h2 className="text-xl font-semibold text-deep-blue mb-2">AI Content Creation Engine</h2>
        <p className="text-charcoal/70 text-sm">
          Generate intelligent blog posts and content strategies using your 23,411 embeddings and OpenAI.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-deep-blue-light">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'generate', label: 'Blog Generator', icon: '✍️' },
            { id: 'strategy', label: 'Content Strategy', icon: '📊' },
            { id: 'semantic', label: 'Semantic Search', icon: '🔍' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-deep-blue text-deep-blue'
                  : 'border-transparent text-charcoal/60 hover:text-charcoal hover:border-charcoal/30'
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

        {/* Blog Generator Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-charcoal mb-2">Blog Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., 'Garage Door Maintenance for Commercial Properties'"
                  className="w-full border border-deep-blue-light rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Target Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="w-full border border-deep-blue-light rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="trade">Trade Professionals</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="flex items-end">
                <button
                  onClick={generateBlogPost}
                  disabled={loading || !topic.trim()}
                  className="w-full bg-vibrant-orange text-white px-6 py-2 rounded-lg font-medium hover:bg-vibrant-orange-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Generating...' : '✨ Generate Blog Post'}
                </button>
              </div>
            </div>

            {generatedBlog && (
              <div className="space-y-6">
                <div className="bg-deep-blue-light rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-deep-blue mb-2">{generatedBlog.title}</h3>
                      <p className="text-sm text-charcoal/70 mb-2">{generatedBlog.metaDescription}</p>
                      <div className="flex gap-4 text-xs text-charcoal/60">
                        <span>📖 {generatedBlog.readingTime} min read</span>
                        <span>📊 SEO Score: {generatedBlog.seoScore}/100</span>
                        <span>🏷️ {generatedBlog.tags.length} tags</span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedBlog.content)}
                      className="bg-deep-blue text-white px-3 py-1 rounded text-xs hover:bg-deep-blue-hover transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-charcoal mb-2">Target Keywords</h4>
                      <div className="flex flex-wrap gap-1">
                        {generatedBlog.targetKeywords.map((keyword, index) => (
                          <span key={index} className="bg-vibrant-orange-light text-vibrant-orange px-2 py-1 rounded text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-charcoal mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {generatedBlog.tags.map((tag, index) => (
                          <span key={index} className="bg-deep-blue-light text-deep-blue px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-charcoal mb-3">Generated Content</h4>
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="text-sm text-charcoal whitespace-pre-wrap font-sans">
                      {generatedBlog.content}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Strategy Tab */}
        {activeTab === 'strategy' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-charcoal">AI Content Strategy</h3>
                <p className="text-sm text-charcoal/70">
                  Generate intelligent content strategies based on competitor analysis.
                </p>
              </div>
              <button
                onClick={generateContentStrategy}
                disabled={loading}
                className="bg-deep-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-deep-blue-hover disabled:bg-gray-300 transition-colors"
              >
                {loading ? 'Analyzing...' : '🧠 Generate Strategy'}
              </button>
            </div>

            {contentStrategy && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-deep-blue-light rounded-lg p-4">
                    <h4 className="font-semibold text-deep-blue mb-3">Suggested Topics</h4>
                    <div className="space-y-3">
                      {contentStrategy.suggestedTopics.slice(0, 5).map((topic, index) => (
                        <div key={index} className="bg-white rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-charcoal">{topic.topic}</h5>
                            <span className={`px-2 py-1 rounded text-xs ${
                              topic.priority === 'high' ? 'bg-red-100 text-red-600' :
                              topic.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {topic.priority}
                            </span>
                          </div>
                          <p className="text-sm text-charcoal/70 mb-2">{topic.reasoning}</p>
                          <div className="text-xs text-charcoal/60">
                            <span>📈 {topic.estimatedTraffic}</span>
                            <span className="ml-3">🏢 Covered by: {topic.competitorCoverage.join(', ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-vibrant-orange-light rounded-lg p-4">
                      <h4 className="font-semibold text-vibrant-orange mb-3">Content Gaps</h4>
                      <ul className="space-y-2">
                        {contentStrategy.contentGaps.map((gap, index) => (
                          <li key={index} className="text-sm text-charcoal flex items-start gap-2">
                            <span className="text-vibrant-orange">•</span>
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-600 mb-3">Competitive Advantages</h4>
                      <ul className="space-y-2">
                        {contentStrategy.competitiveAdvantages.map((advantage, index) => (
                          <li key={index} className="text-sm text-charcoal flex items-start gap-2">
                            <span className="text-green-600">✓</span>
                            {advantage}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-charcoal mb-3">Recommended Content Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {contentStrategy.recommendedContentTypes.map((type, index) => (
                      <span key={index} className="bg-deep-blue text-white px-3 py-1 rounded text-sm">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Semantic Search Tab */}
        {activeTab === 'semantic' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-charcoal mb-2">Semantic Search Query</label>
                <input
                  type="text"
                  value={semanticQuery}
                  onChange={(e) => setSemanticQuery(e.target.value)}
                  placeholder="e.g., 'garage door installation process'"
                  className="w-full border border-deep-blue-light rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={performSemanticSearch}
                  disabled={loading || !semanticQuery.trim()}
                  className="bg-deep-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-deep-blue-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Searching...' : '🔍 Search'}
                </button>
              </div>
            </div>

            {semanticResults.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-charcoal">
                  Found {semanticResults.length} semantically similar results
                </h4>
                {semanticResults.map((result, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-charcoal">{result.brand}</span>
                        <span className="text-sm text-charcoal/60">• {result.file}</span>
                      </div>
                      <span className="bg-deep-blue text-white px-2 py-1 rounded text-xs">
                        {(result.similarity * 100).toFixed(1)}% match
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/80 mb-2">
                      {result.content.substring(0, 200)}...
                    </p>
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-deep-blue hover:underline"
                    >
                      {result.url}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
