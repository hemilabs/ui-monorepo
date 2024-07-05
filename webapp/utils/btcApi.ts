import { Account, BtcTransaction, Satoshis } from 'btc-wallet/unisat'
import camelCaseKeys from 'camelcase-keys'
import fetch from 'fetch-plus-plus'

const toCamelCase = <T>(obj: T) => camelCaseKeys(obj, { deep: true })

const apiUrl = process.env.NEXT_PUBLIC_MEMPOOL_API_URL

type Utxo = {
  status: {
    confirmed: boolean
  }
  txId: string
  value: Satoshis
}

// See https://mempool.space/docs/api/rest#get-address-utxo (we are converting to camelCase)
export const getAddressUtxo = (address: Account) =>
  fetch(
    `${process.env.NEXT_PUBLIC_MEMPOOL_API_URL}/address/${address}/utxo`,
  ).then(toCamelCase) as Promise<Utxo[]>

// See https://mempool.space/docs/api/rest#get-block-tip-height
export const getBlockTipHeight = () =>
  fetch(`${apiUrl}/blocks/tip/height`) as Promise<number>

type Fees = {
  fastestFee: number
  halfHourFee: number
  hourFee: number
  economyFee: number
  minimumFee: number
}
// See https://mempool.space/docs/api/rest#get-recommended-fees
export const getRecommendedFees = () =>
  fetch(`${apiUrl}/v1/fees/recommended`) as Promise<Fees>

type TransactionReceipt = {
  txId: BtcTransaction
  status: {
    blockHeight?: number
    blockTime?: number
    confirmed: boolean
  }
}

// See https://mempool.space/testnet/docs/api/rest#get-transaction (we are converting the keys to camelCase)
export const getTransactionReceipt = (txId: BtcTransaction) =>
  fetch(`${apiUrl}/tx/${txId}`)
    .catch(function (err) {
      if (err?.message.includes('not found')) {
        // It seems it takes a couple of seconds for the Tx for being picked up
        // react-query doesn't let us to return undefined data, so we must
        // return an unconfirmed status
        // Once it appears in the mempool, it will return the full object
        // with the same confirmation status as false.
        return { status: { confirmed: false } }
      }
      throw err
    })
    .then(toCamelCase)
    .then(({ txid, ...rest }) => ({
      txId: txid,
      ...rest,
    })) as Promise<TransactionReceipt | undefined>
