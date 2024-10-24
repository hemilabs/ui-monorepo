/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // The liner is already running in the pre-commit git hook and in the GitHub
    // Actions checks. So we don't need to run it again here.
    ignoreDuringBuilds: true,
  },
  experimental: {
    instrumentationHook: true,
  },
  // images are exported on demand, which is incompatible with static export
  images: {
    unoptimized: true,
  },
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: [
    'btc-wallet',
    'sliding-block-window',
    'ui-common',
    'wagmi-erc20-hooks',
  ],
  webpack(config) {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
}

module.exports = nextConfig
