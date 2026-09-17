import { TokenLogo } from 'components/tokenLogo'
import { Tooltip } from 'components/tooltip'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'types/token'
import { useTranslations } from 'use-intl'
import { isDataUnavailable } from 'utils/queryStatus'

import { useCalculateRewards } from '../_hooks/useCalculateRewards'
import { useClaimedHistory } from '../_hooks/useClaimedHistory'
import { useHasRewards } from '../_hooks/useHasRewards'
import { useRewardTokens } from '../_hooks/useRewardTokens'
import { claimedTotals } from '../_utils/claimedTotals'
import { formatRewardAmount } from '../_utils/rewardAmount'

import { ClaimTotal } from './claimTotal'

type Props = {
  tokenId: bigint
}

export function RewardAmount({
  className = 'text-white',
  token,
  tokenId,
}: {
  // The colour belongs to the surface. This was written for the dark tooltip, and
  // reusing it on the light claim drawer rendered the amounts white on near-white.
  className?: string
  token: EvmToken
  tokenId: bigint
}) {
  const { data, decimals, fetchStatus, isMissingRow, status, symbol } =
    useCalculateRewards({
      rewardToken: token.address,
      token,
      tokenId,
    })

  // Data, then unavailable, then loading - the order CLAUDE.md prescribes. A read that
  // failed or never ran must not be painted as a zero balance.
  const renderAmount = function () {
    if (data !== undefined) {
      return `${formatRewardAmount({
        amount: data,
        decimals: decimals ?? token.decimals,
      })} ${symbol ?? token.symbol}`
    }
    if (isMissingRow || isDataUnavailable({ fetchStatus, status })) {
      return `- ${symbol ?? token.symbol}`
    }
    return <Skeleton className="h-4 w-16" />
  }

  return (
    <div
      className={`flex items-center gap-x-1 text-sm font-medium ${className}`}
    >
      <TokenLogo size="xSmall" token={token} />
      <span>{renderAmount()}</span>
    </div>
  )
}

export function RewardsDisplay({ tokenId }: Props) {
  const t = useTranslations('staking-dashboard.table')
  const { hasError, isPending, tokens: rewardTokens } = useRewardTokens()
  // Counts assets this position holds a balance in. Counting the registry instead put
  // "2 Available" beside a tooltip reading "0 HEMI, 0 hemiBTC" after every claim.
  const { isRewardsUnavailable, rewardsWithBalance } = useHasRewards(tokenId)
  const { data: history } = useClaimedHistory()
  const claimed = claimedTotals({
    assets: rewardTokens,
    rows: history,
    tokenId,
  })

  if (hasError || isRewardsUnavailable) {
    return <span className="text-sm text-neutral-950">-</span>
  }

  // The amounts decide the caption, so wait for them rather than correcting it later.
  if (isPending || rewardsWithBalance === undefined) {
    return <Skeleton className="h-10 w-20" />
  }

  if (rewardTokens.length === 0) {
    return <span className="text-sm text-neutral-950">-</span>
  }

  return (
    <Tooltip
      text={
        <div className="flex flex-col gap-y-1">
          {rewardTokens.map(token => (
            <RewardAmount key={token.address} token={token} tokenId={tokenId} />
          ))}
          {/* What this wallet has already been paid for this position. Kept below the
              claimable figures and behind a rule, because it answers a different
              question and must not read as more money waiting. */}
          {claimed.length > 0 && (
            <>
              <div className="my-1 h-px bg-white/20" />
              <span className="body-text-caption text-neutral-400">
                {t('rewards-claimed')}
              </span>
              {claimed.map(total => (
                <ClaimTotal
                  className="text-white"
                  key={total.token}
                  total={total}
                />
              ))}
            </>
          )}
        </div>
      }
      variant="rich"
    >
      <div className="flex flex-col items-start gap-y-0.5">
        <div className="flex -space-x-1">
          {rewardTokens.map(token => (
            <div className="rounded-full ring-2 ring-white" key={token.address}>
              <TokenLogo size="xSmall" token={token} />
            </div>
          ))}
        </div>
        <span className="body-text-caption text-neutral-500">
          {t('rewards-available', { count: rewardsWithBalance })}
        </span>
      </div>
    </Tooltip>
  )
}
