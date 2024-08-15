export type Account = string
export type Satoshis = number
export type Balance = {
  confirmed: Satoshis
  total: Satoshis
  unconfirmed: Satoshis
}
export type BtcSupportedNetworks = 'livenet' | 'testnet'

export type BtcTransaction = string

interface EventMap {
  accountsChanged: (accounts: Account[]) => void
  chainChanged: (args: { network: BtcSupportedNetworks }) => void
}

// See https://docs.unisat.io/dev/unisat-developer-center/unisat-wallet#methods
export interface Unisat {
  getAccounts(): Promise<Account[]>
  getBalance(): Promise<Balance>
  getNetwork(): Promise<BtcSupportedNetworks>
  requestAccounts(): Promise<Account[]>
  on<Event extends keyof EventMap>(event: Event, handler: EventMap[Event]): void
  removeListener<Event extends keyof EventMap>(
    event: Event,
    handler: EventMap[Event],
  ): void
  sendBitcoin: (
    toAddress: Account,
    satoshis: Satoshis,
    options: object,
  ) => Promise<BtcTransaction>
  switchNetwork: (network: BtcSupportedNetworks) => Promise<void>
}
