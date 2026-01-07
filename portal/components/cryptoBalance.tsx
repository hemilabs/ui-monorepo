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

export const RenderCryptoBalance = function ({
  balance,
  showSymbol = false,
  status,
  token,
}: Props & { balance: bigint | undefined; showSymbol?: boolean } & Pick<
    ReturnType<typeof useTokenBalance>,
    'status'
  >) {
  if (balance !== undefined) {
    return (
      <DisplayAmount
        amount={formatUnits(balance, token.decimals)}
        showSymbol={showSymbol}
        token={token}
      />
    )
  }
  if (status === 'error') {
    return <>-</>
  }
  // Loading state
  return <Skeleton className="h-full" containerClassName="basis-1/3" />
}

const NativeTokenBalance = function ({ token }: Props<EvmToken>) {
  const { data, status } = useNativeTokenBalance(token.chainId)
  return (
    <RenderCryptoBalance balance={data?.value} status={status} token={token} />
  )
}

const TokenBalance = function ({ token }: Props<EvmToken>) {
  const { data: balance, status } = useTokenBalance(
    token.chainId,
    token.address,
  )
  return <RenderCryptoBalance balance={balance} status={status} token={token} />
}

const EvmBalance = (props: Props<EvmToken>) =>
  isNativeToken(props.token) ? (
    <NativeTokenBalance {...props} />
  ) : (
    <TokenBalance {...props} />
  )

const BtcBalance = function ({ token }: Props<BtcToken>) {
  const { balance, status } = useBitcoinBalance()
  return (
    <RenderCryptoBalance
      balance={balance?.confirmed ? BigInt(balance?.confirmed) : undefined}
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
