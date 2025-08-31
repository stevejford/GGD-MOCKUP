export type PixabayHit = {
  id: number
  pageURL: string
  type: string
  tags: string
  previewURL: string
  previewWidth: number
  previewHeight: number
  webformatURL: string
  webformatWidth: number
  webformatHeight: number
  largeImageURL?: string
  imageWidth: number
  imageHeight: number
  imageSize: number
  user_id: number
  user: string
  userImageURL: string
}

export type PixabayResponse = {
  total: number
  totalHits: number
  hits: PixabayHit[]
}

const API_BASE = 'https://pixabay.com/api/'

export async function searchPixabayImages(query: string, opts?: {
  orientation?: 'all' | 'horizontal' | 'vertical'
  perPage?: number
  category?: string
}) {
  const key = process.env.PIXABAY_API_KEY
  if (!key) {
    return { total: 0, totalHits: 0, hits: [] } as PixabayResponse
  }

  const params = new URLSearchParams({
    key,
    q: query,
    image_type: 'photo',
    safesearch: 'true',
    order: 'popular',
    orientation: opts?.orientation ?? 'horizontal',
    per_page: String(opts?.perPage ?? 10),
  })
  if (opts?.category) params.set('category', opts.category)

  const url = `${API_BASE}?${params.toString()}`
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } })
  if (!res.ok) {
    return { total: 0, totalHits: 0, hits: [] } as PixabayResponse
  }
  const data = (await res.json()) as PixabayResponse
  return data
}

export async function findBestLocationImage(location: string) {
  // Try focused queries first, then broaden
  const queries = [
    `${location} modern architecture garage door`,
    `${location} architecture house exterior`,
    `${location} modern home facade`,
  ]

  for (const q of queries) {
    const res = await searchPixabayImages(q, { orientation: 'horizontal', perPage: 20, category: 'buildings' })
    if (res.hits.length) {
      // Prefer wide, high-res images
      const sorted = res.hits
        .filter(h => h.webformatWidth >= 1000 && h.webformatHeight >= 600)
        .sort((a, b) => (b.imageWidth * b.imageHeight) - (a.imageWidth * a.imageHeight))
      const top = (sorted[0] ?? res.hits[0])
      return top
    }
  }
  return undefined
}

