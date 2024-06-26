import { featureFlags } from 'app/featureFlags'
import { isBtcTxHash, type BtcTxHash } from 'btc-wallet/utils/hash'
import { useEffect } from 'react'
import { useQueryParams } from 'ui-common/hooks/useQueryParams'
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
  operation: Operation
  txHash: BtcTxHash | Hash | undefined
} {
  const { queryParams, removeQueryParams, setQueryParams } = useQueryParams()
  const { operation, txHash } = queryParams

  const isValid = isValidOperation(operation)
  const isValidTxHash =
    isHash(txHash) || (featureFlags.btcTunnelEnabled && isBtcTxHash(txHash))

  useEffect(
    function updateDefaultParameters() {
      if (!isValid && !txHash) {
        setQueryParams({ operation: 'deposit' })
      }
      if (!isValidTxHash && txHash) {
        removeQueryParams('txHash')
      }
    },
    [
      isValid,
      isValidTxHash,
      queryParams,
      removeQueryParams,
      setQueryParams,
      txHash,
    ],
  )

  return {
    operation: isValid ? operation : undefined,
    txHash: isValidTxHash ? txHash : undefined,
  }
}
