import { TokenLogo } from 'components/tokenLogo'
import { Tooltip } from 'components/tooltip'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'types/token'
import { useTranslations } from 'use-intl'
import { formatNumber } from 'utils/format'
import { formatUnits } from 'viem'

import { useCalculateRewards } from '../_hooks/useCalculateRewards'
import { useRewardTokens } from '../_hooks/useRewardTokens'

type Props = {
  tokenId: bigint
}

function RewardAmount({
  token,
  tokenId,
}: {
  token: EvmToken
  tokenId: bigint
}) {
  const { data, isLoading } = useCalculateRewards({
    rewardToken: token.address,
    token,
    tokenId,
  })

  const formattedAmount =
    isLoading || data === undefined ? '0' : formatUnits(data, token.decimals)

  return (
    <div className="flex items-center gap-x-1 text-sm font-medium text-white">
      <TokenLogo size="xSmall" token={token} />
      <span>{`${formatNumber(formattedAmount)} ${token.symbol}`}</span>
    </div>
  )
}

export function RewardsDisplay({ tokenId }: Props) {
  const t = useTranslations('staking-dashboard.table')
  const { hasError, isPending, tokens: rewardTokens } = useRewardTokens()

  if (hasError) {
    return <span className="text-sm text-neutral-950">-</span>
  }

  if (isPending) {
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
          {t('rewards-available', { count: rewardTokens.length })}
        </span>
      </div>
    </Tooltip>
  )
}
