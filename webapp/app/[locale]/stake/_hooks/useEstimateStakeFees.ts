import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { useAccount } from 'wagmi'

// TODO review estimation of gas units is correct https://github.com/hemilabs/ui-monorepo/issues/774
const StakeGasUnits = BigInt(300_000)

export const useEstimateStakeFees = function () {
  const { status } = useAccount()
  const hemi = useHemi()

  return useEstimateFees({
    chainId: hemi.id,
    enabled: status === 'connected',
    gasUnits: StakeGasUnits,
    overEstimation: 1.5,
  })
}
