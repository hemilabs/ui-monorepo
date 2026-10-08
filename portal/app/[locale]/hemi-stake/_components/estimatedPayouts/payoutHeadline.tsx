import { DisplayAmount } from 'components/displayAmount'
import { RenderFiatBalance } from 'components/fiatBalance'
import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { useHemiToken } from 'hooks/useHemiToken'
import { useLocale, useTranslations } from 'use-intl'
import {
  formatFiatAmount,
  formatNumber,
  formatShortDate,
  formatShortDateWithYear,
} from 'utils/format'
import { formatUnits } from 'viem'

import { formatApyFromRatio } from '../../_utils/formatApyFromRatio'

type Props = {
  carriedFrom: number | undefined
  currentEpoch: number
  input: string
  lockEnd: number
  lockupDays: number
  nextPayout: bigint
  nextPayoutAt: number
  yearOneReturnRatio: number
  yearOneTotal: bigint
}

export const PayoutHeadline = function ({
  carriedFrom,
  currentEpoch,
  input,
  lockEnd,
  lockupDays,
  nextPayout,
  nextPayoutAt,
  yearOneReturnRatio,
  yearOneTotal,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.estimated-payouts')
  const tStake = useTranslations('hemi-stake')
  const token = useHemiToken()

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-xl font-semibold text-neutral-950 sm:text-2xl">
          <DisplayAmount
            amount={formatUnits(yearOneTotal, token.decimals)}
            token={token}
          />
        </span>
        <span className="text-sm text-neutral-500">{t('first-year')}</span>
        <span className="hidden text-sm text-neutral-500 sm:inline">·</span>
        <span className="flex items-center gap-x-1 text-sm font-medium text-neutral-700">
          {t('apy', { percentage: formatApyFromRatio(yearOneReturnRatio) })}
          <Tooltip
            id="estimated-payouts-apy"
            text={
              <div className="flex flex-col gap-y-2">
                <span>{tStake('apy-estimate')}</span>
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
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <div className="rounded-full bg-orange-600 px-2.5 py-1 text-xxs font-medium text-white">
          <RenderFiatBalance
            balance={yearOneTotal}
            customFormatter={formatFiatAmount}
            queryStatus="success"
            token={token}
          />
        </div>
        <span className="text-xs font-medium text-neutral-700">
          {t.rich('next-payout-line', {
            amount: () => (
              <RenderFiatBalance
                balance={nextPayout}
                customFormatter={formatFiatAmount}
                queryStatus="success"
                token={token}
              />
            ),
            date: formatShortDate(new Date(nextPayoutAt * 1000), locale),
            epoch: currentEpoch,
          })}
        </span>
      </div>
      <div className="flex flex-col text-xxs text-neutral-400 sm:flex-row sm:items-baseline sm:gap-x-1">
        <span>
          {t('locked-summary', {
            amount: formatNumber(input),
            days: lockupDays,
            symbol: token.symbol,
          })}
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="whitespace-nowrap font-semibold text-neutral-600">
          {t('unlocks-on', {
            date: formatShortDateWithYear(new Date(lockEnd * 1000), locale),
          })}
        </span>
      </div>
    </div>
  )
}
