import { featureFlags } from 'app/featureFlags'
import { isBtcTxHash, type BtcTxHash } from 'btc-wallet/utils/hash'
import {
  useQueryState,
  parseAsString,
  parseAsStringLiteral,
  Options,
} from 'nuqs'
import { useEffect } from 'react'
import { type Hash, isHash } from 'viem'

import { type Operation } from './useTunnelState'

const validOperations: Operation[] = [
  'claim',
  'deposit',
  'prove',
  'withdraw',
  'view',
]

const isValidOperation = (value: string): value is Operation =>
  validOperations.includes(value as Operation)

export const useTunnelOperation = function (): {
  operation: Operation | undefined
  txHash: BtcTxHash | Hash | undefined
  updateOperation: (
    newOperation: (typeof validOperations)[number],
    options?: Options,
  ) => void
  updateTxHash: (newTxHash: string, options?: Options) => void
} {
  const [operation, setOperation] = useQueryState(
    'operation',
    parseAsStringLiteral(validOperations).withDefault('deposit'),
  )
  const [txHash, setTxHash] = useQueryState('txHash', parseAsString)

  const isValid = isValidOperation(operation)
  const isValidTxHash =
    !!txHash &&
    (isHash(txHash) || (featureFlags.btcTunnelEnabled && isBtcTxHash(txHash)))

  useEffect(
    function updateDefaultParameters() {
      if (!isValid && !txHash) {
        setOperation('deposit')
      }
      if (!isValidTxHash && txHash) {
        setTxHash(null)
      }
    },
    [isValid, isValidTxHash, setOperation, setTxHash, txHash],
  )

  return {
    operation: isValid ? operation : undefined,
    txHash: isValidTxHash ? txHash : undefined,
    updateOperation: (newOperation, options) =>
      setOperation(newOperation, options),
    updateTxHash: (newTxHash, options) => setTxHash(newTxHash, options),
  }
}
