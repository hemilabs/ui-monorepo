import { type Account, type BtcSupportedNetworks, type Unisat } from '../unisat'

import { type ConnectorGroup, type WalletConnector } from './types'

type EventMap = {
  accountsChanged: (accounts: Account[]) => void
  networkChanged: (network: BtcSupportedNetworks) => void
}

// See https://web3.bitget.com/en/docs/connect/mainnet/btc
export type BitgetProvider = Omit<
  Unisat,
  'getBitcoinUtxos' | 'on' | 'pushTx' | 'removeListener'
> & {
  on<Event extends keyof EventMap>(event: Event, handler: EventMap[Event]): void
  removeListener<Event extends keyof EventMap>(
    event: Event,
    handler: EventMap[Event],
  ): void
}

const provider = (typeof window !== 'undefined' &&
  window.bitkeep?.unisat) as BitgetProvider

const isInstalled = () => !!provider

const assertInstalled = function () {
  if (!isInstalled()) {
    throw new Error('Bitget Wallet is not installed')
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
  id: 'bitget',
  isInstalled,
  name: 'Bitget',
  onAccountsChanged(handler) {
    assertInstalled()
    provider.on('accountsChanged', handler)
    return () => provider.removeListener('accountsChanged', handler)
  },
  onChainChanged(handler) {
    assertInstalled()
    // Bitget emits "networkChanged" with the network name, not "chainChanged"
    const listener = (network: BtcSupportedNetworks) => handler({ network })
    provider.on('networkChanged', listener)
    return () => provider.removeListener('networkChanged', listener)
  },
  async sendBitcoin() {
    throw new Error('Not supported yet')
  },
  supportsSwitchNetwork: true,
  switchNetwork(network) {
    assertInstalled()
    return provider.switchNetwork(network)
  },
} satisfies WalletConnector

export const bitget = {
  downloadUrls: {
    android: 'https://play.google.com/store/apps/details?id=com.bitkeep.wallet',
    chrome:
      'https://chromewebstore.google.com/detail/jiidiaalihmmhddjgbnbgdfflelocpak',
    ios: 'https://apps.apple.com/app/bitkeep/id1395301115',
  },
  name: 'Bitget Wallet',
  wallet,
} satisfies ConnectorGroup
