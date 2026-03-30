import { estimateTotalFee } from '@hemilabs/react-hooks/utils/fees'
import { hemiSepolia } from 'hemi-viem'
import {
  useAccount,
  useEstimateMaxPriorityFeePerGas,
  useFeeHistory,
} from 'wagmi'

import { useIsConnectedToExpectedNetwork } from './useIsConnectedToExpectedNetwork'

const defaultBlockCount = 4
const defaultOverEstimation = 1

/** 1 Gwei in wei — default fallback when RPC priority fee is too low (matches previous Big.js default). */
const oneGweiWei = BigInt(1_000_000_000)
/** Hemi Sepolia: very low testnet gas — matches previous `fallbackPriorityFeeOptions.low` (1e5 wei). */
const hemiSepoliaFallbackPriorityFeeWei = BigInt(100_000)

const fallbackPriorityFeeByChain: Record<number, bigint> = {
  [hemiSepolia.id]: hemiSepoliaFallbackPriorityFeeWei,
}

type UseEstimateFees = {
  chainId: number
  enabled?: boolean
  isGasUnitsError?: boolean
  overEstimation?: number
  gasUnits?: bigint
}

/**
 * Portal fee estimation using `@hemilabs/react-hooks/utils/fees` `estimateTotalFee`, preserving
 * Hemi-specific fallback priority fees and fee-history gating from the legacy implementation.
 * (Does not use the package `useEstimateFees` hook — only the shared `estimateTotalFee` helper.)
 */
export function useEstimateFees({
  chainId,
  enabled = true,
  isGasUnitsError = false,
  overEstimation = defaultOverEstimation,
  ...props
}: UseEstimateFees) {
  const { isConnected } = useAccount()
  const isConnectedToExpectedChain = useIsConnectedToExpectedNetwork(chainId)

  const { data: feeHistory, isError: isFeeHistoryError } = useFeeHistory({
    blockCount: defaultBlockCount,
    blockTag: 'latest',
    chainId,
    query: {
      enabled: isConnected && isConnectedToExpectedChain && enabled,
      refetchInterval: 60 * 1000,
    },
    rewardPercentiles: [30],
  })

  const baseFeePerGas = feeHistory?.baseFeePerGas?.at(-1) ?? BigInt(0)

  const { data: maxPriorityFeePerGas, isError: isMaxPriorityFeePerGasError } =
    useEstimateMaxPriorityFeePerGas({
      chainId,
    })

  const fallbackPriorityFee = fallbackPriorityFeeByChain[chainId] ?? oneGweiWei

  const gasUnits = props.gasUnits ?? BigInt(0)

  const fees = estimateTotalFee({
    baseFeePerGas,
    fallbackPriorityFee,
    gasUnits,
    maxPriorityFeePerGas,
    overEstimation,
  })

  return {
    fees: fees ?? BigInt(0),
    isError:
      isGasUnitsError || isFeeHistoryError || isMaxPriorityFeePerGasError,
  }
}
