import { EventEmitter } from 'events'
import {
  StakingDashboardStatus,
  type StakingDashboardOperation,
} from 'types/stakingDashboard'
import { type IncreaseAmountEvents } from 've-hemi-actions'

/**
 * The failure events `useIncreaseAmount` must answer, following `useStake` and
 * `useIncreaseUnlockTime`: without them a failure leaves the default
 * `APPROVAL_TX_PENDING` status, the step spins forever and no analytics go out (#2475).
 * Split out so the wiring is unit-testable without rendering the hook.
 */
export const registerIncreaseAmountFailureHandlers = function (
  emitter: EventEmitter<IncreaseAmountEvents>,
  updateStakingDashboardOperation: (
    payload?: StakingDashboardOperation,
  ) => void,
  track?: (event: string) => void,
) {
  emitter.on('increase-amount-failed-validation', function () {
    updateStakingDashboardOperation({
      status: StakingDashboardStatus.STAKE_TX_FAILED,
    })

    track?.('hemi stake - increase amount failed validation')
  })
  emitter.on('approve-failed', function () {
    updateStakingDashboardOperation({
      status: StakingDashboardStatus.APPROVAL_TX_FAILED,
    })

    track?.('hemi stake - approve increase amount failed')
  })
  emitter.on('increase-amount-failed', function () {
    updateStakingDashboardOperation({
      status: StakingDashboardStatus.STAKE_TX_FAILED,
    })

    track?.('hemi stake - increase amount failed')
  })
  emitter.on('unexpected-error', function () {
    updateStakingDashboardOperation({
      status: StakingDashboardStatus.STAKE_TX_FAILED,
    })

    track?.('hemi stake - unexpected error')
  })
}
