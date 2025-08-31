import { listBrands } from '@/lib/crawl-reader'
import { isAdmin } from '@/lib/admin-guard'

export async function GET() {
  if (!(await isAdmin())) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  const brands = await listBrands()
  return Response.json({ brands })
}
