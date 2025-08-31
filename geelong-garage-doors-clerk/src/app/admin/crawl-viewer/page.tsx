import { currentUser } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { isAdmin as checkAdmin } from '@/lib/admin-guard'
import Link from 'next/link'
import { listBrands, listBrandFiles, readBrandFile, readAggregated } from '@/lib/crawl-reader'
import ScrapeControls from './ScrapeControls'
import AdminAggregatePanel from './AdminAggregatePanel'
import AdminTabs from './AdminTabs'

export const dynamic = 'force-dynamic'

const ALLOWED_EMAIL = 'stavejford1@gmail.com'

function isAllowedEmail(user: any) {
  const envEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const envIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  const primary = user?.primaryEmailAddress?.emailAddress?.toLowerCase?.()
  const all = (user?.emailAddresses || []).map((e: any) => e?.emailAddress?.toLowerCase?.()).filter(Boolean)
  if (primary && (primary === ALLOWED_EMAIL || envEmails.includes(primary))) return true
  if (all.includes(ALLOWED_EMAIL)) return true
  if (envEmails.some((e: string) => all.includes(e))) return true
  if (envIds.length && envIds.includes(user?.id)) return true
  return false
}

type PageProps = { searchParams: Promise<{ brand?: string, file?: string }> }

export default async function CrawlViewer({ searchParams }: PageProps) {
  // Unprotect in development
  if (process.env.NODE_ENV !== 'development') {
    const ok = await checkAdmin()
    if (!ok) return notFound()
  }

  const sp = await searchParams
  const brand = sp?.brand
  const file = sp?.file
  const brands = await listBrands()

  let files: string[] = []
  if (brand) files = await listBrandFiles(brand)

  let markdown = ''
  let url = ''
  let capture: any = null
  if (brand && file) {
    const data = await readBrandFile(brand, file)
    markdown = data.markdown
    capture = data.capture
    url = data.url
  }

  const aggregated = brand ? await readAggregated(brand) : ''

  return (
    <main className='px-container max-w-container mx-auto py-8 space-y-8'>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-deep-blue-light p-6">
        <h1 className='text-3xl font-bold text-deep-blue mb-2'>Crawl Viewer Admin</h1>
        <p className='text-charcoal/70'>Manage and monitor your garage door industry data crawling system</p>
        <div className='text-xs text-charcoal/50 mt-2'>Data Path: {process.env.CRAWL_MD_ROOT ?? '../crawlforai/output_markdown'}</div>
      </div>

      {/* Tabbed Interface */}
      <AdminTabs
        brands={brands}
        selectedBrand={brand}
        selectedFile={file}
        files={files}
        markdown={markdown}
        url={url}
        capture={capture}
        aggregated={aggregated}
      />
    </main>
  )
}
