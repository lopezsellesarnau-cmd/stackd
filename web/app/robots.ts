import type { MetadataRoute } from 'next'

/**
 * Antes la web iba con `noindex` global, así que un robots.txt no pintaba nada.
 * Desde que es indexable sí: le dice al buscador que puede pasar y dónde está
 * el sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://www.stackd.codes/sitemap.xml',
  }
}
