import { useHemiToken } from 'hooks/useHemiToken'
import { useLocale } from 'next-intl'
import { formatUnits } from 'viem'

type Props = {
  decimals?: number
  percentageOfMax: number
  votingPower: bigint
}

export const VotingPower = function ({
  decimals = 18,
  percentageOfMax,
  votingPower,
}: Props) {
  const token = useHemiToken()
  const locale = useLocale()
  const formattedPower = formatUnits(votingPower, decimals)

  const numberFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 3, // Show up to 3 decimal places
  })

  const displayPower = numberFormatter.format(Number(formattedPower))
  const clampedPercentage = Math.min(100, Math.max(0, percentageOfMax))

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-neutral-950">
        {`${displayPower} ve${token.symbol}`}
      </span>
      <span className="text-xs font-normal text-neutral-500">
        {clampedPercentage.toFixed(0)}%
      </span>
    </div>
  )
}
