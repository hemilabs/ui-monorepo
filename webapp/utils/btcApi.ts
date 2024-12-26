import { Account, BtcTransaction, Satoshis } from 'btc-wallet/unisat'
import camelCaseKeys from 'camelcase-keys'
import { esploraClient } from 'esplora-client'

const toCamelCase = <T extends Record<string, unknown>>(obj: T) =>
  camelCaseKeys(obj, { deep: true })

const network = process.env.NEXT_PUBLIC_BITCOIN_NETWORK
const { bitcoin } = esploraClient({ network })

type TransactionStatus = {
  blockTime?: number
  confirmed: boolean
}

type Vout = {
  scriptpubkeyAsm: string
  scriptpubkeyAddress: string
  scriptpubkeyType: string
  value: number
}

export type MempoolJsBitcoinTransaction = {
  status: TransactionStatus
  txId: string
  vin: {
    prevout: {
      scriptpubkeyAddress: string
    }
  }[]
  vout: Vout[]
}

type Utxo = {
  status: TransactionStatus
  txId: string
  value: Satoshis
}

// See https://mempool.space/docs/api/rest#get-address-transactions
export const getAddressTransactions = (
  address: Account,
  queryString?: { afterTxId: string },
) =>
  bitcoin.addresses
    .getAddressTxs({ address, after_txid: queryString?.afterTxId })
    .then(txs =>
      txs.map(tx => toCamelCase({ ...tx, txId: tx.txid })),
    ) as Promise<MempoolJsBitcoinTransaction[]>

// See https://mempool.space/docs/api/rest#get-address-utxo (we are converting to camelCase)
export const getAddressTxsUtxo = (address: Account) =>
  bitcoin.addresses
    .getAddressTxsUtxo({ address })
    .then(utxos =>
      utxos.map(utxo => toCamelCase({ ...utxo, txId: utxo.txid })),
    ) as Promise<Utxo[]>

type Fees = {
  fastestFee: number
  halfHourFee: number
  hourFee: number
  economyFee: number
  minimumFee: number
}
// See https://mempool.space/docs/api/rest#get-recommended-fees
export const getRecommendedFees = () =>
  bitcoin.fees.getFeesRecommended() as Promise<Fees>

export type TransactionReceipt = {
  txId: BtcTransaction
  status: {
    blockHeight?: number
    blockTime?: number
    confirmed: boolean
  }
  vout: Vout[]
}

// See https://mempool.space/testnet/docs/api/rest#get-transaction (we are converting the keys to camelCase)
export const getTransactionReceipt = (txId: BtcTransaction) =>
  bitcoin.transactions
    .getTx({ txid: txId })
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
