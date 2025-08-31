import { NextRequest } from 'next/server'
import { serviceAreasData } from '@/lib/service-areas-data'

export async function GET(_req: NextRequest) {
  const codes = Array.from(new Set(serviceAreasData.map((a) => a.postcode).filter((c) => /^\d{4}$/.test(c))))
  if (!codes.length) return new Response(JSON.stringify({ ok: false, error: 'no_codes' }), { status: 200 })

  const where = `poa_code_2021 IN ('${codes.join("','")}')`
  const base = 'https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/POA/FeatureServer/0/query'
  const qs = new URLSearchParams({ where, outFields: 'poa_code_2021,poa_name_2021', outSR: '4326', f: 'geojson' })
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

