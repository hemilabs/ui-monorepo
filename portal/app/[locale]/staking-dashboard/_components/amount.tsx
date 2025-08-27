import { DisplayAmount } from 'components/displayAmount'
import { TokenLogo } from 'components/tokenLogo'
import { useHemiToken } from 'hooks/useHemiToken'
import { StakingPosition } from 'types/stakingDashboard'
import { formatUnits } from 'viem'

type Props = {
  operation: StakingPosition
}

export const Amount = function ({ operation }: Props) {
  const { amount } = operation

  const token = useHemiToken()

  return (
    <div className="flex items-center gap-x-1.5 text-neutral-950">
      <TokenLogo size="small" token={token} version="L1" />
      <DisplayAmount
        amount={formatUnits(BigInt(amount), token.decimals)}
        showSymbol={false}
        token={token}
      />
      <span className="text-sm">{`${token.symbol}`}</span>
    </div>
  )
}
