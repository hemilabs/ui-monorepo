import { Unisat } from './unisat'

declare global {
  interface Window {
    unisat: Unisat
  }
}
