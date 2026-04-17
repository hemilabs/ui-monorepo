import { DisplayAmount } from 'components/displayAmount'
import { useHemiToken } from 'hooks/useHemiToken'
import { useVeHemiToken } from 'hooks/useVeHemiToken'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { formatPercentage } from 'utils/format'
import { formatUnits, isAddress, isAddressEqual } from 'viem'
import { useAccount } from 'wagmi'

import { usePositionVotingPower } from '../../_hooks/usePositionVotingPower'

type Props = {
  amount: bigint
  owner: string
  tokenId: bigint
}

function calculatePercentageOfMax(amount: bigint, votingPower: bigint) {
  if (amount <= BigInt(0)) {
    return 0
  }
  return Math.min(100, Number((votingPower * BigInt(10000)) / amount) / 100)
}

function getBadgeKey({
  address,
  owner,
  votingPower,
}: {
  address: string | undefined
  owner: string
  votingPower: bigint
}) {
  const isCurrentOwner =
    !!address && isAddress(owner) && isAddressEqual(owner, address)
  if (isCurrentOwner && votingPower === BigInt(0)) {
    return 'table.delegated-out'
  }
  if (!isCurrentOwner && votingPower > BigInt(0)) {
    return 'table.from-delegation'
  }
  return null
}

export const VotingPower = function ({ amount, owner, tokenId }: Props) {
  const t = useTranslations('staking-dashboard')
  const token = useHemiToken()
  const { address } = useAccount()
  const { data: veHemiToken, isLoading: isLoadingVeHemiToken } =
    useVeHemiToken()
  const { data: votingPower, error } = usePositionVotingPower(tokenId)

  if (isLoadingVeHemiToken || !veHemiToken) {
    return <Skeleton className="h-10 w-20" />
  }

  if (error) {
    return <span className="text-sm text-neutral-950">-</span>
  }

  if (votingPower === undefined) {
    return <Skeleton className="h-10 w-20" />
  }

  const formattedPower = formatUnits(votingPower, token.decimals)
  const badgeKey = getBadgeKey({ address, owner, votingPower })
  const percentageOfMax = calculatePercentageOfMax(amount, votingPower)

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-neutral-950">
        <DisplayAmount amount={formattedPower} token={veHemiToken} />
      </span>
      <span className="text-xs font-normal text-neutral-500">
        {formatPercentage(percentageOfMax)}
      </span>
      {badgeKey && (
        <span
          className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
            badgeKey === 'table.delegated-out'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-sky-100 text-sky-800'
          }`}
        >
          {t(badgeKey)}
        </span>
      )}
    </div>
  )
}
