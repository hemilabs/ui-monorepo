import { useStakingDashboardState } from 'app/[locale]/hemi-stake/_hooks/useStakingDashboardState'
import { StakingDashboardStatus } from 'types/stakingDashboard'
import { describe, expect, it } from 'vitest'
import { renderHook } from 'vitest-browser-react'

const stakingPosition = { amount: BigInt(25), tokenId: BigInt(7) }

describe('useStakingDashboardState', function () {
  it('drops the previous operation when a new one starts', async function () {
    const { act, result } = await renderHook(() => useStakingDashboardState())

    await act(() =>
      result.current.updateStakingDashboardOperation({
        approvalTxHash: '0x01',
        status: StakingDashboardStatus.STAKE_TX_CONFIRMED,
        transactionHash: '0x02',
      }),
    )
    await act(() =>
      result.current.startStakingDashboardOperation({
        input: '0',
        stakingPosition,
      }),
    )

    expect(result.current.stakingDashboardOperation).toEqual({
      input: '0',
      stakingPosition,
    })
  })

  it('merges updates into the started operation', async function () {
    const { act, result } = await renderHook(() => useStakingDashboardState())

    await act(() =>
      result.current.startStakingDashboardOperation({ stakingPosition }),
    )
    await act(() =>
      result.current.updateStakingDashboardOperation({
        status: StakingDashboardStatus.STAKE_TX_PENDING,
      }),
    )

    expect(result.current.stakingDashboardOperation).toEqual({
      stakingPosition,
      status: StakingDashboardStatus.STAKE_TX_PENDING,
    })
  })

  it('ignores a start with an invalid input', async function () {
    const { act, result } = await renderHook(() => useStakingDashboardState())

    await act(() =>
      result.current.startStakingDashboardOperation({ stakingPosition }),
    )
    await act(() =>
      result.current.startStakingDashboardOperation({ input: 'abc' }),
    )

    expect(result.current.stakingDashboardOperation).toEqual({
      stakingPosition,
    })
  })
})
