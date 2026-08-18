import * as Sentry from '@sentry/nextjs'

// Not really needed as of now, but it shows a warning if not
// Plus, if we ever go SSR, it will be useful
export const onRequestError = Sentry.captureRequestError
