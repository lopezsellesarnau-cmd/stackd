import type { MetadataRoute } from 'next'

/**
 * La landing es de una sola página; el sitemap tiene una entrada y ya. Está
 * igualmente porque es lo que Search Console pide para empezar a rastrear.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.stackd.codes',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
