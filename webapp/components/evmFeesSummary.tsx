import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { Token } from 'types/token'
import { useAccount } from 'wagmi'

import { DisplayAmount } from './displayAmount'

export const EvmFeesSummary = function ({
  gas,
  operationToken,
  total,
}: {
  gas: {
    amount: string
    label: string
    token: Token
  }
  operationToken: Token
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
              <DisplayAmount
                amount={gas.amount}
                showTokenLogo={false}
                token={gas.token}
              />
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
                <DisplayAmount
                  amount={total}
                  showTokenLogo={false}
                  token={operationToken}
                />
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
