import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { useAccount } from 'wagmi'

import { DisplayAmount } from './displayAmount'

export const EvmFeesSummary = function ({
  gas,
  operationSymbol,
  total,
}: {
  gas: {
    amount: string
    label: string
    symbol: string
  }
  operationSymbol: string
  total?: string
}) {
  const { isConnected } = useAccount()
  const t = useTranslations()
  // gas can't be exact zero. If zero, it means it is loading.
  const isLoading = gas.amount === '0'
  return (
    <div className="flex flex-col gap-y-1 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{gas.label}</span>
        {isConnected && isLoading ? (
          <Skeleton className="w-12" />
        ) : (
          <div className="text-neutral-950">
            {isConnected ? (
              <DisplayAmount amount={gas.amount} symbol={gas.symbol} />
            ) : (
              <span>-</span>
            )}
          </div>
        )}
      </div>
      {total !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">{t('common.total')}</span>
          {isConnected && isLoading ? (
            <Skeleton className="w-12" />
          ) : (
            <div className="text-neutral-950">
              {isConnected ? (
                <DisplayAmount amount={total} symbol={operationSymbol} />
              ) : (
                <span>-</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
