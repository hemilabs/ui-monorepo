import * as bitcoin from 'bitcoinjs-lib'
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

// Decoding is used instead of `address.toOutputScript` because that function
// needs an ECC library and rejects every taproot ("bc1p...") address without it.

const isValidBech32Address = function (
  address: string,
  network: bitcoin.Network,
) {
  try {
    const { data, prefix, version } = bitcoin.address.fromBech32(address)
    if (prefix !== network.bech32) {
      return false
    }
    // bech32 encodes witness versions up to 31, but Bitcoin only defines 0 to 16
    if (version === 0) {
      return data.length === 20 || data.length === 32
    }
    if (version === 1) {
      return data.length === 32
    }
    return version <= 16 && data.length >= 2 && data.length <= 40
  } catch {
    return false
  }
}

const isValidBase58Address = function (
  address: string,
  network: bitcoin.Network,
) {
  try {
    const { version } = bitcoin.address.fromBase58Check(address)
    return version === network.pubKeyHash || version === network.scriptHash
  } catch {
    return false
  }
}

/**
 * Checks whether the given string is a Bitcoin address that can receive funds
 * on the given network. Addresses that are only valid on another network are
 * rejected, as the tunnel contract does not check the network itself - it only
 * verifies that the address can be converted into a script.
 */
export const isValidBtcAddress = function (
  address: string,
  network: BtcChain['id'],
) {
  const btcNetwork =
    bitcoin.networks[network === 'livenet' ? 'bitcoin' : network]
  return (
    isValidBech32Address(address, btcNetwork) ||
    isValidBase58Address(address, btcNetwork)
  )
}
