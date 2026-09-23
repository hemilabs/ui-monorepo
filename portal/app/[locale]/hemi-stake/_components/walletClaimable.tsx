import { ErrorBoundary } from 'components/errorBoundary'
import { SparkleIcon } from 'components/icons/sparkleIcon'
import { StatCard } from 'components/statCard'
import { TokenLogo } from 'components/tokenLogo'
import { Tooltip } from 'components/tooltip'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { useMemo } from 'react'
import { type EvmToken, type TokenWithBalance } from 'types/token'
import { useLocale, useTranslations } from 'use-intl'
import { formatCompactFiat } from 'utils/format'
import { calculateUsdValue } from 'utils/prices'
import { isDataUnavailable } from 'utils/queryStatus'

import { useClaimablePositions } from '../_hooks/useClaimablePositions'
import { useRewardTokens } from '../_hooks/useRewardTokens'
import { useStakingPositions } from '../_hooks/useStakingPositions'
import { findRewardToken } from '../_utils/rewardToken'

import { RewardAmount } from './rewardsDisplay'
import { StatBadge, StatBadgeSkeleton } from './statBadge'

const ClaimableFiat = function ({
  prices,
  tokens,
}: {
  prices: Record<string, string>
  tokens: TokenWithBalance[]
}) {
  const locale = useLocale()
  return (
    <>
      {formatCompactFiat(Number(calculateUsdValue(tokens, prices)), locale, 2)}
    </>
  )
}

export const WalletClaimable = function () {
  const t = useTranslations('hemi-stake.stats')

  const positionsQuery = useStakingPositions()
  const pricesQuery = useTokenPrices()
  const { hasError, isPending: areTokensPending, tokens } = useRewardTokens()

  const tokenIds = useMemo(
    () => positionsQuery.data?.map(({ tokenId }) => tokenId) ?? [],
    [positionsQuery.data],
  )
  const rewardsQuery = useClaimablePositions(tokenIds)

  const claimable = rewardsQuery.rewards
    .filter(({ amount }) => amount > BigInt(0))
    .map(reward => ({ reward, token: findRewardToken(tokens, reward.token) }))
    .filter(
      (entry): entry is typeof entry & { token: EvmToken } =>
        entry.token !== undefined,
    )

  const withBalance = claimable.map(({ reward, token }) => ({
    ...token,
    address: reward.token,
    balance: reward.amount,
  }))

  const needsPrices = withBalance.length > 0

  const pricesUnavailable = isDataUnavailable({
    fetchStatus: pricesQuery.fetchStatus,
    status: pricesQuery.status,
  })

  const isError = [
    positionsQuery.isError,
    needsPrices && pricesUnavailable,
    rewardsQuery.isError,
    hasError,
  ].some(Boolean)

  const isLoading = [
    positionsQuery.status === 'pending' && !positionsQuery.isError,
    needsPrices && pricesQuery.isPending && !pricesUnavailable,
    rewardsQuery.isPending,
    areTokensPending,
  ].some(Boolean)

  const renderBadge = function () {
    if (isError || withBalance.length === 0) {
      return undefined
    }
    if (isLoading) {
      return <StatBadgeSkeleton size="xSmall" />
    }
    return (
      <Tooltip
        text={
          <div className="flex flex-col gap-y-1">
            {claimable.map(({ reward, token }) => (
              <RewardAmount key={reward.token} reward={reward} token={token} />
            ))}
          </div>
        }
        variant="rich"
      >
        <StatBadge>
          <span className="flex -space-x-1">
            {withBalance.map(token => (
              <span
                className="flex rounded-full ring-2 ring-neutral-100"
                key={token.address}
              >
                <TokenLogo size="xSmall" token={token} />
              </span>
            ))}
          </span>
          {t('claimable-tokens', { count: withBalance.length })}
        </StatBadge>
      </Tooltip>
    )
  }

  return (
    <StatCard
      badge={renderBadge()}
      icon={<SparkleIcon className="text-orange-600" />}
      isError={isError}
      isLoading={isLoading}
      label={t('your-claimable')}
      value={
        <ErrorBoundary fallback="-">
          <ClaimableFiat prices={pricesQuery.data ?? {}} tokens={withBalance} />
        </ErrorBoundary>
      }
    />
  )
}
