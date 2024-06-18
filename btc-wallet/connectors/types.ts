import { Account, Balance, BtcSupportedNetworks } from '../unisat'

export type WalletConnector = {
  connect: () => Promise<void>
  getAccounts: () => Promise<Account[]>
  getBalance: () => Promise<Balance>
  getNetwork: () => Promise<BtcSupportedNetworks>
  id: string
  isInstalled: () => boolean
  name: string
  onAccountsChanged: (handler: (account: Account[]) => void) => () => void
  onNetworkChanged: (
    handler: (network: BtcSupportedNetworks) => void,
  ) => () => void
  switchNetwork: (network: BtcSupportedNetworks) => Promise<void>
}

export type ConnectorGroup = {
  name: string
  wallet: WalletConnector
}
