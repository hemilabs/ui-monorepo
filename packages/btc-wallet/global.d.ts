import { type BitgetProvider } from './connectors/bitget'
import { Unisat } from './unisat'

declare global {
  interface Window {
    bitkeep?: {
      unisat?: BitgetProvider
    }
    okxwallet: {
      bitcoin: Unisat
    }
    unisat: Unisat
    unisat_wallet: Unisat
  }
}
