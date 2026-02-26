'use client'

import { DisplayAmount } from 'components/displayAmount'
import { useVeHemiToken } from 'hooks/useVeHemiToken'
import { useTranslations } from 'next-intl'
import { useMemo, type ReactNode } from 'react'
import { StakingPositionStatus } from 'types/stakingDashboard'
import { formatUnits } from 'viem'

import { usePositionsVotingPowerSum } from '../_hooks/usePositionsVotingPowerSum'
import { useStakingPositions } from '../_hooks/useStakingPositions'
import { useTotalVotingPower } from '../_hooks/useTotalVotingPower'

import { CardInfo } from './cardInfo'

export const VotingPowerSummary = function () {
  const t = useTranslations('staking-dashboard')
  const { data: positions } = useStakingPositions()
  const tokenIds = useMemo(
    () =>
      positions
        ?.filter(p => p.status === StakingPositionStatus.ACTIVE)
        .map(p => p.tokenId) ?? [],
    [positions],
  )
  const { data: veHemiToken } = useVeHemiToken()
  const { data: totalVotingPower, isError: isTotalError } =
    useTotalVotingPower()
  const { data: positionsSum, isError: isSumError } =
    usePositionsVotingPowerSum(tokenIds)

  const formatVeHemi = (value: bigint): ReactNode =>
    veHemiToken ? (
      <DisplayAmount
        amount={formatUnits(value, veHemiToken.decimals)}
        token={veHemiToken}
      />
    ) : (
      '...'
    )

  return (
    <div
      className="xs:flex-row flex w-full flex-col flex-wrap items-center justify-between gap-4 md:flex-nowrap md:gap-5
        [&>.card-container]:w-full [&>.card-container]:max-md:basis-[calc(50%-theme(spacing.2))]"
    >
      <CardInfo<bigint>
        data={positionsSum}
        formatValue={formatVeHemi}
        isError={isSumError}
        label={t('your-positions')}
      />
      <CardInfo<bigint>
        data={totalVotingPower}
        formatValue={formatVeHemi}
        isError={isTotalError}
        label={t('total-voting-power')}
      />
    </div>
  )
}
