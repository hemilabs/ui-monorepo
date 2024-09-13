import { useTranslations } from 'next-intl'
import { getFormattedValue } from 'utils/format'

export const BtcFees = function ({ fees }: { fees: string }) {
  const t = useTranslations('common')
  return (
    <div className="text-ms flex flex-col gap-y-1 px-8 py-4 md:px-10">
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{t('fees')}</span>
        <span className="text-neutral-950">{`${
          fees ? getFormattedValue(fees) : '-'
        } sat/vB`}</span>
      </div>
    </div>
  )
}
