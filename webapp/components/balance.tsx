'use client'

import { useTokenBalance, useNativeTokenBalance } from 'hooks/useBalance'
import Skeleton from 'react-loading-skeleton'
import { Token } from 'types/token'
import { formatNumber } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'

type Props = {
  token: Token
}

const RenderBalance = ({
  balance,
  status,
  token,
}: Props & Pick<ReturnType<typeof useTokenBalance>, 'balance' | 'status'>) => (
  <>
    {status === 'loading' && (
      <Skeleton className="h-full" containerClassName="basis-1/3" />
    )}
    {(status === 'error' || status === 'idle') && '-'}
    {status === 'success' &&
      formatNumber(formatUnits(balance, token.decimals), 2)}
  </>
)

const NativeTokenBalance = function ({ token }: { token: Token }) {
  const { balance, status } = useNativeTokenBalance(token.chainId)
  return <RenderBalance balance={balance} status={status} token={token} />
}

const TokenBalance = function ({ token }: { token: Token }) {
  const { balance, status } = useTokenBalance(token)
  return <RenderBalance balance={balance} status={status} token={token} />
}

export const Balance = ({ token }: Props) =>
  isNativeToken(token) ? (
    <NativeTokenBalance token={token} />
  ) : (
    <TokenBalance token={token} />
  )
