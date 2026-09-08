import { type Plugin } from 'vite'

import { locales } from '../i18n/routing'
import { buildSitemap } from '../utils/sitemap'
import { sitemapRoutes } from '../utils/sitemapRoutes'

type Options = {
  baseUrl: string
  includeHemiEarn: boolean
  includeHemiStake: boolean
}

export const sitemap = ({
  baseUrl,
  includeHemiEarn,
  includeHemiStake,
}: Options): Plugin => ({
  applyToEnvironment: environment => environment.name === 'client',
  generateBundle() {
    this.emitFile({
      fileName: 'sitemap.xml',
      source: buildSitemap({
        baseUrl,
        locales,
        routes: sitemapRoutes({ includeHemiEarn, includeHemiStake }),
      }),
      type: 'asset',
    })
  },
  name: 'sitemap',
})
