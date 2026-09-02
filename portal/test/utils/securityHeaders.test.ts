import { buildSecurityHeaders } from 'utils/securityHeaders'
import { describe, expect, it } from 'vitest'

const baseConfig = {
  analyticsEnabled: false,
  customRpcUrls: [],
}

const directive = function (headers: Record<string, string>, name: string) {
  const found = headers['Content-Security-Policy']
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name} `))

  if (found === undefined) {
    throw new Error(`the policy has no ${name} directive`)
  }
  return found
}

describe('buildSecurityHeaders', function () {
  it('sets every header the app is served with', function () {
    expect(Object.keys(buildSecurityHeaders(baseConfig)).sort()).toStrictEqual([
      'Content-Security-Policy',
      'Cross-Origin-Opener-Policy',
      'Permissions-Policy',
      'Referrer-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Download-Options',
      'X-Frame-Options',
    ])
  })

  it('refuses to be framed', function () {
    const headers = buildSecurityHeaders(baseConfig)

    expect(directive(headers, 'frame-ancestors')).toBe("frame-ancestors 'none'")
    expect(headers['X-Frame-Options']).toBe('DENY')
  })

  it('allows the origins the app fetches from', function () {
    const connectSrc = directive(
      buildSecurityHeaders(baseConfig),
      'connect-src',
    )

    // Bitcoin explorers, reached through esplora-client
    expect(connectSrc).toContain('https://blockstream.info')
    expect(connectSrc).toContain('https://mempool.space')
    expect(connectSrc).toContain('https://*.hemi.network')
    expect(connectSrc).toContain('https://*.walletconnect.com')
  })

  it('allow-lists only the origin of a custom rpc url', function () {
    const connectSrc = directive(
      buildSecurityHeaders({
        ...baseConfig,
        customRpcUrls: ['https://rpc.example.com:8545/v1/key'],
      }),
      'connect-src',
    )

    expect(connectSrc).toContain('https://rpc.example.com:8545')
    expect(connectSrc).not.toContain('/v1/key')
  })

  it('reads every url out of a joined custom rpc list', function () {
    const connectSrc = directive(
      buildSecurityHeaders({
        ...baseConfig,
        customRpcUrls: ['https://first.example.com+https://second.example.com'],
      }),
      'connect-src',
    )

    expect(connectSrc).toContain('https://first.example.com')
    expect(connectSrc).toContain('https://second.example.com')
  })

  it('keeps analytics out while it is disabled', function () {
    const headers = buildSecurityHeaders({
      ...baseConfig,
      analyticsEnabled: false,
      analyticsUrl: 'https://umami.example.com/script.js',
    })

    expect(directive(headers, 'script-src')).not.toContain('umami.example.com')
    expect(directive(headers, 'connect-src')).not.toContain('umami.example.com')
  })

  it('lets analytics load and report once enabled', function () {
    const headers = buildSecurityHeaders({
      ...baseConfig,
      analyticsEnabled: true,
      analyticsUrl: 'https://umami.example.com/script.js',
    })

    expect(directive(headers, 'script-src')).toContain(
      'https://umami.example.com',
    )
    expect(directive(headers, 'connect-src')).toContain(
      'https://cloudflareinsights.com',
    )
  })

  it('adds nothing for error tracking when there is no dsn', function () {
    const connectSrc = directive(
      buildSecurityHeaders(baseConfig),
      'connect-src',
    )

    expect(connectSrc).not.toContain('sentry.io')
  })

  it('lets error reports reach the dsn host', function () {
    const headers = buildSecurityHeaders({
      ...baseConfig,
      sentryDsn: 'https://key@o123.ingest.de.sentry.io/456',
    })

    expect(directive(headers, 'connect-src')).toContain(
      'https://o123.ingest.de.sentry.io',
    )
    expect(directive(headers, 'script-src')).toContain(
      'https://o123.ingest.de.sentry.io',
    )
  })

  // A malformed value used to fail the build. It now reaches the Worker, where
  // throwing would take every response down, assets included.
  it.each([
    ['analyticsUrl', { analyticsEnabled: true, analyticsUrl: 'not-a-url' }],
    ['customRpcUrls', { customRpcUrls: ['not-a-url'] }],
    ['portalApiUrl', { portalApiUrl: 'not-a-url' }],
    ['sentryDsn', { sentryDsn: 'not-a-url' }],
    ['vetroApiUrl', { vetroApiUrl: 'not-a-url' }],
  ])('survives a malformed %s', function (_name, override) {
    expect(() =>
      buildSecurityHeaders({ ...baseConfig, ...override }),
    ).not.toThrow()
  })

  it('leaves a malformed url out of the policy', function () {
    const connectSrc = directive(
      buildSecurityHeaders({ ...baseConfig, portalApiUrl: 'not-a-url' }),
      'connect-src',
    )

    expect(connectSrc).not.toContain('not-a-url')
  })
})
