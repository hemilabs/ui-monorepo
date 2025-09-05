'use client'

import { DisplayAmount } from 'components/displayAmount'
import { useTokenBalance, useNativeTokenBalance } from 'hooks/useBalance'
import { useBitcoinBalance } from 'hooks/useBitcoinBalance'
import Skeleton from 'react-loading-skeleton'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
import { isEvmToken } from 'utils/token'
import { formatUnits } from 'viem'

type Props<T extends Token = Token> = {
  token: T
}

export const RenderCryptoBalance = ({
  balance,
  fetchStatus,
  status,
  token,
}: Props & { balance: bigint } & Pick<
    ReturnType<typeof useTokenBalance>,
    'fetchStatus' | 'status'
  >) => (
  <>
    {status === 'pending' && fetchStatus === 'fetching' && (
      <Skeleton className="h-full" containerClassName="basis-1/3" />
    )}
    {(status === 'error' || (status === 'pending' && fetchStatus === 'idle')) &&
      '-'}
    {status === 'success' && (
      <DisplayAmount
        amount={formatUnits(balance, token.decimals)}
        showSymbol={false}
        token={token}
      />
    )}
  </>
)

const NativeTokenBalance = function ({ token }: Props<EvmToken>) {
  const { balance, fetchStatus, status } = useNativeTokenBalance(token.chainId)
  return (
    <RenderCryptoBalance
      balance={balance}
      fetchStatus={fetchStatus}
      status={status}
      token={token}
    />
  )
}

const TokenBalance = function ({ token }: Props<EvmToken>) {
  const { balance, fetchStatus, status } = useTokenBalance(
    token.chainId,
    token.address,
  )
  return (
    <RenderCryptoBalance
      balance={balance}
      fetchStatus={fetchStatus}
      status={status}
      token={token}
    />
  )
}

const EvmBalance = (props: Props<EvmToken>) =>
  isNativeToken(props.token) ? (
    <NativeTokenBalance {...props} />
  ) : (
    <TokenBalance {...props} />
  )

const BtcBalance = function ({ token }: Props<BtcToken>) {
  const { balance, fetchStatus, status } = useBitcoinBalance()
  return (
    <RenderCryptoBalance
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
