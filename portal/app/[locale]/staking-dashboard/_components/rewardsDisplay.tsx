import { useHemiToken } from 'hooks/useHemiToken'
import { useRewardTokens } from 'hooks/useRewardTokens'
import { EvmToken } from 'types/token'
import { formatNumber } from 'utils/format'
import { formatUnits } from 'viem'
import type { Address } from 'viem'

import { useCalculateRewards } from '../_hooks/useCalculateRewards'

type Props = {
  tokenId: string
}

function RewardRow({
  rewardToken,
  symbol,
  token,
  tokenId,
}: {
  rewardToken: Address
  symbol: string
  token: EvmToken
  tokenId: string
}) {
  const { data, isLoading } = useCalculateRewards({
    rewardToken,
    token,
    tokenId: BigInt(tokenId),
  })
  const formattedAmount =
    isLoading || data === undefined
      ? '-'
      : formatNumber(formatUnits(data, token.decimals))

  return (
    <p className="space-x-1 text-sm font-medium text-neutral-950">
      <span>{formattedAmount}</span>
      <span>{symbol}</span>
    </p>
  )
}

export function RewardsDisplay({ tokenId }: Props) {
  const token = useHemiToken()
  const rewardTokens = useRewardTokens()

  return (
    <div className="space-y-1">
      {rewardTokens.map(({ address, symbol }) => (
        <RewardRow
          key={address}
          rewardToken={address}
          symbol={symbol}
          token={token}
          tokenId={tokenId}
        />
      ))}
    </div>
  )
}
