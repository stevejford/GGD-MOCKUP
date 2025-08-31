export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-guard'
import { readBrandFile } from '@/lib/crawl-reader'

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const brand = searchParams.get('brand')
    const file = searchParams.get('file')

    if (!brand || !file) {
      return Response.json({
        ok: false,
        error: 'Missing required parameters: brand and file'
      }, { status: 400 })
    }

    try {
      const data = await readBrandFile(brand, file)
      
      return Response.json({
        ok: true,
        content: data.markdown,
        url: data.url,
        capture: data.capture
      })
    } catch (error: any) {
      console.error('Error reading brand file:', error)
      return Response.json({
        ok: false,
        error: error.message || 'Failed to read file'
      }, { status: 404 })
    }

  } catch (error: any) {
    console.error('File API error:', error)
    return Response.json(
      { ok: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
