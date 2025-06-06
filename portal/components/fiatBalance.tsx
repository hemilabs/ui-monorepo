import { type FetchStatus, QueryStatus } from '@tanstack/react-query'
import Big from 'big.js'
import { useTokenBalance, useNativeTokenBalance } from 'hooks/useBalance'
import { useBitcoinBalance } from 'hooks/useBitcoinBalance'
import { useTokenPrices } from 'hooks/useTokenPrices'
import { ComponentProps } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { formatFiatNumber } from 'utils/format'
import { isNativeToken } from 'utils/nativeToken'
import { getTokenPrice, isEvmToken } from 'utils/token'
import { formatUnits } from 'viem'

import { ErrorBoundary } from './errorBoundary'

type Props<T extends Token = Token> = {
  token: T
}

const RenderFiatBalanceUnsafe = function ({
  balance = BigInt(0),
  customFormatter = formatFiatNumber,
  fetchStatus,
  queryStatus,
  token,
}: Props & {
  balance: bigint | undefined
  customFormatter?: (amount: string) => string
  fetchStatus: FetchStatus
  queryStatus: QueryStatus
}) {
  const {
    data,
    fetchStatus: tokenPricesFetchStatus,
    status: pricesStatus,
  } = useTokenPrices({ retryOnMount: false })

  const stringBalance = formatUnits(balance, token.decimals)

  const price = getTokenPrice(token, data)

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
            {customFormatter(
              Big(stringBalance).times(price).toFixed(token.decimals),
            )}
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
  const { balance, fetchStatus, status } = useTokenBalance(
    token.chainId,
    token.address,
  )
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
