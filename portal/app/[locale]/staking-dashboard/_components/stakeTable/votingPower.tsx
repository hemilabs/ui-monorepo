import { DisplayAmount } from 'components/displayAmount'
import { useHemiToken } from 'hooks/useHemiToken'
import Skeleton from 'react-loading-skeleton'
import { formatPercentage } from 'utils/format'
import { formatUnits } from 'viem'

import { usePositionVotingPower } from '../../_hooks/usePositionVotingPower'

type Props = {
  amount: bigint
  tokenId: bigint
}

export const VotingPower = function ({ amount, tokenId }: Props) {
  const token = useHemiToken()
  const { data: votingPower, error } = usePositionVotingPower(tokenId)

  if (votingPower !== undefined) {
    const formattedPower = formatUnits(votingPower, token.decimals)

    const percentageOfMax =
      amount > BigInt(0)
        ? Math.min(100, Number((votingPower * BigInt(10000)) / amount) / 100)
        : 0

    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-neutral-950">
          {/* TODO https://github.com/hemilabs/ui-monorepo/issues/1661
            Read symbol from veHEMI contract
          */}
          <DisplayAmount
            amount={formattedPower}
            token={{ ...token, symbol: `ve${token.symbol}` }}
          />
        </span>
        <span className="text-xs font-normal text-neutral-500">
          {formatPercentage(percentageOfMax)}
        </span>
      </div>
    )
  }

  if (error) {
    return <span className="text-sm text-neutral-950">-</span>
  }

  return <Skeleton className="h-10 w-20" />
}
