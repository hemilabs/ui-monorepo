import { DisplayAmount } from 'components/displayAmount'
import { TokenLogo } from 'components/tokenLogo'
import { useToken } from 'hooks/useToken'
import Skeleton from 'react-loading-skeleton'
import { TunnelOperation } from 'types/tunnel'
import { getTunnelTokenSymbol } from 'utils/token'
import { isDeposit } from 'utils/tunnel'
import { formatUnits } from 'viem'

type Props = {
  operation: TunnelOperation
}

export const Amount = function ({ operation }: Props) {
  const { amount, l1Token, l2Token } = operation

  const tokenAddress = isDeposit(operation) ? l1Token : l2Token
  const chainId = isDeposit(operation)
    ? operation.l1ChainId
    : operation.l2ChainId

  const { data: token, isLoading } = useToken({
    address: tokenAddress,
    chainId,
  })

  if (isLoading) {
    return <Skeleton className="w-16" />
  }

  // This point should not be reachable, but in case it is, this will give a better handling error
  if (!token) {
    throw new Error(`Missing token ${tokenAddress} in chain ${chainId}`)
  }

  return (
    <div className="flex items-center gap-x-1.5 text-neutral-950">
      <TokenLogo size="small" token={token} />
      <DisplayAmount
        amount={formatUnits(BigInt(amount), token.decimals)}
        showSymbol={false}
        symbolRenderer={getTunnelTokenSymbol}
        token={token}
      />
    </div>
  )
}
