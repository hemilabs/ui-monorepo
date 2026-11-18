import fs from 'node:fs'
import path from 'node:path'
import { type RouteDefinition, routes } from 'utils/routes'
import { sitemapRoutes } from 'utils/sitemapRoutes'
import { describe, expect, it } from 'vitest'

const flatten = (definitions: readonly RouteDefinition[]): RouteDefinition[] =>
  definitions.flatMap(definition => [
    definition,
    ...flatten(definition.children ?? []),
  ])

// Named on purpose: the previous generator walked the tree and excluded things
// with `!baseRoute.endsWith('demos')`, which is how `[shareAddress]` slipped in.
const excluded: Record<string, string> = {
  '/hemi-earn/vault/[shareAddress]': 'dynamic, one URL per vault address',
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

const allOn = { hemiEarn: true, hemiStakeCalculator: true }
const allOff = { hemiEarn: false, hemiStakeCalculator: false }

describe('utils/sitemapRoutes', function () {
  it('should account for every page on disk', function () {
    const listed = sitemapRoutes(allOn)
    const unaccounted = pageRoutes(localeDir).filter(
      route => !listed.includes(route) && !(route in excluded),
    )
    expect(unaccounted).toEqual([])
  })

  it('should not list a route without a page', function () {
    const onDisk = pageRoutes(localeDir)
    expect(
      sitemapRoutes(allOn).filter(route => !onDisk.includes(route)),
    ).toEqual([])
  })

  it('should mark as redirect exactly the routes whose id ends in Redirect', function () {
    const mismatched = flatten(routes)
      .filter(({ id, redirect }) => id.endsWith('Redirect') !== !!redirect)
      .map(({ id }) => id)
    expect(mismatched).toEqual([])
  })

  it('should return the routes served today', function () {
    const common = [
      '/ecosystem',
      '/get-started',
      '/hemi-stake',
      '/hemi-stake/analytics',
      '/stake',
      '/stake/dashboard',
      '/tunnel',
      '/tunnel/transaction-history',
    ]
    expect(sitemapRoutes(allOff)).toEqual(common)
    expect(sitemapRoutes({ ...allOff, hemiEarn: true })).toEqual(
      [...common, '/hemi-earn'].sort(),
    )
    expect(sitemapRoutes({ ...allOff, hemiStakeCalculator: true })).toEqual(
      [...common, '/hemi-stake/estimator'].sort(),
    )
  })

  describe('with a custom route table', function () {
    const withLocale = children => [
      { id: 'root', path: '/' },
      { children, id: 'locale', path: '/:locale' },
    ]

    it('should only walk the children of the locale route', function () {
      expect(
        sitemapRoutes(allOn, [
          { id: 'outside', path: '/outside' },
          ...withLocale([{ id: 'inside', path: 'inside' }]),
        ]),
      ).toEqual(['/inside'])
    })

    it('should give an index route the path of its parent', function () {
      expect(
        sitemapRoutes(
          allOn,
          withLocale([
            {
              children: [
                { id: 'page', index: true },
                { id: 'nested', path: 'nested' },
              ],
              id: 'layout',
              path: 'parent',
            },
          ]),
        ),
      ).toEqual(['/parent', '/parent/nested'])
    })

    it('should skip an index route without a parent path', function () {
      expect(
        sitemapRoutes(allOn, withLocale([{ id: 'home', index: true }])),
      ).toEqual([])
    })

    it('should skip paths with a param or a splat', function () {
      expect(
        sitemapRoutes(
          allOn,
          withLocale([
            { id: 'dynamic', path: 'vault/:address' },
            { id: 'notFound', path: '*' },
            { id: 'regular', path: 'regular' },
          ]),
        ),
      ).toEqual(['/regular'])
    })

    it('should skip redirect routes', function () {
      expect(
        sitemapRoutes(
          allOn,
          withLocale([
            { id: 'redirect', path: 'redirect', redirect: true },
            { id: 'regular', path: 'regular' },
          ]),
        ),
      ).toEqual(['/regular'])
    })

    it('should list a route only once', function () {
      expect(
        sitemapRoutes(
          allOn,
          withLocale([
            {
              children: [{ id: 'page', index: true }],
              id: 'layout',
              path: 'same',
            },
            { id: 'duplicate', path: 'same' },
          ]),
        ),
      ).toEqual(['/same'])
    })

    it('should keep a feature flagged route only when the flag is on', function () {
      const definitions = withLocale([
        {
          children: [{ id: 'page', index: true }],
          featureFlag: 'hemiEarn',
          id: 'layout',
          path: 'hemi-earn',
        },
        { id: 'regular', path: 'regular' },
      ])
      expect(sitemapRoutes(allOn, definitions)).toEqual([
        '/hemi-earn',
        '/regular',
      ])
      expect(sitemapRoutes(allOff, definitions)).toEqual(['/regular'])
    })
  })
})
