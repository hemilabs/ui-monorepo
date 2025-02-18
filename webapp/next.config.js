'use strict'

const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // The linter is already running in the pre-commit git hook and in the CI
    // checks. So we don't need to run it again here.
    ignoreDuringBuilds: true,
  },
  experimental: {
    instrumentationHook: true,
  },
  // images are exported on demand, which is incompatible with static export
  images: {
    remotePatterns: [
      {
        hostname: 'raw.githubusercontent.com',
        pathname: '/hemilabs/token-list/**',
        protocol: 'https',
      },
    ],
    unoptimized: true,
  },
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: [
    'btc-wallet',
    'hemi-viem-stake-actions',
    'sliding-block-window',
    'token-list',
    'ui-common',
    'wagmi-erc20-hooks',
  ],
  webpack(config) {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
}

const release =
  process.env.SENTRY_ENVIRONMENT && process.env.SENTRY_RELEASE
    ? {
        deploy: {
          env: process.env.SENTRY_ENVIRONMENT,
        },
        name: process.env.SENTRY_RELEASE,
      }
    : { create: false, finalize: false }

/** @type {import('@sentry/nextjs').SentryBuildOptions} */
const sentryOptions = {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#use-hidden-source-map,
  hideSourceMaps: true,
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#widen-the-upload-scope
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  release,
  widenClientFileUpload: true,
}

module.exports = withSentryConfig(nextConfig, sentryOptions)
