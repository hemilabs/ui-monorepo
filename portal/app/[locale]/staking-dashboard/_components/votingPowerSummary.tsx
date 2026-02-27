'use client'

import { DisplayAmount } from 'components/displayAmount'
import { useVeHemiToken } from 'hooks/useVeHemiToken'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'
import { formatUnits } from 'viem'

import { usePositionsVotingPowerSum } from '../_hooks/usePositionsVotingPowerSum'
import { useTotalVotingPower } from '../_hooks/useTotalVotingPower'

import { CardInfo } from './cardInfo'

export const VotingPowerSummary = function () {
  const t = useTranslations('staking-dashboard')
  const { data: veHemiToken } = useVeHemiToken()
  const { data: totalVotingPower, isError: isTotalError } =
    useTotalVotingPower()
  const { data: positionsSum, isError: isSumError } =
    usePositionsVotingPowerSum()

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
      className="xs:flex-row flex w-full flex-col flex-wrap items-center justify-between gap-6 md:flex-nowrap
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
