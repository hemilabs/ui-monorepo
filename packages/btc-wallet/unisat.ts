import { UTXO } from 'coinselect'

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
  disconnect(): Promise<void>
  getAccounts(): Promise<Account[]>
  getBalance(): Promise<Balance>
  getBitcoinUtxos?(): Promise<UTXO[]>
  getNetwork(): Promise<BtcSupportedNetworks>
  isBinance?: boolean
  isOkxWallet?: boolean
  requestAccounts(): Promise<Account[]>
  on<Event extends keyof EventMap>(event: Event, handler: EventMap[Event]): void
  pushTx(txHex: string): Promise<BtcTransaction>
  removeListener<Event extends keyof EventMap>(
    event: Event,
    handler: EventMap[Event],
  ): void
  sendBitcoin: (
    toAddress: Account,
    satoshis: Satoshis,
    options: object,
  ) => Promise<BtcTransaction>
  signPsbt(psbtHex: string, options?: object): Promise<string>
  switchNetwork: (network: BtcSupportedNetworks) => Promise<void>
}
