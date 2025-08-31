import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { isAdmin } from '@/lib/admin-guard'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      if (!(await isAdmin())) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    const root = process.env.CRAWL_MD_ROOT || path.resolve(process.cwd(), '..', 'crawlforai', 'output_markdown')
    await fs.mkdir(root, { recursive: true })
    return Response.json({ ok: true, root })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'mkdir failed' }, { status: 500 })
  }
}

