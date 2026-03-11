'use client'

import { DisplayAmount } from 'components/displayAmount'
import { useVeHemiToken } from 'hooks/useVeHemiToken'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { usePositionsVotingPowerSum } from '../_hooks/usePositionsVotingPowerSum'
import { useTotalVotingPower } from '../_hooks/useTotalVotingPower'

import { CardInfo } from './cardInfo'

export const VotingPowerSummary = function () {
  const t = useTranslations('staking-dashboard')
  const { address, status } = useAccount()
  const { data: veHemiToken } = useVeHemiToken()
  const { data: totalVotingPower, isError: isTotalError } =
    useTotalVotingPower()
  const { data: positionsSum, isError: isSumError } =
    usePositionsVotingPowerSum()

  const isWalletReady =
    status === 'connected' || (status === 'reconnecting' && !!address)

  const formatVeHemi = (value: bigint): ReactNode =>
    veHemiToken ? (
      <DisplayAmount
        amount={formatUnits(value, veHemiToken.decimals)}
        token={veHemiToken}
      />
    ) : null

  return (
    <div
      className="xs:flex-row flex w-full flex-col flex-wrap items-center justify-between gap-6 md:flex-nowrap
        [&>.card-container]:w-full [&>.card-container]:max-md:min-w-0 [&>.card-container]:max-md:basis-full"
    >
      <CardInfo<bigint>
        data={isWalletReady ? positionsSum : undefined}
        formatValue={formatVeHemi}
        isError={isWalletReady ? isSumError : false}
        label={t('your-positions')}
      />
      <CardInfo<bigint>
        data={isWalletReady ? totalVotingPower : undefined}
        formatValue={formatVeHemi}
        isError={isWalletReady ? isTotalError : false}
        label={t('total-voting-power')}
      />
    </div>
  )
}
