import type { MetadataRoute } from 'next'
import { getAllServiceAreaSlugs } from '@/lib/service-areas-data'
import { getAllBrandSlugs } from '@/lib/brands-data'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/about-us',
    '/contact',
    '/our-work',
    '/brands',
    '/solutions/for-volume-builders',
    '/solutions/for-custom-home-builders',
    '/solutions/for-architects',
    '/technical-resources',
    '/service-areas',
  ]

  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${baseUrl}${path || '/'}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  const areaEntries: MetadataRoute.Sitemap = getAllServiceAreaSlugs().map((slug) => ({
    url: `${baseUrl}/service-areas/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const brandEntries: MetadataRoute.Sitemap = getAllBrandSlugs().map((slug) => ({
    url: `${baseUrl}/brands/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticEntries, ...areaEntries, ...brandEntries]
}
