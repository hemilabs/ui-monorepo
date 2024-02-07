/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  // Enable when adding wallet connection with rainbow kit
  // webpack(config) {
  //   config.resolve.fallback = { fs: false, net: false, tls: false }
  //   config.externals.push('pino-pretty', 'lokijs', 'encoding')
  //   return config
  // },
}

module.exports = nextConfig
