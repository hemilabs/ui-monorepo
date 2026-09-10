import { website } from 'hemi-socials'
import { hemi, hemiSepolia, mainnet, sepolia } from 'viem/chains'

type SecurityHeadersConfig = {
  analyticsEnabled: boolean
  analyticsUrl?: string
  customRpcUrls: (string | undefined)[]
  isDev?: boolean
  portalApiUrl?: string
  scriptNonce: string
  sentryDsn?: string
  vetroApiUrl?: string
}

const parseUrl = (url?: string) => (url ? URL.parse(url) : null)

const getOrigin = (url?: string) => parseUrl(url)?.origin

const fontDomains = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
]

const imageSrcUrls = [
  website,
  'https://hemilabs.github.io',
  'https://framerusercontent.com', // TODO: remove, content should not be loaded from here.
  // WalletConnect / Reown Appkit
  // https://docs.reown.com/advanced/security/content-security-policy
  'https://walletconnect.com',
  'https://walletconnect.org',
  'https://secure.walletconnect.com',
  'https://secure.walletconnect.org',
  'https://api.web3modal.com',
  'https://api.web3modal.org',
]

const frameSrcUrls = [
  'https://challenges.cloudflare.com',
  // WalletConnect / Reown Appkit + Coinbase
  // https://docs.reown.com/advanced/security/content-security-policy
  'https://secure.walletconnect.com',
  'https://secure.walletconnect.org',
  'https://verify.walletconnect.com',
  'https://verify.walletconnect.org',
  'https://keys.coinbase.com',
]

const permissionsPolicy = Object.entries({
  accelerometer: '',
  'ambient-light-sensor': '',
  'attribution-reporting': '',
  autoplay: 'self',
  battery: '',
  bluetooth: '',
  camera: '',
  'ch-ua': '',
  'ch-ua-arch': '',
  'ch-ua-bitness': '',
  'ch-ua-full-version': '',
  'ch-ua-full-version-list': '',
  'ch-ua-mobile': '',
  'ch-ua-model': '',
  'ch-ua-platform': '',
  'ch-ua-platform-version': '',
  'ch-ua-wow64': '',
  'compute-pressure': '',
  'cross-origin-isolated': '',
  'direct-sockets': '',
  'display-capture': '',
  'encrypted-media': '',
  'execution-while-not-rendered': '',
  'execution-while-out-of-viewport': '',
  fullscreen: '',
  geolocation: '',
  gyroscope: '',
  hid: '',
  'identity-credentials-get': '',
  'idle-detection': '',
  'keyboard-map': '',
  magnetometer: '',
  microphone: '',
  midi: '',
  'navigation-override': '',
  payment: '',
  'picture-in-picture': '',
  'publickey-credentials-get': '',
  'screen-wake-lock': '',
  serial: '',
  'storage-access': '',
  'sync-xhr': '',
  usb: '',
  'web-share': '',
  'window-management': '',
  'xr-spatial-tracking': '',
})
  .map(([feature, allowlist]) => `${feature}=(${allowlist})`)
  .join(', ')

type ThirdPartyHosts = {
  analytics?: string
  errorTracking?: string
}

const getThirdPartyHosts = function ({
  analyticsEnabled,
  analyticsUrl,
  sentryDsn,
}: SecurityHeadersConfig) {
  const analyticsOrigin = getOrigin(analyticsUrl)
  const errorTrackingOrigin = getOrigin(sentryDsn)

  return {
    analytics:
      analyticsEnabled && !!analyticsOrigin ? analyticsOrigin : undefined,
    errorTracking: errorTrackingOrigin,
  }
}

