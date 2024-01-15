'use client'

import { useTokenBalance, useNativeTokenBalance } from 'hooks/useBalance'
import Skeleton from 'react-loading-skeleton'
import { Token } from 'types/token'
import { formatNumber, fromUnits } from 'utils/format'
import { isNativeToken } from 'utils/token'

type Props = {
  token: Token
}

const RenderBalance = ({
  balance,
  status,
  token,
}: Props & ReturnType<typeof useTokenBalance>) => (
  <>
    {status === 'loading' && (
      <Skeleton className="h-full" containerClassName="basis-1/3" />
    )}
    {(status === 'error' || status === 'idle') && '-'}
    {status === 'success' && formatNumber(fromUnits(balance, token.decimals))}
  </>
)

const NativeTokenBalance = function ({ token }: { token: Token }) {
  const { balance, status } = useNativeTokenBalance(token)
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
