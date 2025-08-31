import { headers } from 'next/headers'

function isPrivate(ip: string) {
  if (!ip) return true
  const v = ip.trim().toLowerCase()
  return (
    v === '::1' ||
    v.startsWith('127.') ||
    v.startsWith('10.') ||
    v.startsWith('192.168.') ||
    (v.startsWith('172.') && (() => { const o = parseInt(v.split('.')[1] || '0', 10); return o >= 16 && o <= 31 })()) ||
    v.startsWith('fc') || // IPv6 unique local
    v.startsWith('fd') ||
    v.startsWith('fe80:')
  )
}

export async function GET(req: Request) {
  const token = process.env.IPINFO_TOKEN
  const hdrs = await headers()

  // Optional override for local testing: /api/geo?ip=8.8.8.8
  const urlObj = new URL(req.url)
  const overrideIp = (urlObj.searchParams.get('ip') || '').trim()

  // Try common headers in order, collect candidates
  const candidates: string[] = []
  const fwd = hdrs.get('x-forwarded-for') || ''
  if (fwd) candidates.push(...fwd.split(',').map((s) => s.trim()))
  const real = hdrs.get('x-real-ip') || ''
  if (real) candidates.push(real)
  const cf = hdrs.get('cf-connecting-ip') || ''
  if (cf) candidates.push(cf)

  // Choose the first non-private IP, or use override
  let ip = overrideIp && !isPrivate(overrideIp) ? overrideIp : ''
  if (!ip) ip = candidates.find((c) => c && !isPrivate(c)) || ''

  const base = 'https://ipinfo.io'

  // If IP is private/loopback (local dev), call /json without explicit IP so ipinfo uses request origin
  const target = ip ? `${base}/${ip}/json` : `${base}/json`
  const primaryUrl = token ? `${target}?token=${token}` : target

  try {
    let res = await fetch(primaryUrl, { cache: 'no-store' })
    if (!res.ok) return new Response(JSON.stringify({ ok: false }), { status: 200 })
    let data = await res.json()

    // If we explicitly queried a private/bogon or response marks bogon, retry with /json (me)
    if (data?.bogon || !data?.loc) {
      const meUrl = token ? `${base}/json?token=${token}` : `${base}/json`
      const res2 = await fetch(meUrl, { cache: 'no-store' })
      if (res2.ok) {
        data = await res2.json()
      }
    }

    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 200 })
  }
}
