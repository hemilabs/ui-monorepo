import { Button } from 'components/button'
import { useFormat } from 'hooks/useFormat'
import { useHemiToken } from 'hooks/useHemiToken'
import Skeleton from 'react-loading-skeleton'
import { useTranslations } from 'use-intl'
import { minLockAmount } from 've-hemi-actions'
import { formatUnits } from 'viem'

type Props = {
  autoRelock: boolean
  hasError: boolean
  hasValidLockup: boolean
  isPending: boolean
  lockEnd: number
  meetsMinimumAmount: boolean
  onRetry: VoidFunction
}

export const PayoutPlaceholder = function ({
  autoRelock,
  hasError,
  hasValidLockup,
  isPending,
  lockEnd,
  meetsMinimumAmount,
  onRetry,
}: Props) {
  const { formatNumber, formatShortDateWithYear } = useFormat()
  const t = useTranslations('hemi-stake.estimated-payouts')
  const tCommon = useTranslations('common')
  const token = useHemiToken()

  const renderMessage = function () {
    if (!meetsMinimumAmount) {
      return (
        <span className="text-xs text-neutral-400">
          {t('enter-minimum-amount', {
            amount: formatNumber(formatUnits(minLockAmount, token.decimals)),
            symbol: token.symbol,
          })}
        </span>
      )
    }
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
    if (!hasValidLockup) {
      return null
    }
    if (isPending) {
      return <Skeleton className="h-6 w-40" />
    }
    return <span className="text-xs text-neutral-400">{t('not-funded')}</span>
  }

  return (
    <div className="flex flex-col gap-y-2">
      {renderMessage()}
      {hasValidLockup && (
        <span className="text-xxs text-neutral-400">
          {autoRelock
            ? t('countdown-paused')
            : t('unlocks-on', {
                date: formatShortDateWithYear(new Date(lockEnd * 1000)),
              })}
        </span>
      )}
    </div>
  )
}
