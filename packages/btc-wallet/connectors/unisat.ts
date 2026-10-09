import { Unisat } from '../unisat'

import { type ConnectorGroup, type WalletConnector } from './types'

// See https://github.com/unisat-wallet/unisat-dev-docs/blob/master/wallet-api/api-docs/browser-detection.md
// Read on each call: Bitget sets window.unisat before UniSat replaces it
const getProvider = () =>
  (typeof window !== 'undefined' &&
    (window.unisat_wallet || window.unisat)) as Unisat

// Some wallets (e.g., Binance, Bitget and OKX) inject similar APIs but are not
// UniSat. Exclude them from UniSat detection to avoid false positives.
const isInstalled = function () {
  const provider = getProvider()
  return (
    !!provider &&
    !(provider.isBinance || provider.isBitKeep || provider.isOkxWallet)
  )
}

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
    await getProvider().requestAccounts()
  },
  disconnect() {
    assertInstalled()
    return getProvider().disconnect()
  },
  getAccounts() {
    assertInstalled()
    return getProvider().getAccounts()
  },
  getBalance() {
    assertInstalled()
    return getProvider().getBalance()
  },
  getNetwork() {
    assertInstalled()
    return getProvider().getNetwork()
  },
  id: 'unisat',
  isInstalled,
  name: 'Unisat',
  onAccountsChanged(handler) {
    assertInstalled()
    const provider = getProvider()
    provider.on('accountsChanged', handler)
    return () => provider.removeListener('accountsChanged', handler)
  },
  onChainChanged(handler) {
    assertInstalled()
    // This event is not listed in the docs, but "networkChanged" doesn't fire
    // See https://github.com/unisat-wallet/extension/issues/211#issuecomment-2290557037
    const provider = getProvider()
    provider.on('chainChanged', handler)
    return () => provider.removeListener('chainChanged', handler)
  },
  sendBitcoin(toAddress, satoshis, options) {
    assertInstalled()
    return getProvider().sendBitcoin(toAddress, satoshis, options)
  },
  supportsSwitchNetwork: true,
  switchNetwork(network) {
    assertInstalled()
    return getProvider().switchNetwork(network)
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
