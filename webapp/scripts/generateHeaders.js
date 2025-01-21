'use strict'

const { writeFile } = require('fs/promises')
const path = require('path')

const getDomain = function (url) {
  if (!url) {
    return null
  }
  try {
    return new URL(url).hostname
  } catch (error) {
    // invalid url
    return null
  }
}

// For security reasons, we need set the Content-Security-Policy to only fetch to these domains
// or only download from these domains. Ideally, we would read from viem/hemi-viem, but there's a conflict
// between ESM and commonjs (hemi-viem is esm-only and this runs in a commonjs context). Plus, as we can override
// the RPC urls, we would need to import from webapp/networks/* which uses the import syntax, but is transpiled
// to commonJs per nextjs... Making this whole thing very complex. As not to lose more time with this
// (I already tried using node with custom loaders, ts-node, tsx, etc), I'm just hardcoding the domains here.

// These are scripts called with fetch()
const fetchDomains = [
  // esplora-client - https://github.com/hemilabs/esplora-client/blob/master/src/index.js#L15
  'https://blockstream.info',
  'https://mempool.space',
  // Ethereum RPC - https://github.com/wevm/viem/blob/main/src/chains/definitions/mainnet.ts#L9
  'https://cloudflare-eth.com',
  'https://eth.drpc.org',
  // Sepolia RPC - https://github.com/wevm/viem/blob/main/src/chains/definitions/sepolia.ts#L9
  'https://rpc.sepolia.org',
  'https://sepolia.drpc.org',
  // Hemi and Hemi Sepolia RPCs
  'https://*.hemi.network',
  'https://*.rpc.hemi.network',
  // RainbowKit
  'wss://relay.walletconnect.com',
  'wss://relay.walletconnect.org',
]

// If any RPC URL is customized through these env vars, the origin has to be
// added to the allow list for the client to get the responses. Since the URLs
// may contain a port or a path, those need to be removed as only the "origin"
// part is required.
const customRpcOrigins = [
  process.env.NEXT_PUBLIC_CUSTOM_RPC_URL_HEMI_MAINNET,
  process.env.NEXT_PUBLIC_CUSTOM_RPC_URL_HEMI_SEPOLIA,
  process.env.NEXT_PUBLIC_CUSTOM_RPC_URL_MAINNET,
  process.env.NEXT_PUBLIC_CUSTOM_RPC_URL_SEPOLIA,
].flatMap((p = '') => p.split('+'))
customRpcOrigins.forEach(function (url) {
  if (url) {
    fetchDomains.push(new URL(url).origin)
  }
})

// these are domains where we download images from
const imageSrcUrls = ['https://raw.githubusercontent.com']

// Domains allowed to download scripts from
const downloadScriptsDomains = []

// analytics
const analyticsDomain = getDomain(process.env.NEXT_PUBLIC_ANALYTICS_URL)
if (
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' &&
  analyticsDomain !== null
) {
  const url = `https://${analyticsDomain}`
  fetchDomains.push(url)
  downloadScriptsDomains.push(url)
  // these are needed for analytics
  downloadScriptsDomains.push('https://static.cloudflareinsights.com')
  downloadScriptsDomains.push('https://challenges.cloudflare.com')
  downloadScriptsDomains.push('https://ajax.cloudflare.com')
  fetchDomains.push('https://cloudflareinsights.com')
}
// error-tracking
const errorTrackingDomain = getDomain(process.env.NEXT_PUBLIC_SENTRY_DSN)
if (errorTrackingDomain !== null) {
  const url = `https://${errorTrackingDomain}`
  fetchDomains.push(url)
  downloadScriptsDomains.push(url)
}

const serveJson = {
  headers: [
    {
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'X-Download-Options',
          value: 'noopen',
        },
        {
          key: 'Expect-CT',
          value: 'max-age=86400, enforce',
        },
        {
          key: 'Referrer-Policy',
          value: 'no-referrer-when-downgrade',
        },
        {
          key: 'Permissions-Policy',
          value: 'geolocation=(), microphone=()',
        },
        {
          key: 'Content-Security-Policy',
          value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${downloadScriptsDomains.join(
            ' ',
          )}; style-src 'self' 'unsafe-inline'; img-src 'self' ${imageSrcUrls.join(
            ' ',
          )} blob: data:; connect-src 'self' ${fetchDomains.join(
            ' ',
          )}; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests`,
        },
      ],
      source: '**/*.*',
    },
  ],
}

const toHtAccess = config =>
  `<IfModule mod_headers.c>
    ${config.headers
      .flatMap(({ headers }) => headers)
      .map(header => `Header always set ${header.key} "${header.value}"`)
      .join('\n')}
  </IfModule>`

// eslint-disable-next-line promise/catch-or-return
Promise.all([
  // needed for serving with serve, useful to test headers locally
  writeFile(
    path.resolve(__dirname, '../out/serve.json'),
    JSON.stringify(serveJson, null, 2),
  ),
  // needed for serving with hostinger
  writeFile(path.resolve(__dirname, '../out/.htaccess'), toHtAccess(serveJson)),
]).then(() =>
  // eslint-disable-next-line no-console
  console.info('Headers generated successfully'),
)
