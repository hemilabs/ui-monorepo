import { useTranslations } from 'next-intl'
import { getFormattedValue } from 'utils/format'

export const BtcFees = function ({ fees }: { fees: string }) {
  const t = useTranslations('common')
  return (
    <div className="mt-2 flex flex-col gap-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-neutral-400">{t('fees')}</span>
        <span>{`${fees ? getFormattedValue(fees) : '-'} sat/vB`}</span>
      </div>
    </div>
  )
}
