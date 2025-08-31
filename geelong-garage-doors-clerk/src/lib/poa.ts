export async function fetchCombinedPOA(postcodes: string[]) {
  const codes = Array.from(new Set(postcodes.filter((c) => /^\d{4}$/.test(c))))
  if (codes.length === 0) return { type: 'FeatureCollection', features: [] }

  const where = `poa_code_2021 IN ('${codes.join("','")}')`
  const base = 'https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/POA/FeatureServer/0/query'
  const qs = new URLSearchParams({ where, outFields: 'poa_code_2021,poa_name_2021', outSR: '4326', f: 'geojson' })
  const url = `${base}?${qs.toString()}`
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } })
  if (!res.ok) return { type: 'FeatureCollection', features: [] }
  const data = await res.json()
  return data
}

