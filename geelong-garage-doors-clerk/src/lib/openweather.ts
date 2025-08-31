type OWMain = { temp: number; feels_like: number; humidity: number }
type OWWind = { speed: number }
type OWWeather = { description: string; icon: string }
type OWResp = { name?: string; dt?: number; main?: OWMain; wind?: OWWind; weather?: OWWeather[] }

export async function getOpenWeatherCurrent(lat: number, lon: number) {
  const key = process.env.OPENWEATHERMAP_API_KEY
  if (!key) return undefined
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), units: 'metric', appid: key })
  const url = `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`
  try {
    const res = await fetch(url, { next: { revalidate: 60 * 15 } }) // cache 15m
    if (!res.ok) return undefined
    const json = (await res.json()) as OWResp
    const w = json.weather?.[0]
    return {
      city: json.name,
      observedAt: json.dt ? new Date(json.dt * 1000).toISOString() : undefined,
      temp: json.main?.temp,
      feelsLike: json.main?.feels_like,
      humidity: json.main?.humidity,
      windKmh: json.wind?.speed ? Math.round((json.wind.speed || 0) * 3.6) : undefined,
      summary: w?.description,
      icon: w?.icon,
    }
  } catch {
    return undefined
  }
}

