#!/usr/bin/env node
/*
  Build POA boundaries into public/poa-boundaries.json
  Usage:
    node scripts/build-poa.cjs            # assumes dev/start server on http://localhost:3000
    BASE_URL=http://localhost:3001 node scripts/build-poa.cjs
*/

const fs = require('fs')
const path = require('path')

async function main() {
  const base = process.env.BASE_URL || 'http://localhost:3000'
  const url = `${base.replace(/\/$/, '')}/api/postcodes/all`
  process.stdout.write(`Fetching combined POA boundaries from ${url}...\n`)
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`Request failed: ${res.status}`)
    process.exit(1)
  }
  const json = await res.json()
  if (!json?.ok || !json.geojson) {
    console.error('Unexpected response payload')
    process.exit(1)
  }
  const outDir = path.join(__dirname, '..', 'public')
  const outFile = path.join(outDir, 'poa-boundaries.json')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(json.geojson))
  console.log(`Wrote ${outFile}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

