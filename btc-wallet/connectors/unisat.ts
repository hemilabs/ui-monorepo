import { ConnectorGroup, WalletConnector } from './types'

const isInstalled = () => window?.unisat !== undefined

const assertInstalled = function () {
  if (!isInstalled()) {
    throw new Error('Unisat is not installed')
  }
}

const unisatWalletConnector = {
  async connect() {
    assertInstalled()
    // in order to connect to unisat, we just need to requests accounts and the user
    // will be prompted to connect
    await window.unisat.requestAccounts()
  },
  async getAccounts() {
    assertInstalled()
    return window.unisat.getAccounts()
  },
  async getBalance() {
    assertInstalled()
    return window.unisat.getBalance()
  },
  async getNetwork() {
    assertInstalled()
    return window.unisat.getNetwork()
  },
  id: 'unisat',
  isInstalled,
  name: 'Unisat',
  onAccountsChanged(handler) {
    assertInstalled()
    window.unisat.on('accountsChanged', handler)
    return () => window.unisat.removeListener('accountsChanged', handler)
  },
  onNetworkChanged(handler) {
    assertInstalled()
    window.unisat.on('networkChanged', handler)
    return () => window.unisat.removeListener('networkChanged', handler)
  },
  sendBitcoin(toAddress, satoshis, options) {
    assertInstalled()
    return window.unisat.sendBitcoin(toAddress, satoshis, options)
  },
  switchNetwork(network) {
    assertInstalled()
    return window.unisat.switchNetwork(network)
  },
} satisfies WalletConnector

export const unisat = {
  downloadUrls: {
    android: 'https://play.google.com/store/apps/details?id=io.unisat',
    chrome:
      'https://chromewebstore.google.com/detail/unisat-wallet/ppbibelpcjmhbdihakflkdcoccbgbkpo?pli=1',
  },
  name: 'Unisat',
  wallet: unisatWalletConnector,
} satisfies ConnectorGroup
