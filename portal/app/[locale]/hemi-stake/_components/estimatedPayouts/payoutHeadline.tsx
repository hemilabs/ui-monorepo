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
  carriedFrom: number | undefined
  currentEpoch: number
  input: string
  lockEnd: number
  lockupDays: number
  nextPayout: PayoutPoint
  price: number | undefined
  symbol: string
}

export const PayoutHeadline = function ({
  carriedFrom,
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
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-xl font-semibold text-neutral-950 sm:text-2xl">
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
          text={
            <div className="flex flex-col gap-y-2">
              <span>{t('forecast-note')}</span>
              {carriedFrom !== undefined && (
                <span>{t('carried-from', { epoch: carriedFrom })}</span>
              )}
            </div>
          }
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
      <div className="flex flex-col text-xxs text-neutral-400 sm:flex-row sm:gap-x-1">
        <span>
          {t('locked-summary', {
            amount: formatNumber(input),
            days: lockupDays,
            symbol,
          })}
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="whitespace-nowrap font-semibold text-neutral-600">
          {t('unlocks-on', {
            date: formatShortDateWithYear(
              new Date(lockEnd * 1000),
              locale,
              'UTC',
            ),
          })}
        </span>
      </div>
    </div>
  )
}
