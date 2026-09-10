import { buildSecurityHeaders } from 'utils/securityHeaders'
import { describe, expect, it } from 'vitest'

const baseConfig = {
  analyticsEnabled: false,
  customRpcUrls: [],
  scriptNonce: 'test-nonce',
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
      'Cross-Origin-Resource-Policy',
      'Origin-Agent-Cluster',
      'Permissions-Policy',
      'Referrer-Policy',
      'X-Content-Type-Options',
      'X-DNS-Prefetch-Control',
      'X-Download-Options',
      'X-Frame-Options',
    ])
  })

  it('upgrades insecure requests when it is not development', function () {
    expect(
      buildSecurityHeaders(baseConfig)['Content-Security-Policy'],
    ).toContain('upgrade-insecure-requests')
  })

  it('keeps the rest of the policy in development', function () {
    const headers = buildSecurityHeaders({ ...baseConfig, isDev: true })

    expect(headers['Content-Security-Policy']).not.toContain(
      'upgrade-insecure-requests',
    )
    expect(directive(headers, 'default-src')).toBe("default-src 'self'")
    expect(directive(headers, 'connect-src')).toContain("'self'")
  })

  it('uses a nonce for scripts and lets the same-origin workers load', function () {
    const headers = buildSecurityHeaders(baseConfig)

    expect(directive(headers, 'script-src')).toBe(
      "script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com 'nonce-test-nonce'",
    )
    expect(directive(headers, 'script-src')).not.toContain("'unsafe-inline'")
    expect(headers['Content-Security-Policy']).not.toContain('worker-src')
  })

  it('allows inline scripts only in development', function () {
    const scriptSrc = directive(
      buildSecurityHeaders({ ...baseConfig, isDev: true }),
      'script-src',
    )

    expect(scriptSrc).toContain("'unsafe-inline'")
    expect(scriptSrc).not.toContain("'nonce-test-nonce'")
  })

  it('allows Cloudflare challenges independently of analytics', function () {
    const headers = buildSecurityHeaders(baseConfig)

    expect(directive(headers, 'script-src')).toContain(
      'https://challenges.cloudflare.com',
    )
    expect(directive(headers, 'frame-src')).toContain(
      'https://challenges.cloudflare.com',
    )
  })

  it('refuses to be framed', function () {
    const headers = buildSecurityHeaders(baseConfig)

    expect(directive(headers, 'frame-ancestors')).toBe("frame-ancestors 'none'")
    expect(headers['X-Frame-Options']).toBe('DENY')
  })

  it('blocks document injection and native form submissions', function () {
    const headers = buildSecurityHeaders(baseConfig)

    expect(directive(headers, 'base-uri')).toBe("base-uri 'none'")
    expect(directive(headers, 'form-action')).toBe("form-action 'none'")
    expect(directive(headers, 'object-src')).toBe("object-src 'none'")
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
  })

  it('allows the services used by the wallet connectors', function () {
    const headers = buildSecurityHeaders(baseConfig)

    expect(directive(headers, 'connect-src')).toContain(
      'https://api.web3modal.com',
    )
    expect(directive(headers, 'connect-src')).toContain(
      'wss://relay.walletconnect.com',
    )
    expect(directive(headers, 'frame-src')).toContain(
      'https://keys.coinbase.com',
    )
    expect(directive(headers, 'frame-src')).toContain(
      'https://verify.walletconnect.com',
    )
    expect(directive(headers, 'img-src')).toContain('https://walletconnect.org')
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
    expect(directive(headers, 'script-src')).toContain(
      'https://static.cloudflareinsights.com',
    )
    expect(directive(headers, 'connect-src')).toContain(
      'https://cloudflareinsights.com',
    )
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

  it('preserves a nonstandard analytics port', function () {
    const headers = buildSecurityHeaders({
      ...baseConfig,
      analyticsEnabled: true,
      analyticsUrl: 'https://analytics.example.com:8443/script.js',
    })

    expect(directive(headers, 'script-src')).toContain(
      'https://analytics.example.com:8443',
    )
    expect(directive(headers, 'connect-src')).toContain(
      'https://analytics.example.com:8443',
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
    expect(directive(headers, 'script-src')).not.toContain(
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
