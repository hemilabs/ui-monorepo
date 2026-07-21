'use client'

import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { DisplayAmount } from 'components/displayAmount'
import { useTokenBalance } from 'hooks/useBalance'
import { useBitcoinBalance } from 'hooks/useBitcoinBalance'
import Skeleton from 'react-loading-skeleton'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { isBalanceUnavailable } from 'utils/balance'
import { isNativeToken } from 'utils/nativeToken'
import { isEvmToken } from 'utils/token'
import { formatUnits } from 'viem'

type Props<T extends Token = Token> = {
  token: T
}

type SkeletonWidth = 'default' | 'wide'

const skeletonContainerClassNames: Record<SkeletonWidth, string> = {
  default: 'basis-1/3',
  wide: 'w-24',
}

export const RenderCryptoBalance = function ({
  balance,
  fetchStatus,
  showSymbol = false,
  skeletonWidth = 'default',
  status,
  token,
}: Props & {
  balance: bigint | undefined
  showSymbol?: boolean
  skeletonWidth?: SkeletonWidth
} & Pick<ReturnType<typeof useTokenBalance>, 'status'> &
  Partial<Pick<ReturnType<typeof useTokenBalance>, 'fetchStatus'>>) {
  if (balance !== undefined) {
    return (
      <DisplayAmount
        amount={formatUnits(balance, token.decimals)}
        showSymbol={showSymbol}
        token={token}
      />
    )
  }
  if (isBalanceUnavailable({ fetchStatus, status })) {
    return <>-</>
  }
  return (
    <Skeleton
      className="h-full"
      containerClassName={skeletonContainerClassNames[skeletonWidth]}
    />
  )
}

const NativeTokenBalance = function ({ token }: Props<EvmToken>) {
  const { data, fetchStatus, status } = useNativeBalance(token.chainId)
  return (
    <RenderCryptoBalance
      balance={data?.value}
      fetchStatus={fetchStatus}
      status={status}
      token={token}
    />
  )
}

const TokenBalance = function ({ token }: Props<EvmToken>) {
  const {
    data: balance,
    fetchStatus,
    status,
  } = useTokenBalance(token.chainId, token.address)
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
      balance={balance?.confirmed ? BigInt(balance?.confirmed) : undefined}
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
