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
