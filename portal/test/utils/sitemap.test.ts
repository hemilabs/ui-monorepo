import { locales } from 'i18n/routing'
import { buildSitemap } from 'utils/sitemap'
import { sitemapRoutes } from 'utils/sitemapRoutes'
import { describe, expect, it } from 'vitest'

const baseUrl = 'https://app.hemi.xyz'
const stakeOn = { includeHemiEarn: true, includeHemiStake: true }
const build = (flags = stakeOn) =>
  buildSitemap({ baseUrl, locales, routes: sitemapRoutes(flags) })

describe('utils/sitemap', function () {
  it('should emit one url per route per locale', function () {
    const xml = build()
    expect(xml.match(/<url>/g)).toHaveLength(
      sitemapRoutes(stakeOn).length * locales.length,
    )
  })

  it('should use the given base url', function () {
    expect(build()).toContain(`<loc>${baseUrl}/en/tunnel</loc>`)
  })

  it('should not leak a development host', function () {
    expect(build()).not.toContain('localhost')
  })

  it('should not emit dynamic or placeholder segments', function () {
    const locs = [...build().matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    expect(locs).not.toHaveLength(0)
    locs.forEach(function (loc) {
      expect(loc).not.toMatch(/\[|\]/)
      expect(loc.replace(/^https?:\/\//, '')).not.toMatch(/:/)
    })
  })

  it('should cross-link every locale, including itself', function () {
    const xml = build()
    locales.forEach(function (locale) {
      locales.forEach(function (alternate) {
        expect(xml).toContain(
          `<xhtml:link rel="alternate" hreflang="${alternate}" href="${baseUrl}/${alternate}/tunnel" />`,
        )
      })
      expect(xml).toContain(`<loc>${baseUrl}/${locale}/tunnel</loc>`)
    })
  })

  it('should escape xml entities', function () {
    const xml = buildSitemap({
      baseUrl,
      locales,
      routes: ['/a?b=1&c=2'],
    })
    expect(xml).toContain('&amp;')
    expect(xml).not.toMatch(/[^&]&[^a-z]/)
  })

  it('should drop a trailing slash from the base url', function () {
    const xml = buildSitemap({
      baseUrl: `${baseUrl}/`,
      locales,
      routes: ['/tunnel'],
    })
    expect(xml).toContain(`<loc>${baseUrl}/en/tunnel</loc>`)
  })

  it('should omit hemi earn when the flag is off', function () {
    expect(build({ ...stakeOn, includeHemiEarn: false })).not.toContain(
      'hemi-earn',
    )
    expect(build()).toContain('hemi-earn')
  })

  it('should omit hemi stake when the flag is off', function () {
    expect(build({ ...stakeOn, includeHemiStake: false })).not.toContain(
      'hemi-stake',
    )
    expect(build()).toContain('hemi-stake')
  })

  it('should swap governance staking for hemi stake', function () {
    expect(build()).not.toContain('staking-dashboard')
    expect(build({ ...stakeOn, includeHemiStake: false })).toContain(
      'staking-dashboard',
    )
  })
})
