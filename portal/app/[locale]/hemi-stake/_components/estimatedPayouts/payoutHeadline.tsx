import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { useLocale, useTranslations } from 'use-intl'
import {
  formatNumber,
  formatShortDate,
  formatShortDateWithYear,
} from 'utils/format'

import { formatPayoutValue } from '../../_utils/formatPayoutValue'
import { type PayoutPoint } from '../../_utils/payoutsChartData'

type Props = {
  currentEpoch: number
  input: string
  lockEnd: number
  lockupDays: number
  nextPayout: PayoutPoint
  price: number | undefined
  symbol: string
}

export const PayoutHeadline = function ({
  currentEpoch,
  input,
  lockEnd,
  lockupDays,
  nextPayout,
  price,
  symbol,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.estimated-payouts')

  return (
    <div className="flex flex-col gap-y-1">
      <div className="flex items-baseline gap-x-2">
        <span className="text-2.33xl font-semibold text-neutral-950">
          {formatPayoutValue({
            locale,
            precision: 'full',
            price,
            symbol,
            value: nextPayout.y,
          })}
        </span>
        <span className="text-sm text-neutral-500">{t('next-payout')}</span>
        <Tooltip
          id="estimated-payouts-note"
          text={t('forecast-note')}
          variant="info"
        >
          <div className="group/icon flex items-center">
            <InfoIcon className="[&>g>path]:transition-colors [&>g>path]:duration-200 group-hover/icon:[&>g>path]:fill-neutral-950" />
          </div>
        </Tooltip>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {price !== undefined && (
          <span className="rounded-full bg-orange-600 px-2.5 py-1 text-xxs font-medium text-white">
            {`${formatNumber(nextPayout.y)} ${symbol}`}
          </span>
        )}
        <span className="text-xs font-medium text-neutral-700">
          {t('settles-on', {
            date: formatShortDate(new Date(nextPayout.x), locale, 'UTC'),
            epoch: currentEpoch,
          })}
        </span>
      </div>
      <span className="text-xxs text-neutral-400">
        {t.rich('staked-summary', {
          amount: formatNumber(input),
          date: formatShortDateWithYear(
            new Date(lockEnd * 1000),
            locale,
            'UTC',
          ),
          days: lockupDays,
          symbol,
          unlock: chunks => (
            <span className="font-semibold text-neutral-600">{chunks}</span>
          ),
        })}
      </span>
    </div>
  )
}
