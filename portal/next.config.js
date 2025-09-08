'use strict'

const { withSentryConfig } = require('@sentry/nextjs')
// The plugin is part of next-intl, unsure why it is not detected
// eslint-disable-next-line node/no-missing-require
const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin()

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
        hostname: 'hemilabs.github.io',
        pathname: '/token-list/logos/**',
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
    'genesis-drop-actions',
    'hemi-tunnel-actions',
    'hemi-viem-stake-actions',
    've-hemi-actions',
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
  normalizeDepth: 6,
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#widen-the-upload-scope
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  reactComponentAnnotation: {
    enabled: true,
  },
  release,
  // eslint-disable-next-line camelcase
  unstable_sentryWebpackPluginOptions: {
    applicationKey: process.env.NEXT_PUBLIC_SENTRY_FILTER_KEY_ID,
  },
  widenClientFileUpload: true,
}

module.exports = withSentryConfig(withNextIntl(nextConfig), sentryOptions)
