import * as Sentry from '@sentry/nextjs'
// See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
// This generates a QR to load the app easily in your mobile / tablet device
// for development
import qrcode from 'qrcode-terminal'

export async function register() {
  if (process.env.WIFI === 'true' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('Use this QR in your mobile device to load the app')
    qrcode.generate(`http://${process.env.LOCAL_IP}:${process.env.PORT}`, {
      small: true,
    })
  }
}

// Not really needed as of now, but it shows a warning if not
// Plus, if we ever go SSR, it will be useful
export const onRequestError = Sentry.captureRequestError
