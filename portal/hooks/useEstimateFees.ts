import { useEstimateFees as useEstimateFeesFromLib } from '@hemilabs/react-hooks/useEstimateFees'
import { getFallbackPriorityFeeForChain } from 'utils/fallbackPriorityFee'

type LibParams = Parameters<typeof useEstimateFeesFromLib>[0]

type UseEstimateFeesParams = Omit<LibParams, 'fallbackPriorityFee'>

type UseEstimateFeesResult = {
  /** Always defined; `undefined` from the lib is normalized to `0n`. */
  fees: bigint
  isError: boolean
}

/**
 * Wraps `@hemilabs/react-hooks/useEstimateFees` with portal defaults:
 * injects `fallbackPriorityFee` from {@link getFallbackPriorityFeeForChain} and
 * maps `fees` with `?? BigInt(0)`.
 *
 * Callers pass the same fields as the library hook **except** `fallbackPriorityFee`.
 * Use `Parameters<typeof useEstimateFees>[0]` and `ReturnType<typeof useEstimateFees>` if you need types elsewhere.
 */
export const useEstimateFees = function (
  params: UseEstimateFeesParams,
): UseEstimateFeesResult {
  const { fees, isError } = useEstimateFeesFromLib({
    ...params,
    fallbackPriorityFee: getFallbackPriorityFeeForChain(params.chainId),
  })
  return { fees: fees ?? BigInt(0), isError }
}
