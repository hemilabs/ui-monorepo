import { Unisat } from './unisat'

declare global {
  interface Window {
    okxwallet: {
      bitcoin: Unisat
    }
    unisat: Unisat
    unisat_wallet: Unisat
  }
}