const buildFetchDomains = function (
  { customRpcUrls, portalApiUrl, vetroApiUrl }: SecurityHeadersConfig,
  hosts: ThirdPartyHosts,
) {
  const domains = new Set([
    'https://blockstream.info',
    'https://mempool.space',
    ...mainnet.rpcUrls.default.http,
    ...sepolia.rpcUrls.default.http,
    'https://*.hemi.network',
    'https://*.rpc.hemi.network',
    hemi.blockExplorers.default.url,
    hemiSepolia.blockExplorers.default.url,
    'https://api.studio.thegraph.com/',
    // WalletConnect / Reown AppKit + Coinbase Wallet endpoints.
    // https://docs.reown.com/advanced/security/content-security-policy
    'https://api.web3modal.com',
    'https://api.web3modal.org',
    'https://echo.walletconnect.com',
    'https://echo.walletconnect.org',
    'https://keys.walletconnect.com',
    'https://keys.walletconnect.org',
    'https://notify.walletconnect.com',
    'https://notify.walletconnect.org',
    'https://pulse.walletconnect.com',
    'https://pulse.walletconnect.org',
    'https://push.walletconnect.com',
    'https://push.walletconnect.org',
    'https://relay.walletconnect.com',
    'https://relay.walletconnect.org',
    'https://rpc.walletconnect.com',
    'https://rpc.walletconnect.org',
    'wss://relay.walletconnect.com',
    'wss://relay.walletconnect.org',
    'https://verify.walletconnect.com',
    'https://verify.walletconnect.org',
    'https://cca-lite.coinbase.com',
    'https://chain-proxy.wallet.coinbase.com',
    'https://keys.coinbase.com',
    'wss://www.walletlink.org',
    // Binance
    'https://binance.nodereal.io',
    'https://bsc-dataseed2.ninicoin.io',
    'https://bscrpc.com',
    'https://rpc.ankr.com/bsc',
    'wss://nbstream.binance.click',
    'wss://nbstream.binance.com',
    'wss://nbstream.binance.info',
    'wss://nbstream.yshyqxx.com',
    // Merkle
    'https://api.merkl.xyz',
    // Cloudflare Web Analytics
    'https://cloudflareinsights.com',
  ])

  const apiOrigins = [getOrigin(portalApiUrl), getOrigin(vetroApiUrl)]
  apiOrigins.filter(Boolean).forEach(origin => domains.add(origin))

  // Only the origin is allow-listed, so a custom RPC carrying a port or a path
  // still matches the responses the client gets back.
  customRpcUrls
    .flatMap(urls => (urls ?? '').split('+'))
    .map(getOrigin)
    .filter(Boolean)
    .forEach(origin => domains.add(origin))

  if (hosts.analytics) {
    domains.add(hosts.analytics)
  }
  if (hosts.errorTracking) {
    domains.add(hosts.errorTracking)
  }

  return domains
}

const buildScriptDomains = function (hosts: ThirdPartyHosts) {
  const domains = new Set([
    // Cloudflare bot management / Turnstile / challenge widget
    'https://challenges.cloudflare.com',
    // Cloudflare Web Analytics
    'https://static.cloudflareinsights.com',
  ])

  if (hosts.analytics) {
    domains.add(hosts.analytics)
  }

  return domains
}

const directive = (name: string, sources: string[]) =>
  [name, ...sources.filter(Boolean)].join(' ')

const buildContentSecurityPolicy = ({
  fetchDomains,
  fonts,
  isDev,
  scriptDomains,
  scriptNonce,
}: {
  fetchDomains: string[]
  fonts: string[]
  isDev: boolean
  scriptDomains: string[]
  scriptNonce: string
}) =>
  [
    directive('default-src', ["'self'"]),
    directive('base-uri', ["'none'"]),
    directive('form-action', ["'none'"]),
    directive('object-src', ["'none'"]),
    // No `worker-src` on purpose: it falls back to `script-src`, which allows
    // 'self', and the five under portal/workers are same-origin. Dropping
    // 'self' from `script-src` stops tunnel history from syncing.
    directive('script-src', [
      "'self'",
      ...scriptDomains,
      isDev ? "'unsafe-inline'" : `'nonce-${scriptNonce}'`,
    ]),
    directive('style-src', ["'self'", "'unsafe-inline'"]),
    directive('img-src', ["'self'", ...imageSrcUrls, 'blob:', 'data:']),
    directive('connect-src', ["'self'", ...fetchDomains]),
    directive('frame-src', ["'self'", ...frameSrcUrls]),
    directive('frame-ancestors', ["'none'"]),
    'block-all-mixed-content',
    ...(isDev ? [] : ['upgrade-insecure-requests']),
    directive('font-src', ["'self'", ...fonts]),
    directive('style-src-elem', ["'self'", "'unsafe-inline'", ...fonts]),
  ].join('; ')

export const buildSecurityHeaders = function (config: SecurityHeadersConfig) {
  const hosts = getThirdPartyHosts(config)

  return {
    'Content-Security-Policy': buildContentSecurityPolicy({
      fetchDomains: Array.from(buildFetchDomains(config, hosts)),
      fonts: fontDomains,
      isDev: config.isDev ?? false,
      scriptDomains: Array.from(buildScriptDomains(hosts)),
      scriptNonce: config.scriptNonce,
    }),
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Origin-Agent-Cluster': '?1',
    'Permissions-Policy': permissionsPolicy,
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Frame-Options': 'DENY',
  }
}
