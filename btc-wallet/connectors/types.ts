import {
  Account,
  Balance,
  BtcSupportedNetworks,
  Satoshis,
  BtcTransaction,
} from '../unisat'

export type WalletConnector = {
  connect: () => Promise<void>
  getAccounts: () => Promise<Account[]>
  getBalance: () => Promise<Balance>
  getNetwork: () => Promise<BtcSupportedNetworks>
  id: string
  isInstalled: () => boolean
  name: string
  onAccountsChanged: (handler: (account: Account[]) => void) => () => void
  onChainChanged: (
    handler: (args: { network: BtcSupportedNetworks }) => void,
  ) => () => void
  sendBitcoin: (
    to: Account,
    satoshis: Satoshis,
    options: object,
  ) => Promise<BtcTransaction>
  switchNetwork: (network: BtcSupportedNetworks) => Promise<void>
}

export type ConnectorGroup = {
  downloadUrls?: {
    android?: string
    chrome?: string
  }
  name: string
  wallet: WalletConnector
}
