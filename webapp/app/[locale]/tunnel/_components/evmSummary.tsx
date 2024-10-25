import { useTranslations } from 'next-intl'
import { getFormattedValue } from 'utils/format'

export const EvmSummary = function ({
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
  total: string
}) {
  const t = useTranslations()
  return (
    <div className="flex flex-col gap-y-1 px-8 py-4 text-sm md:px-10">
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{gas.label}</span>
        <span className="text-neutral-950">{`${getFormattedValue(gas.amount)} ${
          gas.symbol
        }`}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{t('common.total')}</span>
        <span className="text-neutral-950">{`${getFormattedValue(
          total,
        )} ${operationSymbol}`}</span>
      </div>
    </div>
  )
}
