import { DisplayAmount } from 'components/displayAmount'
import { useHemiToken } from 'hooks/useHemiToken'
import { useVeHemiToken } from 'hooks/useVeHemiToken'
import Skeleton from 'react-loading-skeleton'
import { formatPercentage } from 'utils/format'
import { formatUnits } from 'viem'

import { usePositionVotingPower } from '../../_hooks/usePositionVotingPower'

type Props = {
  amount: bigint
  isBurned?: boolean
  tokenId: bigint
}

export const VotingPower = function ({
  amount,
  isBurned = false,
  tokenId,
}: Props) {
  const token = useHemiToken()
  const { data: veHemiToken, isLoading: isLoadingVeHemiToken } =
    useVeHemiToken()
  const { data: votingPower, error } = usePositionVotingPower(tokenId, {
    enabled: !isBurned,
  })

  if (isBurned) {
    // Burned (withdrawn) positions carry no voting power, so render the
    // placeholder directly instead of issuing an on-chain query and flashing
    // a loading skeleton.
    return <span className="text-sm text-neutral-950">-</span>
  }

  if (isLoadingVeHemiToken || !veHemiToken) {
    return <Skeleton className="h-10 w-20" />
  }

  if (error && votingPower === undefined) {
    return <span className="text-sm text-neutral-950">-</span>
  }

  if (votingPower === undefined) {
    return <Skeleton className="h-10 w-20" />
  }

  const formattedPower = formatUnits(votingPower, token.decimals)
  const percentageOfMax =
    amount > BigInt(0)
      ? Math.min(100, Number((votingPower * BigInt(10000)) / amount) / 100)
      : 0

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-neutral-950">
        <DisplayAmount amount={formattedPower} token={veHemiToken} />
      </span>
      <span className="body-text-caption text-neutral-500">
        {formatPercentage(percentageOfMax)}
      </span>
    </div>
  )
}
