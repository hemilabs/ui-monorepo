import * as Sentry from '@sentry/nextjs'

const enabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN

function enableSentry() {
  const ignoreErrors = [
    // Disable until WalletConnect is enabled, as it will fail for all users
    // See https://github.com/hemilabs/ui-monorepo/issues/633
    'connection failed for host: wss://relay.walletconnect.org',
    // user rejected a confirmation in the wallet
    'rejected the request',
    // Unsupported wallet + user error
    'Talisman extension has not been configured yet',
    // React internal error thrown when something outside react modifies the DOM
    // This is usually because of a browser extension or Chrome's built-in translate. There's no action to do.
    // See https://blog.sentry.io/making-your-javascript-projects-less-noisy/#ignore-un-actionable-errors
    'The node to be removed is not a child of this node.',
    'The node before which the new node is to be inserted is not a child of this node.',
    // Thrown when firefox prevents an add-on from referencing a DOM element that has been removed.
    `TypeError: can't access dead object`,
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
