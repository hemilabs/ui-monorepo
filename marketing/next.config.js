/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  output: 'export',
  reactStrictMode: true,
  transpilePackages: ['ui-common'],
  // Enable when adding wallet connection with rainbow kit
  // webpack(config) {
  //   config.resolve.fallback = { fs: false, net: false, tls: false }
  //   config.externals.push('pino-pretty', 'lokijs', 'encoding')
  //   return config
  // },
}

module.exports = nextConfig
