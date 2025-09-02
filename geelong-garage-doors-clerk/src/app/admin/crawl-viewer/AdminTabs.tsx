"use client"
import { useState } from 'react'
import AdminStatus from './AdminStatus'
import AdminDashboard from './AdminDashboard'
import ScrapeControls from './ScrapeControls'
import AdminSearchPanel from './AdminSearchPanel'
import AdminEmbedPanel from './AdminEmbedPanel'
import AdminAggregatePanel from './AdminAggregatePanel'
import FileBrowserTab from './FileBrowserTab'
import LogfireDashboard from '@/components/LogfireDashboard'
import ContentRecreatorPanel from './ContentRecreatorPanel'
import AIBlogGenerator from './AIBlogGenerator'
import PageRecreationPanel from './PageRecreationPanel'
import ContentApprovalPanel from './ContentApprovalPanel'

type TabId = 'dashboard' | 'crawler' | 'search' | 'files' | 'tools' | 'recreator' | 'page-recreation' | 'ai-blog' | 'content-approval' | 'logfire'

interface Tab {
  id: TabId
  label: string
  icon: string
  description: string
}

const tabs: Tab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    description: 'System overview and statistics'
  },
  {
    id: 'crawler',
    label: 'Crawler',
    icon: '🕷️',
    description: 'Start and manage crawling operations'
  },
  {
    id: 'search',
    label: 'Search',
    icon: '🔍',
    description: 'AI-powered content search'
  },
  {
    id: 'files',
    label: 'Files',
    icon: '📁',
    description: 'Browse and view crawled files'
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: '🛠️',
    description: 'Embeddings and data processing'
  },
  {
    id: 'recreator',
    label: 'Content Recreator',
    icon: '🎨',
    description: 'Recreate competitor pages with reworded content'
  },
  {
    id: 'page-recreation',
    label: 'Page Recreation Engine',
    icon: '🏭',
    description: 'AI-powered page recreation with brand integration and CMS'
  },
  {
    id: 'ai-blog',
    label: 'AI Blog Generator',
    icon: '🤖',
    description: 'Generate intelligent blog posts using OpenAI and embeddings'
  },
  {
    id: 'content-approval',
    label: 'Content Approval',
    icon: '✅',
    description: 'Review and approve AI-generated content before publishing'
  },
  {
    id: 'logfire',
    label: 'Logfire',
    icon: '🔥',
    description: 'Real-time monitoring and analytics'
  }
]

interface AdminTabsProps {
  brands: string[]
  selectedBrand?: string
  selectedFile?: string
  files: string[]
  markdown: string
  url: string
  capture: any
  aggregated: string
}

export default function AdminTabs({
  brands,
  selectedBrand,
  selectedFile,
  files,
  markdown,
  url,
  capture,
  aggregated
}: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <AdminStatus />
            <AdminDashboard />
          </div>
        )
      
      case 'crawler':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
            <div className="p-6 border-b border-deep-blue-light">
              <h2 className="text-xl font-semibold text-deep-blue mb-2">Crawler Controls</h2>
              <p className="text-charcoal/70 text-sm">Start and manage crawling operations with simplified settings</p>
            </div>
            <div className="p-6">
              <ScrapeControls />
            </div>
          </div>
        )
      
      case 'search':
        return <AdminSearchPanel />
      
      case 'files':
        return (
          <FileBrowserTab
            brands={brands}
            selectedBrand={selectedBrand}
            selectedFile={selectedFile}
            files={files}
            markdown={markdown}
            url={url}
            capture={capture}
            aggregated={aggregated}
          />
        )
      
      case 'tools':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
              <div className="p-6 border-b border-deep-blue-light">
                <h2 className="text-xl font-semibold text-deep-blue mb-2">Vector Embeddings</h2>
                <p className="text-charcoal/70 text-sm">Generate and manage AI embeddings for semantic search</p>
              </div>
              <div className="p-6">
                <AdminEmbedPanel />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
              <div className="p-6 border-b border-deep-blue-light">
                <h2 className="text-xl font-semibold text-deep-blue mb-2">Data Aggregation</h2>
                <p className="text-charcoal/70 text-sm">Combine and process brand data into unified files</p>
              </div>
              <div className="p-6">
                <AdminAggregatePanel />
              </div>
            </div>
          </div>
        )

      case 'recreator':
        return <ContentRecreatorPanel />

      case 'page-recreation':
        return <PageRecreationPanel />

      case 'ai-blog':
        return <AIBlogGenerator />

      case 'content-approval':
        return <ContentApprovalPanel />

      case 'logfire':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light">
            <div className="p-6">
              <LogfireDashboard />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 px-6 py-4 text-left border-b-2 transition-all hover:bg-deep-blue-light/5 ${
                activeTab === tab.id
                  ? 'border-deep-blue bg-deep-blue-light/10 text-deep-blue'
                  : 'border-transparent text-charcoal/70 hover:text-charcoal'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{tab.icon}</span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{tab.label}</div>
                  <div className="text-xs opacity-75 truncate">{tab.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  )
}
