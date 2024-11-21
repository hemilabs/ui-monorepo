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
