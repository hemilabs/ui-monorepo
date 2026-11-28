import { type Plugin } from 'vite'

import { locales } from '../i18n/routing.ts'
import { buildSitemap } from '../utils/sitemap.ts'
import { sitemapRoutes } from '../utils/sitemapRoutes.ts'

type Options = {
  baseUrl: string
  flags: Parameters<typeof sitemapRoutes>[0]
}

export const sitemap = ({ baseUrl, flags }: Options): Plugin => ({
  applyToEnvironment: environment => environment.name === 'client',
  generateBundle() {
    this.emitFile({
      fileName: 'sitemap.xml',
      source: buildSitemap({
        baseUrl,
        locales,
        routes: sitemapRoutes(flags),
      }),
      type: 'asset',
    })
  },
  name: 'sitemap',
})
