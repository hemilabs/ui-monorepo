import { Unisat } from '../unisat'

import { type ConnectorGroup, type WalletConnector } from './types'

// See https://github.com/unisat-wallet/unisat-dev-docs/blob/master/wallet-api/api-docs/browser-detection.md
const provider = (typeof window !== 'undefined' &&
  (window.unisat_wallet || window.unisat)) as Unisat

// Some wallets (e.g., Binance and OKX) inject similar APIs but are not UniSat.
// Exclude them from UniSat detection to avoid false positives.
const isInstalled = () =>
  !!provider && !(provider.isBinance || provider.isOkxWallet)

const assertInstalled = function () {
  if (!isInstalled()) {
    throw new Error('UniSat Wallet is not installed')
  }
}

const wallet = {
  async connect() {
    assertInstalled()
    // in order to connect to unisat, we just need to request accounts and the user
    // will be prompted to connect
    await provider.requestAccounts()
  },
  disconnect() {
    assertInstalled()
    return provider.disconnect()
  },
  getAccounts() {
    assertInstalled()
    return provider.getAccounts()
  },
  getBalance() {
    assertInstalled()
    return provider.getBalance()
  },
  getNetwork() {
    assertInstalled()
    return provider.getNetwork()
  },
  id: 'unisat',
  isInstalled,
  name: 'Unisat',
  onAccountsChanged(handler) {
    assertInstalled()
    provider.on('accountsChanged', handler)
    return () => provider.removeListener('accountsChanged', handler)
  },
  onChainChanged(handler) {
    assertInstalled()
    // This event is not listed in the docs, but "networkChanged" doesn't fire
    // See https://github.com/unisat-wallet/extension/issues/211#issuecomment-2290557037
    provider.on('chainChanged', handler)
    return () => provider.removeListener('chainChanged', handler)
  },
  sendBitcoin(toAddress, satoshis, options) {
    assertInstalled()
    return provider.sendBitcoin(toAddress, satoshis, options)
  },
  switchNetwork(network) {
    assertInstalled()
    return provider.switchNetwork(network)
  },
} satisfies WalletConnector

export const unisat = {
  downloadUrls: {
    chrome:
      'https://chromewebstore.google.com/detail/ppbibelpcjmhbdihakflkdcoccbgbkpo',
  },
  name: 'UniSat Wallet',
  wallet,
} satisfies ConnectorGroup
