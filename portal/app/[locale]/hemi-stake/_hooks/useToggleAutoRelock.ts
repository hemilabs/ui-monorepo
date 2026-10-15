import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useMutation } from '@tanstack/react-query'
import { useHemi } from 'hooks/useHemi'
import {
  type StakingDashboardOperation,
  StakingDashboardStatus,
} from 'types/stakingDashboard'

// TODO #2481 send the real transaction once the upgraded contracts land.
// ve-hemi-actions has no relock action and the veHemi ABI has no such function,
// so this stands in for it. Flip `simulatedFailure` to walk the retry path.
const simulatedDelay = 3000
const simulatedFailure = false

type UseToggleAutoRelock = {
  onSettled?: VoidFunction
  onSigned?: VoidFunction
  onSucceeded?: VoidFunction
  updateStakingDashboardOperation: (payload?: StakingDashboardOperation) => void
}

export const useToggleAutoRelock = function ({
  onSettled,
  onSigned,
  onSucceeded,
  updateStakingDashboardOperation,
}: UseToggleAutoRelock) {
  const ensureConnectedTo = useEnsureConnectedTo()
  const hemi = useHemi()

  return useMutation({
    async mutationFn() {
      await ensureConnectedTo(hemi.id)
      updateStakingDashboardOperation({
        status: StakingDashboardStatus.STAKE_TX_PENDING,
        transactionHash: undefined,
      })
      onSigned?.()

      await new Promise(resolve => setTimeout(resolve, simulatedDelay))

      if (simulatedFailure) {
        throw new Error('Simulated auto-relock failure')
      }
    },
    onError() {
      updateStakingDashboardOperation({
        status: StakingDashboardStatus.STAKE_TX_FAILED,
      })
    },
    onSettled() {
      onSettled?.()
    },
    onSuccess() {
      updateStakingDashboardOperation({
        status: StakingDashboardStatus.STAKE_TX_CONFIRMED,
      })
      onSucceeded?.()
    },
  })
}
