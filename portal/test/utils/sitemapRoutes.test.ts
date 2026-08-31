import fs from 'node:fs'
import path from 'node:path'
import { sitemapRoutes } from 'utils/sitemapRoutes'
import { describe, expect, it } from 'vitest'

// Named on purpose: the previous generator walked the tree and excluded things
// with `!baseRoute.endsWith('demos')`, which is how `[shareAddress]` slipped in.
const excluded: Record<string, string> = {
  '/demos': 'redirects to /ecosystem',
  '/hemi-earn/pool/[shareAddress]': 'dynamic, one URL per pool address',
}

const localeDir = path.join(import.meta.dirname, '../../app/[locale]')

const pageRoutes = function (dir: string, route = ''): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const own = entries.some(entry => entry.isFile() && entry.name === 'page.tsx')
  return [
    ...(own && route ? [route] : []),
    ...entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
      .flatMap(entry =>
        pageRoutes(path.join(dir, entry.name), `${route}/${entry.name}`),
      ),
  ]
}

describe('utils/sitemapRoutes', function () {
  it('should account for every page on disk', function () {
    const listed = sitemapRoutes(true)
    const unaccounted = pageRoutes(localeDir).filter(
      route => !listed.includes(route) && !(route in excluded),
    )
    expect(unaccounted).toEqual([])
  })

  it('should not list a route without a page', function () {
    const onDisk = pageRoutes(localeDir)
    expect(
      sitemapRoutes(true).filter(route => !onDisk.includes(route)),
    ).toEqual([])
  })
})
