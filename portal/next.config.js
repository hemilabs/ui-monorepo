/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASE_PATH || '',
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
  transpilePackages: ['ui-common', 'wagmi-erc20-hooks'],
  webpack(config) {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
}

module.exports = nextConfig
