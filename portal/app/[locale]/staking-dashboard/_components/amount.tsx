import { DisplayAmount } from 'components/displayAmount'
import { TokenLogo } from 'components/tokenLogo'
import { useToken } from 'hooks/useToken'
import Skeleton from 'react-loading-skeleton'
import { Chain, formatUnits } from 'viem'

type Props = {
  amount: string
  chainId: Chain['id']
  tokenAddress: string
}

export const Amount = function ({ amount, chainId, tokenAddress }: Props) {
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
        token={token}
      />
      <span className="text-sm">{`${token.symbol}`}</span>
    </div>
  )
}
