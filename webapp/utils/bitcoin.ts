import { MempoolJsBitcoinTransaction } from './btcApi'

export const calculateDepositAmount = (
  utxos: MempoolJsBitcoinTransaction['vout'],
  bitcoinCustodyAddress: string,
) =>
  utxos
    .filter(
      ({ scriptpubkeyAddress }) =>
        scriptpubkeyAddress === bitcoinCustodyAddress,
    )
    .reduce((acc, { value }) => acc + value, 0)
