import { WarningIcon } from 'components/icons/warningIcon'
import { useTranslations } from 'next-intl'

import { GearIcon } from '../../../../_icons/gearIcon'
import { type SlippageLevel } from '../../../../_utils/slippage'

type Props = {
  disabled?: boolean
  level: SlippageLevel
  onClick: VoidFunction
  slippage: number | undefined
}

const buttonStyles: Record<SlippageLevel, string> = {
  high: 'text-amber-500 hover:bg-amber-50',
  normal: 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950',
  veryHigh: 'text-rose-500 hover:bg-rose-50',
}

const labelStyles: Record<SlippageLevel, string> = {
  high: 'text-amber-500',
  normal: 'text-neutral-500',
  veryHigh: 'text-rose-500',
}

// Full sentences rather than a composed prefix — word order varies per locale.
// `as const` keeps the literals so they still resolve against the typed messages.
const labelKeys = {
  high: 'high-slippage-value',
  normal: 'slippage-value',
  veryHigh: 'very-high-slippage-value',
} as const satisfies Record<SlippageLevel, string>

const badgeStyles: Record<SlippageLevel, string> = {
  high: 'bg-amber-50',
  normal: '',
  veryHigh: 'bg-rose-50',
}

export const SettingsTrigger = function ({
  disabled,
  level,
  onClick,
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
      <button
        aria-label={t('advanced-settings')}
        className={`flex size-6 items-center justify-center rounded-md transition-colors duration-200 hover:shadow-bs focus-visible:bg-neutral-100 focus-visible:outline-none disabled:opacity-55 disabled:hover:bg-transparent disabled:hover:shadow-none ${buttonStyles[level]}`}
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        <span className="relative flex">
          <GearIcon />
          {level !== 'normal' && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 flex size-2 items-center justify-center rounded-full ${badgeStyles[level]}`}
            >
              <WarningIcon className="size-1.5" />
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
