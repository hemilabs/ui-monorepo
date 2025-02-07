import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { getFormattedValue } from 'utils/format'
import { useAccount } from 'wagmi'

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
          <span className="text-neutral-950">
            {isConnected
              ? `${getFormattedValue(gas.amount)} ${gas.symbol}`
              : '-'}
          </span>
        )}
      </div>
      {total !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">{t('common.total')}</span>
          {isConnected && isLoading ? (
            <Skeleton className="w-12" />
          ) : (
            <span className="text-neutral-950">
              {isConnected
                ? `${getFormattedValue(total)} ${operationSymbol}`
                : '-'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
