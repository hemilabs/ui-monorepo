'use client'

import { CardInfo } from 'components/cardInfo'
import { DisplayAmount } from 'components/displayAmount'
import { useVeHemiToken } from 'hooks/useVeHemiToken'
import { type ReactNode } from 'react'
import { useTranslations } from 'use-intl'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { usePositionsVotingPowerSum } from '../_hooks/usePositionsVotingPowerSum'
import { useTotalVotingPower } from '../_hooks/useTotalVotingPower'

export const VotingPowerSummary = function () {
  const t = useTranslations('staking-dashboard')
  const { status } = useAccount()
  const { data: veHemiToken } = useVeHemiToken()
  const { data: totalVotingPower, isError: isTotalError } =
    useTotalVotingPower()
  const { data: positionsSum, isError: isSumError } =
    usePositionsVotingPowerSum()

  const isConnected = walletIsConnected(status)

  const formatVeHemi = (value: bigint): ReactNode =>
    veHemiToken ? (
      <DisplayAmount
        amount={formatUnits(value, veHemiToken.decimals)}
        token={veHemiToken}
      />
    ) : null

  return (
    <div className="flex w-full flex-col flex-wrap items-center justify-between gap-6 xs:flex-row md:flex-nowrap [&>.card-container]:w-full [&>.card-container]:max-md:min-w-0 [&>.card-container]:max-md:basis-full">
      <CardInfo<bigint>
        data={isConnected ? positionsSum : undefined}
        formatValue={formatVeHemi}
        isError={!isConnected || isSumError}
        label={t('your-positions')}
      />
      <CardInfo<bigint>
        data={isConnected ? totalVotingPower : undefined}
        formatValue={formatVeHemi}
        isError={!isConnected || isTotalError}
        label={t('total-voting-power')}
      />
    </div>
  )
}
