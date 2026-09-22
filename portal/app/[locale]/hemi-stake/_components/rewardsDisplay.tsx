import { TokenLogo } from 'components/tokenLogo'
import { Tooltip } from 'components/tooltip'
import Skeleton from 'react-loading-skeleton'
import { type ClaimableReward } from 'types/stakingDashboard'
import { type EvmToken } from 'types/token'
import { useTranslations } from 'use-intl'
import { formatNumber } from 'utils/format'
import { formatUnits, isAddress, isAddressEqual } from 'viem'

import { useClaimableRewards } from '../_hooks/useClaimableRewards'
import { useRewardTokens } from '../_hooks/useRewardTokens'

type Props = {
  tokenId: bigint
}

type RewardAmountProps = {
  reward: ClaimableReward
  token: EvmToken | undefined
}

export const RewardAmount = ({ reward, token }: RewardAmountProps) => (
  <div className="flex items-center gap-x-1 text-sm font-medium text-white">
    {token ? <TokenLogo size="xSmall" token={token} /> : null}
    <span>{`${formatNumber(formatUnits(reward.amount, reward.decimals))} ${
      reward.symbol
    }`}</span>
  </div>
)

export function RewardsDisplay({ tokenId }: Props) {
  const t = useTranslations('hemi-stake.table')
  const { hasError, isPending: areTokensPending, tokens } = useRewardTokens()
  const { isError, isPending, rewards } = useClaimableRewards(tokenId)

  const claimable = rewards.filter(({ amount }) => amount > BigInt(0))

  if (hasError || isError) {
    return <span className="text-sm text-neutral-950">-</span>
  }

  if (isPending || areTokensPending) {
    return <Skeleton className="h-10 w-20" />
  }

  if (claimable.length === 0) {
    return null
  }

  const getToken = (reward: ClaimableReward) =>
    tokens.find(
      token =>
        isAddress(token.address) && isAddressEqual(token.address, reward.token),
    )

  return (
    <Tooltip
      text={
        <div className="flex flex-col gap-y-1">
          {claimable.map(reward => (
            <RewardAmount
              key={reward.token}
              reward={reward}
              token={getToken(reward)}
            />
          ))}
        </div>
      }
      variant="rich"
    >
      <div className="flex flex-col items-start gap-y-0.5">
        <div className="flex -space-x-1">
          {claimable.map(function (reward) {
            const token = getToken(reward)
            return token ? (
              <div
                className="rounded-full ring-2 ring-white"
                key={token.address}
              >
                <TokenLogo size="xSmall" token={token} />
              </div>
            ) : null
          })}
        </div>
        <span className="body-text-caption text-neutral-500">
          {t('rewards-available', { count: claimable.length })}
        </span>
      </div>
    </Tooltip>
  )
}
