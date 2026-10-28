import { ButtonIcon } from 'components/button'
import { WarningIcon } from 'components/icons/warningIcon'
import { type Ref } from 'react'
import { useTranslations } from 'use-intl'

import { GearIcon } from '../../../../_icons/gearIcon'
import { type SlippageLevel } from '../../../../_utils/slippage'

type Props = {
  disabled?: boolean
  isOpen: boolean
  level: SlippageLevel
  onClick: VoidFunction
  ref?: Ref<HTMLButtonElement>
  slippage: number | undefined
}

const labelStyles: Record<SlippageLevel, string> = {
  high: 'text-amber-500',
  low: 'text-amber-500',
  normal: 'text-neutral-500',
  veryHigh: 'text-rose-500',
}

const labelKeys = {
  high: 'high-slippage-value',
  low: 'low-slippage-value',
  normal: 'slippage-value',
  veryHigh: 'very-high-slippage-value',
} as const satisfies Record<SlippageLevel, string>

const badgeStyles: Record<SlippageLevel, string> = {
  high: 'bg-amber-50 text-amber-500',
  low: 'bg-amber-50 text-amber-500',
  normal: '',
  veryHigh: 'bg-rose-50 text-rose-500',
}

export const SettingsTrigger = function ({
  disabled,
  isOpen,
  level,
  onClick,
  ref,
  slippage,
}: Props) {
  const t = useTranslations('hemi-earn.pool.settings')

  return (
    <div className="flex shrink-0 items-center gap-x-2">
      {slippage !== undefined && (
        <span
          className={`whitespace-nowrap text-xs font-medium ${labelStyles[level]}`}
        >
          {t(labelKeys[level], { value: slippage })}
        </span>
      )}
      <ButtonIcon
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={t('advanced-settings')}
        disabled={disabled}
        onClick={onClick}
        ref={ref}
        size="xxSmall"
        type="button"
        variant="tertiary"
      >
        <GearIcon className="text-neutral-500" />
        {level !== 'normal' && (
          <span
            className={`absolute bottom-0.5 right-0.5 flex size-2 items-center justify-center rounded-full ${badgeStyles[level]}`}
          >
            <WarningIcon className="size-1.5" />
          </span>
        )}
      </ButtonIcon>
    </div>
  )
}
