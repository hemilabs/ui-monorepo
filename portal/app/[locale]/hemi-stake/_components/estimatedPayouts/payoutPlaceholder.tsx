import { Button } from 'components/button'
import { useHemiToken } from 'hooks/useHemiToken'
import Skeleton from 'react-loading-skeleton'
import { useLocale, useTranslations } from 'use-intl'
import { formatNumber, formatShortDateWithYear } from 'utils/format'
import { minLockAmount } from 've-hemi-actions'
import { formatUnits } from 'viem'

type Props = {
  hasError: boolean
  hasPot: boolean
  isPending: boolean
  lockEnd: number
  onRetry: VoidFunction
}

export const PayoutPlaceholder = function ({
  hasError,
  hasPot,
  isPending,
  lockEnd,
  onRetry,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('hemi-stake.estimated-payouts')
  const tCommon = useTranslations('common')
  const token = useHemiToken()

  const renderMessage = function () {
    if (hasError) {
      return (
        <div className="flex flex-col items-start gap-y-2">
          <span className="text-xs text-neutral-400">{t('load-failed')}</span>
          <Button
            onClick={onRetry}
            size="xSmall"
            type="button"
            variant="secondary"
          >
            {tCommon('try-again')}
          </Button>
        </div>
      )
    }
    if (isPending) {
      return <Skeleton className="h-6 w-40" />
    }
    return (
      <span className="text-xs text-neutral-400">
        {hasPot
          ? t('enter-minimum-amount', {
              amount: formatNumber(formatUnits(minLockAmount, token.decimals)),
              symbol: token.symbol,
            })
          : t('not-funded')}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-y-2">
      {renderMessage()}
      <span className="text-xxs text-neutral-400">
        {t('unlocks-on', {
          date: formatShortDateWithYear(
            new Date(lockEnd * 1000),
            locale,
            'UTC',
          ),
        })}
      </span>
    </div>
  )
}
