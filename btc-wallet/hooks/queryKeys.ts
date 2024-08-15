import { WalletConnector } from '../connectors/types'

export const getAccountsQueryKey = (connector: WalletConnector | undefined) => [
  'btc-wallet',
  'accounts',
  connector?.id,
]

export const getNetworksQueryKey = (connector: WalletConnector | undefined) => [
  'btc-wallet',
  'networks',
  connector?.id,
]
