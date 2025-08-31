import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AdminIndex() {
  // Convenience redirect: /admin -> /admin/crawl-viewer
  redirect('/admin/crawl-viewer')
}

