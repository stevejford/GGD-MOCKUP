import { NextRequest } from 'next/server'

// Batch ABS ASGS 2021 POA query returning GeoJSON for multiple postcodes
// Usage: /api/postcodes?codes=3030,3216,3226
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const codesParam = (url.searchParams.get('codes') || '').trim()
  if (!codesParam) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_codes' }), { status: 400 })
  }
  const codes = Array.from(new Set(
    codesParam
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^\d{4}$/.test(s))
  ))
  if (codes.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_codes' }), { status: 400 })
  }

  // Build IN clause: poa_code_2021 IN ('3030','3216',...)
  const where = `poa_code_2021 IN ('${codes.join("','")}')`
  const base = 'https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/POA/FeatureServer/0/query'
  const qs = new URLSearchParams({
    where,
    outFields: 'poa_code_2021,poa_name_2021',
    outSR: '4326',
    f: 'geojson',
  })
  const target = `${base}?${qs.toString()}`
  try {
    // Do not use Next data cache for large (>2MB) responses
    const res = await fetch(target, { cache: 'no-store' })
    if (!res.ok) return new Response(JSON.stringify({ ok: false }), { status: 200 })
    const data = await res.json()
    return new Response(JSON.stringify({ ok: true, geojson: data }), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 200 })
  }
}
