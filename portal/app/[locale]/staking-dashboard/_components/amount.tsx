import { DisplayAmount } from 'components/displayAmount'
import { TokenLogo } from 'components/tokenLogo'
import { TxLink } from 'components/txLink'
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
    <div className="flex items-center gap-x-5 text-neutral-950">
      <TokenLogo size="medium" token={token} version="L1" />
      <div className="flex flex-col">
        <div className="flex items-center gap-x-1.5">
          <DisplayAmount
            amount={formatUnits(BigInt(amount), token.decimals)}
            logoVersion="L1"
            showSymbol={false}
            token={token}
          />
          <span className="text-sm">{token.symbol}</span>
        </div>
        <span className="text-xs font-normal text-neutral-500">
          <TxLink
            chainId={token.chainId}
            textColor="neutral-500"
            txHash={operation.transactionHash}
          />
        </span>
      </div>
    </div>
  )
}
