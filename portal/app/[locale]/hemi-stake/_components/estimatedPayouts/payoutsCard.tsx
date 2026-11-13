import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useTranslations } from 'use-intl'

const sectionLabelClassName =
  'text-xxs font-medium uppercase tracking-widest text-neutral-500'

export const PayoutsCard = function ({
  action,
  chart,
  currentEpoch,
  footer,
  headline,
}: {
  action?: ReactNode
  chart: ReactNode
  currentEpoch: number | undefined
  footer?: ReactNode
  headline: ReactNode
}) {
  const t = useTranslations('hemi-stake.estimated-payouts')

  return (
    <div className="flex w-full flex-col gap-y-4 rounded-lg border border-solid border-transparent bg-neutral-50 p-4 ring-1 ring-transparent hover:shadow-bs">
      <div className="flex items-center justify-between gap-x-2">
        <span className={sectionLabelClassName}>{t('title')}</span>
        {action}
      </div>
      <div className="min-h-24.5">{headline}</div>
      <div className="flex w-full flex-col gap-y-1.5">
        <span className={sectionLabelClassName}>
          {t.rich('starting-from-epoch', {
            epoch: () =>
              currentEpoch === undefined ? (
                <Skeleton className="w-8" />
              ) : (
                currentEpoch
              ),
          })}
        </span>
        {chart}
        {footer}
      </div>
    </div>
  )
}
