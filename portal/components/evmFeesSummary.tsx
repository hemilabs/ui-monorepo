import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { Token } from 'types/token'

import { DisplayAmount } from './displayAmount'

export const EvmFeesSummary = function ({
  gas,
  operationToken,
  total,
}: {
  gas: {
    amount: string
    isError: boolean
    label: string
    token: Token
  }
  operationToken: Token
  total?: string
}) {
  const t = useTranslations()

  // gas can't be exact zero. If zero and there is no errors, it means it is loading.
  const shouldShowSkeleton = gas.amount === '0' && !gas.isError

  const shouldShowAmount = !gas.isError

  const renderAmount = (amount: string, token: Token) =>
    shouldShowSkeleton ? (
      <Skeleton className="w-12" />
    ) : (
      <div className="text-neutral-950">
        {shouldShowAmount ? (
          <DisplayAmount amount={amount} showTokenLogo={false} token={token} />
        ) : (
          <span>-</span>
        )}
      </div>
    )

  return (
    <div className="flex flex-col gap-y-1 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{gas.label}</span>
        {renderAmount(gas.amount, gas.token)}
      </div>

      {total !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">{t('common.total')}</span>
          {renderAmount(total, operationToken)}
        </div>
      )}
    </div>
  )
}
