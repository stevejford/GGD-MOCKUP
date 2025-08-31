export type BomObservation = {
  name: string
  history_product: string
  local_date_time_full: string
  air_temp?: number
  apparent_t?: number
  rel_hum?: number
  wind_spd_kmh?: number
}

export type BomResponse = {
  observations?: {
    data?: BomObservation[]
  }
}

const STATE_FEED: Record<string, string> = {
  VIC: 'IDV60901',
  NSW: 'IDN60901',
  QLD: 'IDQ60901',
  WA: 'IDW60901',
  SA: 'IDS60901',
  ACT: 'IDN60903',
  NT: 'IDD60901',
  TAS: 'IDT60901',
}

export async function getBomWeatherSummary(state: keyof typeof STATE_FEED = 'VIC') {
  const code = STATE_FEED[state]
  if (!code) return undefined
  const url = `http://www.bom.gov.au/fwo/${code}/${code}.json`
  try {
    const res = await fetch(url, { next: { revalidate: 60 * 30 } }) // cache 30m
    if (!res.ok) return undefined
    const json = (await res.json()) as BomResponse
    const obs = json.observations?.data ?? []
    if (!obs.length) return undefined
    // pick the first record (feed is Melbourne-wide; adequate for snapshot)
    const d = obs[0]
    return {
      station: d.name,
      observedAt: d.local_date_time_full,
      temp: d.air_temp,
      feelsLike: d.apparent_t,
      humidity: d.rel_hum,
      windKmh: d.wind_spd_kmh,
    }
  } catch {
    return undefined
  }
}

