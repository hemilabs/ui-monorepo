import {
  isRestrictedCountry,
  restrictedLocationMetaName,
} from 'utils/restrictions'
import { buildSecurityHeaders, safeAppOrigin } from 'utils/securityHeaders'

const securityHeadersConfig = {
  analyticsEnabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  analyticsUrl: import.meta.env.VITE_ANALYTICS_URL,
  customRpcUrls: [
    import.meta.env.VITE_CUSTOM_RPC_URL_HEMI_MAINNET,
    import.meta.env.VITE_CUSTOM_RPC_URL_HEMI_SEPOLIA,
    import.meta.env.VITE_CUSTOM_RPC_URL_MAINNET,
    import.meta.env.VITE_CUSTOM_RPC_URL_SEPOLIA,
  ],
  enableSafeApp: import.meta.env.VITE_ENABLE_SAFE_WALLET === 'true',
  isDev: import.meta.env.DEV,
  portalApiUrl: import.meta.env.VITE_PORTAL_API_URL,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  vetroApiUrl: import.meta.env.VITE_VETRO_API_URL,
}

const safeAppHeadersByPath: Record<string, Record<string, string>> = {
  '/hemi.svg': { 'Cross-Origin-Resource-Policy': 'cross-origin' },
  '/manifest.json': { 'Access-Control-Allow-Origin': safeAppOrigin },
}

const generateNonce = function () {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

const isHtmlResponse = (response: Response) =>
  !!response.headers.get('content-type')?.includes('text/html')

const isNavigation = (request: Request) =>
  request.headers.get('sec-fetch-mode') === 'navigate' ||
  !!request.headers.get('accept')?.includes('text/html')

const assetRequest = function (request: Request) {
  if (!isNavigation(request)) {
    return request
  }

  const headers = new Headers(request.headers)
  headers.delete('if-modified-since')
  headers.delete('if-none-match')
  return new Request(request, { headers })
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(assetRequest(request)).catch(
      () => new Response('Internal Server Error', { status: 500 }),
    )

    const withSecurityHeaders = new Response(response.body, response)
    const securityHeaders = buildSecurityHeaders({
      ...securityHeadersConfig,
      scriptNonce: generateNonce(),
    })

    Object.entries(securityHeaders).forEach(([name, value]) =>
      withSecurityHeaders.headers.set(name, value),
    )

    if (securityHeadersConfig.enableSafeApp) {
      Object.entries(
        safeAppHeadersByPath[new URL(request.url).pathname] ?? {},
      ).forEach(([name, value]) => withSecurityHeaders.headers.set(name, value))
    }

    if (
      withSecurityHeaders.status !== 200 ||
      !isHtmlResponse(withSecurityHeaders)
    ) {
      return withSecurityHeaders
    }

    withSecurityHeaders.headers.set('Cache-Control', 'private, no-cache')
    withSecurityHeaders.headers.delete('ETag')

    const restricted =
      !securityHeadersConfig.isDev && isRestrictedCountry(request.cf)

    return new HTMLRewriter()
      .on('head', {
        element(head) {
          head.append(
            `<meta name="${restrictedLocationMetaName}" content="${restricted}" />`,
            { html: true },
          )
        },
      })
      .transform(withSecurityHeaders)
  },
} satisfies ExportedHandler<Env>
