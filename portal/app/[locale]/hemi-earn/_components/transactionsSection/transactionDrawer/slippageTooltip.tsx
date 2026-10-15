import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'use-intl'

import {
  getSlippageLevel,
  resolveRetrySlippage,
  type SlippageLevel,
} from '../../../_utils/slippage'
import { canRetryRow } from '../../../_utils/transactionPredicates'
import { type EarnTransaction } from '../../../types'

type Props = {
  fallback: number
  transaction: EarnTransaction
}

const iconStyles: Record<SlippageLevel, string> = {
  high: '[&>g>path]:fill-amber-500',
  low: '[&>g>path]:fill-amber-500',
  normal: '[&>g>path]:fill-neutral-500',
  veryHigh: '[&>g>path]:fill-rose-500',
}

export const RetrySlippageTooltip = function ({
  fallback,
  transaction,
}: Props) {
  const t = useTranslations('hemi-earn.pool.settings')

  if (!canRetryRow(transaction)) {
    return null
  }

  const slippage = resolveRetrySlippage({
    fallback,
    slippage: transaction.slippage,
  })
  const text = t('slippage-value', { value: slippage })
  const level = getSlippageLevel(slippage)

  return (
    <Tooltip text={text} variant="simple">
      <button
        aria-label={text}
        className="flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
        type="button"
      >
        <InfoIcon aria-hidden className={iconStyles[level]} />
      </button>
    </Tooltip>
  )
}
