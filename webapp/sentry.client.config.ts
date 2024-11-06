import * as Sentry from '@sentry/nextjs'

const enabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN

function enableSentry() {
  const ignoreErrors = [
    // user rejected a confirmation in the wallet
    'rejected the request',
  ]

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled,
    ignoreErrors,
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
    tracesSampleRate:
      process.env.NEXT_PUBLIC_TRACES_SAMPLE_RATE &&
      !Number.isNaN(process.env.NEXT_PUBLIC_TRACES_SAMPLE_RATE)
        ? Number(process.env.NEXT_PUBLIC_TRACES_SAMPLE_RATE)
        : undefined,
  })
}

if (enabled) {
  enableSentry()
}
