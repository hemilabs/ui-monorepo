'use client'

import { useBalance as useBtcBalance } from 'btc-wallet/hooks/useBalance'
import { useTokenBalance, useNativeTokenBalance } from 'hooks/useBalance'
import Skeleton from 'react-loading-skeleton'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { formatNumber } from 'utils/format'
import { isEvmToken, isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'

type Props<T extends Token = Token> = {
  token: T
}

export const RenderBalance = ({
  balance,
  fetchStatus,
  status,
  token,
}: Props &
  Pick<
    ReturnType<typeof useTokenBalance>,
    'balance' | 'fetchStatus' | 'status'
  >) => (
  <>
    {status === 'pending' && fetchStatus === 'fetching' && (
      <Skeleton className="h-full" containerClassName="basis-1/3" />
    )}
    {(status === 'error' || (status === 'pending' && fetchStatus === 'idle')) &&
      '-'}
    {status === 'success' &&
      formatNumber(formatUnits(balance, token.decimals), 2)}
  </>
)

const NativeTokenBalance = function ({ token }: Props<EvmToken>) {
  const { balance, fetchStatus, status } = useNativeTokenBalance(token.chainId)
  return (
    <RenderBalance
      balance={balance}
      fetchStatus={fetchStatus}
      status={status}
      token={token}
    />
  )
}

const TokenBalance = function ({ token }: Props<EvmToken>) {
  const { balance, fetchStatus, status } = useTokenBalance(token)
  return (
    <RenderBalance
      balance={balance}
      fetchStatus={fetchStatus}
      status={status}
      token={token}
    />
  )
}

const EvmBalance = ({ token }: Props<EvmToken>) =>
  isNativeToken(token) ? (
    <NativeTokenBalance token={token} />
  ) : (
    <TokenBalance token={token} />
  )

const BtcBalance = function ({ token }: Props<BtcToken>) {
  const { balance, fetchStatus, status } = useBtcBalance()
  return (
    <RenderBalance
      balance={BigInt(balance?.confirmed ?? 0)}
      fetchStatus={fetchStatus}
      status={status}
      token={token}
    />
  )
}

export const Balance = ({ token }: Props) =>
  isEvmToken(token) ? (
    <EvmBalance token={token} />
  ) : (
    <BtcBalance token={token} />
  )
