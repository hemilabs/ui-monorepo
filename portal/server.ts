/// <reference types="@cloudflare/workers-types" />
import { buildSecurityHeaders } from 'utils/securityHeaders'

type Env = {
  ASSETS: Fetcher
}

const securityHeaders = buildSecurityHeaders({
  analyticsEnabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  analyticsUrl: import.meta.env.VITE_ANALYTICS_URL,
  customRpcUrls: [
    import.meta.env.VITE_CUSTOM_RPC_URL_HEMI_MAINNET,
    import.meta.env.VITE_CUSTOM_RPC_URL_HEMI_SEPOLIA,
    import.meta.env.VITE_CUSTOM_RPC_URL_MAINNET,
    import.meta.env.VITE_CUSTOM_RPC_URL_SEPOLIA,
  ],
  portalApiUrl: import.meta.env.VITE_PORTAL_API_URL,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  vetroApiUrl: import.meta.env.VITE_VETRO_API_URL,
})

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)

    // `upgrade-insecure-requests` rewrites every request to https, which the
    // dev server does not speak, so `dev:wifi` on a phone would never load.
    if (import.meta.env.DEV) {
      return response
    }

    const withSecurityHeaders = new Response(response.body, response)

    Object.entries(securityHeaders).forEach(([name, value]) =>
      withSecurityHeaders.headers.set(name, value),
    )

    return withSecurityHeaders
  },
} satisfies ExportedHandler<Env>
