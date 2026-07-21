import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { type FetchStatus, type QueryStatus } from '@tanstack/react-query'
import Big from 'big.js'
import { useTokenBalance } from 'hooks/useBalance'
import { useBitcoinBalance } from 'hooks/useBitcoinBalance'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { ComponentProps } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { isBalanceUnavailable } from 'utils/balance'
import { formatFiatNumber } from 'utils/format'
import { isNativeToken } from 'utils/nativeToken'
import { getTokenPrice, isEvmToken } from 'utils/token'
import { formatUnits } from 'viem'

import { ErrorBoundary } from './errorBoundary'

type Props<T extends Token = Token> = {
  token: T
}

const RenderFiatBalanceUnsafe = function ({
  balance,
  customFormatter = formatFiatNumber,
  fetchStatus,
  queryStatus,
  token,
  usePrices = useTokenPrices,
}: Props & {
  balance: bigint | undefined
  customFormatter?: (amount: string) => string
  fetchStatus?: FetchStatus
  queryStatus: QueryStatus
  // The price feed to read from. Defaults to the app-wide portal feed;
  // callers that price against a different feed (e.g. Hemi Earn's
  // oracle-merged `useEarnTokenPrices`) inject their own hook.
  usePrices?: typeof useTokenPrices
}) {
  const { data: pricesData, status: pricesStatus } = usePrices({
    retryOnMount: false,
  })

  if (balance !== undefined && pricesData !== undefined) {
    const stringBalance = formatUnits(balance, token.decimals)
    const price = getTokenPrice(token, pricesData)

    return (
      <>
        {customFormatter(
          Big(stringBalance).times(price).toFixed(token.decimals),
        )}
      </>
    )
  }

  if (
    isBalanceUnavailable({ fetchStatus, status: queryStatus }) ||
    pricesStatus === 'error'
  ) {
    return <>-</>
  }

  // Loading state (either balance or prices are loading)
  return <Skeleton className="h-full" containerClassName="w-8" />
}

export const RenderFiatBalance = (
  props: ComponentProps<typeof RenderFiatBalanceUnsafe>,
) => (
  // Prevent crashing if a price is missing or wrongly mapped
  <ErrorBoundary fallback="-">
    <RenderFiatBalanceUnsafe {...props} />
  </ErrorBoundary>
)

const NativeTokenBalance = function ({ token }: Props<EvmToken>) {
  const { data, fetchStatus, status } = useNativeBalance(token.chainId)
  return (
    <RenderFiatBalance
      balance={data?.value}
      fetchStatus={fetchStatus}
      queryStatus={status}
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
    <RenderFiatBalance
      balance={balance}
      fetchStatus={fetchStatus}
      queryStatus={status}
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
    <RenderFiatBalance
      balance={BigInt(balance?.confirmed ?? 0)}
      fetchStatus={fetchStatus}
      queryStatus={status}
      token={token}
    />
  )
}

export const FiatBalance = ({ token }: { token: Token }) =>
  isEvmToken(token) ? (
    <EvmBalance token={token} />
  ) : (
    <BtcBalance token={token} />
  )
