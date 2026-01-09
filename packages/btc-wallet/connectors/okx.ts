import { Unisat } from '../unisat'
import { sendBitcoin } from '../utils/psbt'

import { type ConnectorGroup, type WalletConnector } from './types'

const provider = (typeof window !== 'undefined' &&
  window.okxwallet?.bitcoin) as Unisat

const isInstalled = () => !!provider

const assertInstalled = function () {
  if (!isInstalled()) {
    throw new Error('OKX Wallet is not installed')
  }
}

const wallet = {
  async connect() {
    assertInstalled()
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
  id: 'okx',
  isInstalled,
  name: 'OKX',
  onAccountsChanged(handler) {
    assertInstalled()
    provider.on('accountsChanged', handler)
    return () => provider.removeListener('accountsChanged', handler)
  },
  onChainChanged(handler) {
    assertInstalled()
    provider.on('chainChanged', handler)
    return () => provider.removeListener('chainChanged', handler)
  },
  sendBitcoin(toAddress, satoshis, options) {
    assertInstalled()
    // The method sendBitcoin in the provider does not support options.memo.
    // See: https://web3.okx.com/es-la/build/dev-docs/sdks/chains/bitcoin/provider#sendbitcoin
    return sendBitcoin(provider, toAddress, satoshis, options)
  },
  switchNetwork(network) {
    assertInstalled()
    return provider.switchNetwork(network) // NOT IMPLEMENTED BY OKX
  },
} satisfies WalletConnector

export const okx = {
  downloadUrls: {
    android: 'https://play.google.com/store/apps/details?id=com.okx.wallet',
    chrome:
      'https://chromewebstore.google.com/detail/mcohilncbfahbmgdjkbpemcciiolgcge',
    ios: 'https://apps.apple.com/us/app/id6743309484',
  },
  name: 'OKX Wallet',
  wallet,
} satisfies ConnectorGroup
