import { buildSecurityHeaders } from 'utils/securityHeaders'

const securityHeaders = buildSecurityHeaders({
  analyticsEnabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  analyticsUrl: import.meta.env.VITE_ANALYTICS_URL,
  customRpcUrls: [
    import.meta.env.VITE_CUSTOM_RPC_URL_HEMI_MAINNET,
    import.meta.env.VITE_CUSTOM_RPC_URL_HEMI_SEPOLIA,
    import.meta.env.VITE_CUSTOM_RPC_URL_MAINNET,
    import.meta.env.VITE_CUSTOM_RPC_URL_SEPOLIA,
  ],
  isDev: import.meta.env.DEV,
  portalApiUrl: import.meta.env.VITE_PORTAL_API_URL,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  vetroApiUrl: import.meta.env.VITE_VETRO_API_URL,
})

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request).catch(
      () => new Response('Internal Server Error', { status: 500 }),
    )

    const withSecurityHeaders = new Response(response.body, response)

    Object.entries(securityHeaders).forEach(([name, value]) =>
      withSecurityHeaders.headers.set(name, value),
    )

    return withSecurityHeaders
  },
} satisfies ExportedHandler<Env>
