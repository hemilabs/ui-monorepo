import * as Sentry from '@sentry/nextjs'

const enabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN

const unsupportedWalletErrors = [
  '@polkadot/keyring requires direct dependencies',
  "Backpack couldn't override `window.ethereum`.",
  'Cannot redefine property: ethereum',
  // Nightly wallet
  'Cannot set property ethereum of #<Window> which has only a getter',
  'sendRequest() -> core.crypto.encode()',
  'shouldSetPelagusForCurrentProvider is not a function',
  'shouldSetTallyForCurrentProvider is not a function',
  'Talisman extension has not been configured yet',
]

const walletConnectErrors = [
  'Decoded payload on topic',
  'Error: emitting session_request',
  'Expired. pairing topic',
  'No matching key',
  // there are a few possible different errors after "Record was recently deleted"
  'Record was recently deleted',
  // See https://github.com/hemilabs/ui-monorepo/issues/1081
  'this.provider.disconnect is not a function',
]

function enableSentry() {
  const ignoreErrors = [
    'Deprecation warning: tabReply will be removed',
    'Error redefining provider into window.ethereum',
    // Coming from an extension probably, we don't use anything related to this
    `Failed to execute 'transaction' on 'IDBDatabase'`,
    'Database deleted by request of the user',
    // Nextjs errors when pre-fetching is aborted due to user navigation.
    // See https://github.com/vercel/next.js/pull/73975 and https://github.com/vercel/next.js/pull/73985
    // should not happen anymore after Next 15.3
    'Falling back to browser navigation',
    // user has not enough gas
    'insufficient funds for gas * price + value',
    // Metamask error
    "MetaMask: 'eth_accounts' unexpectedly updated accounts. Please report this bug",
    // Another Metamask error
    'MetaMetrics.getInstance().createEventBuilder is not a function.',
    // From "TronWeb: 'tronWeb.sidechain' is deprecated and may be removed in the future. Please use the 'sunweb' sdk instead...",
    "Please use the 'sunweb' sdk instead",
    // user rejected a confirmation in the wallet
    'rejected the request',
    // React internal error thrown when something outside react modifies the DOM
    // This is usually because of a browser extension or Chrome's built-in translate. There's no action to do.
    // See https://blog.sentry.io/making-your-javascript-projects-less-noisy/#ignore-un-actionable-errors
    'The node to be removed is not a child of this node.',
    'The node before which the new node is to be inserted is not a child of this node.',
    // MM already prompts to add the chain if switching to an unknown chain.
    // All the other wallets tested work too, although without this error.
    'Try adding the chain using wallet_addEthereumChain first',
    // Thrown when firefox prevents an add-on from referencing a DOM element that has been removed.
    `TypeError: can't access dead object`,
    'User denied transaction signature',
    ...unsupportedWalletErrors,
    ...walletConnectErrors,
  ]

  Sentry.init({
    denyUrls: [
      // Filter all Wallet Connect related urls
      /(https|wss):\/\/.*\.walletconnect\.(com|org)/,
      process.env.NEXT_PUBLIC_COOKIE3_URL,
      process.env.NEXT_PUBLIC_PORTAL_API_URL,
      // filter in case any of the env variables are undefined, although in prod all should be defined.
    ].filter(Boolean) as (string | RegExp)[],
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled,
    ignoreErrors,
    integrations: [
      // See https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/captureconsole/
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
      // See https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/extraerrordata/
      Sentry.extraErrorDataIntegration(),
      // See https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/httpclient/
      Sentry.httpClientIntegration(),
      // This overrides the default implementation of the RewriteFrames
      // integration from sentry/nextjs. It adds the decodeURI() to fix a mismatch
      // of sourceMaps in reported issues.
      // ref: https://github.com/getsentry/sentry/issues/19713#issuecomment-696614341
      Sentry.rewriteFramesIntegration({
        iteratee(frame) {
          const { origin } = new URL(frame.filename!)
          frame.filename = decodeURI(frame.filename!.replace(origin, 'app://'))
          return frame
        },
      }),
      // See https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/filtering/#using-thirdpartyerrorfilterintegration
      Sentry.thirdPartyErrorFilterIntegration({
        // Should skip all errors that are entirely made of third party frames in the stack trace.
        // Let's start with this, we can make it more strict if needed.
        behaviour: 'drop-error-if-exclusively-contains-third-party-frames',
        filterKeys: [process.env.NEXT_PUBLIC_SENTRY_FILTER_KEY_ID!],
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
