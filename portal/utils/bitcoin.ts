import { type BtcChain } from 'btc-wallet/chains'

import {
  type MempoolJsBitcoinTransaction,
  type TransactionReceipt,
} from './btcApi'

const equalsBitcoinCustodyAddress =
  (bitcoinCustodyAddress: string) =>
  ({ scriptpubkeyAddress }: MempoolJsBitcoinTransaction['vout'][number]) =>
    scriptpubkeyAddress === bitcoinCustodyAddress

export const calculateDepositAmount = (
  utxos: MempoolJsBitcoinTransaction['vout'],
  bitcoinCustodyAddress: string,
) =>
  utxos
    .filter(equalsBitcoinCustodyAddress(bitcoinCustodyAddress))
    .reduce((acc, { value }) => acc + value, 0)

export const calculateDepositOutputIndex = (
  transactionReceipt: TransactionReceipt,
  bitcoinCustodyAddress: string,
) =>
  transactionReceipt.vout.findIndex(
    equalsBitcoinCustodyAddress(bitcoinCustodyAddress),
  )

/**
 * The Bitcoin API we're using (esplora-client) sometimes returns data with +- 1 hour of range.
 * This means that under certain conditions, the timestamp may be visible to the user as "in X minutes",
 * meaning the date looks like it is in the future. This function caps the timestamp to "now".
 * If the user ever resyncs, and the timestamp appeared in the past, then we save that.
 * See https://github.com/hemilabs/ui-monorepo/issues/692
 */
export const getBitcoinTimestamp = function (timestamp: number) {
  // timestamps from btc are saved in unix format
  const now = Math.floor(new Date().getTime() / 1000)
  return Math.min(now, timestamp)
}

const networkAddressPrefixes = {
  livenet: { base58: ['1', '3'], bech32: 'bc1' },
  testnet: { base58: ['2', 'm', 'n'], bech32: 'tb1' },
}

export const isAddressOfBitcoinNetwork = function (
  address: string,
  network: BtcChain['id'],
) {
  const { base58, bech32 } = networkAddressPrefixes[network]
  return address.toLowerCase().startsWith(bech32) || base58.includes(address[0])
}
