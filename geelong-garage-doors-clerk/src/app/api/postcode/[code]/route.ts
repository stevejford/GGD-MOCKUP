import { NextRequest } from 'next/server'

// Single POA boundary for a postcode (e.g., /api/postcode/3215)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params
  if (!code || !/^\d{4}$/.test(code)) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_postcode' }), { status: 400 })
  }
  const base = 'https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/POA/FeatureServer/0/query'
  const qs = new URLSearchParams({
    where: `poa_code_2021='${code}'`,
    outFields: 'poa_code_2021,poa_name_2021',
    outSR: '4326',
    f: 'geojson',
  })
  const url = `${base}?${qs.toString()}`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return new Response(JSON.stringify({ ok: false }), { status: 200 })
    const data = await res.json()
    return new Response(JSON.stringify({ ok: true, geojson: data }), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 200 })
  }
}

