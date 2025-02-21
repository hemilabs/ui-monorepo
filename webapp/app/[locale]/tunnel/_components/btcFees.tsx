import { DisplayAmount } from 'components/displayAmount'
import { useTranslations } from 'next-intl'

export const BtcFees = function ({ fees }: { fees: string }) {
  const t = useTranslations('common')
  return (
    <div className="flex flex-col gap-y-1 px-8 py-4 text-sm md:px-10">
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{t('fees')}</span>
        <div className="text-neutral-950">
          <DisplayAmount amount={fees} symbol={'sat/vB'} />
        </div>
      </div>
    </div>
  )
}
