import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'staging',
  integrations: [
    // This overrides the default implementation of the RewriteFrames
    // integration from sentry/nextjs. It adds the decodeURI() to fix a mismatch
    // of sourceMaps in reported issues.
    // ref: https://github.com/getsentry/sentry/issues/19713#issuecomment-696614341
    Sentry.rewriteFramesIntegration({
      iteratee(frame) {
        const { origin } = new URL(frame.filename)
        frame.filename = decodeURI(frame.filename.replace(origin, 'app://'))
        return frame
      },
    }),
  ],
  release: `portal@${process.env.NEXT_PUBLIC_RELEASE_VERSION}`,
  tracesSampleRate:
    process.env.NEXT_PUBLIC_TRACES_SAMPLE_RATE &&
    !Number.isNaN(process.env.NEXT_PUBLIC_TRACES_SAMPLE_RATE)
      ? Number(process.env.NEXT_PUBLIC_TRACES_SAMPLE_RATE)
      : undefined,
})
