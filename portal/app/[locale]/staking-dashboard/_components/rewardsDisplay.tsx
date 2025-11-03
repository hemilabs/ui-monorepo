import { DisplayAmount } from 'components/displayAmount'
import { EvmToken } from 'types/token'
import { formatUnits } from 'viem'

import { useCalculateRewards } from '../_hooks/useCalculateRewards'
import { RewardTokenConfig, useRewardTokens } from '../_hooks/useRewardTokens'

type Props = {
  tokenId: string
}

function RewardRow({
  token,
  tokenId,
}: {
  token: EvmToken | RewardTokenConfig
  tokenId: string
}) {
  const { data, isLoading } = useCalculateRewards({
    rewardToken: token.address,
    token,
    tokenId: BigInt(tokenId),
  })
  const formattedAmount =
    isLoading || data === undefined ? '0' : formatUnits(data, token.decimals)

  return (
    <div className="space-x-1 text-sm font-medium text-neutral-950">
      <DisplayAmount amount={formattedAmount} token={token as EvmToken} />
    </div>
  )
}

export function RewardsDisplay({ tokenId }: Props) {
  const { tokens: rewardTokens } = useRewardTokens()

  return (
    <div className="space-y-1">
      {rewardTokens.map(item => (
        <RewardRow key={item.address} token={item} tokenId={tokenId} />
      ))}
    </div>
  )
}
