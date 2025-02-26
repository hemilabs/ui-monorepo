import { type FetchStatus, QueryStatus } from '@tanstack/react-query'
import Big from 'big.js'
import { useBalance as useBtcBalance } from 'btc-wallet/hooks/useBalance'
import { useTokenBalance, useNativeTokenBalance } from 'hooks/useBalance'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { ComponentProps } from 'react'
import Skeleton from 'react-loading-skeleton'
import { smartRound } from 'smart-round'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
import { isEvmToken } from 'utils/token'
import { formatUnits } from 'viem'

import { ErrorBoundary } from './errorBoundary'

type Props<T extends Token = Token> = {
  token: T
}

const fiatRounder = smartRound(6, 2, 2)

const RenderFiatBalanceUnsafe = function ({
  balance = BigInt(0),
  fetchStatus,
  queryStatus,
  token,
}: Props & {
  balance: bigint | undefined
  fetchStatus: FetchStatus
  queryStatus: QueryStatus
}) {
  const {
    data,
    fetchStatus: tokenPricesFetchStatus,
    status: pricesStatus,
  } = useTokenPrices()

  const stringBalance = formatUnits(balance, token.decimals)

  const price =
    data?.[(token.extensions?.priceSymbol ?? token.symbol).toUpperCase()] ?? '0'

  const mergedFetchStatuses = function () {
    const fetchStatuses = [fetchStatus, tokenPricesFetchStatus]
    if (fetchStatuses.includes('fetching')) {
      return 'fetching'
    }
    if (fetchStatuses.includes('paused')) {
      return 'paused'
    }
    return 'idle'
  }

  const mergedStatus = function () {
    const statuses = [queryStatus, pricesStatus]
    if (statuses.includes('pending')) {
      return 'pending'
    }
    if (statuses.includes('error')) {
      return 'error'
    }
    return 'success'
  }

  const mergedFetchStatus = mergedFetchStatuses()
  const status = mergedStatus()

  return (
    // Prevent crashing if a price is missing or wrongly mapped
    <ErrorBoundary fallback="-">
      <>
        {status === 'pending' && mergedFetchStatus === 'fetching' && (
          <Skeleton className="h-full" containerClassName="w-8" />
        )}
        {(status === 'error' ||
          (status === 'pending' && mergedFetchStatus === 'idle')) &&
          '-'}
        {status === 'success' && (
          <>
            {fiatRounder(Big(stringBalance).times(price).toFixed(2), {
              shouldFormat: true,
            })}
          </>
        )}
      </>
    </ErrorBoundary>
  )
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
  const { balance, fetchStatus, status } = useNativeTokenBalance(token.chainId)
  return (
    <RenderFiatBalance
      balance={balance}
      fetchStatus={fetchStatus}
      queryStatus={status}
      token={token}
    />
  )
}

const TokenBalance = function ({ token }: Props<EvmToken>) {
  const { balance, fetchStatus, status } = useTokenBalance(token)
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
  const { balance, fetchStatus, status } = useBtcBalance()
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
