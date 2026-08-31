import { WarningIcon } from 'components/icons/warningIcon'
import { Toggle } from 'components/toggle'
import { type KeyboardEvent } from 'react'
import { useTranslations } from 'use-intl'

import { type SlippageLevel } from '../../../../_utils/slippage'
import { type PoolOperation } from '../../_types/operations'

type Props = {
  approveExtraAmount: boolean
  defaultSlippage: number
  draft: string
  level: SlippageLevel
  multiplier: number
  onApproveExtraAmountChange: (checked: boolean) => void
  onAutoClick: VoidFunction
  onDraftChange: (value: string) => void
  onEnter: VoidFunction
  operation: PoolOperation
}

const levelStyles: Record<SlippageLevel, string> = {
  high: 'text-amber-500',
  low: 'text-amber-500',
  normal: 'text-neutral-900',
  veryHigh: 'text-rose-500',
}

const warningKeys = {
  high: 'high-slippage',
  low: 'low-slippage',
  normal: '',
  veryHigh: 'very-high-slippage',
} as const satisfies Record<SlippageLevel, string>

const slippageInputId = 'earn-max-slippage'

export const SettingsPanel = function ({
  approveExtraAmount,
  defaultSlippage,
  draft,
  level,
  multiplier,
  onApproveExtraAmountChange,
  onAutoClick,
  onDraftChange,
  onEnter,
  operation,
}: Props) {
  const t = useTranslations('hemi-earn.pool.settings')

  const handleKeyDown = function (event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      // Without this the keypress submits the surrounding pool form.
      event.preventDefault()
      onEnter()
    }
  }

  const isAuto = draft === ''
  const valueStyle = isAuto ? 'text-neutral-500' : levelStyles[level]
  // Doubles as the toggle's accessible name, since the text sits outside it.
  const approvalLabel = t(
    operation === 'deposit'
      ? 'approve-extra-deposit'
      : 'approve-extra-withdrawal',
    { multiplier },
  )

  return (
    <div className="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-y-1 rounded-lg bg-white p-1 shadow-xl">
      <div className="body-text-medium px-3 py-1.5 text-neutral-500">
        {t('advanced-settings')}
      </div>
      <div className="flex items-center justify-between gap-x-2 px-3 py-1">
        <label
          className="body-text-medium text-neutral-900"
          htmlFor={slippageInputId}
        >
          {t('max-slippage')}
        </label>
        <div className="flex h-7 w-22 shrink-0 items-center justify-between rounded-md bg-white px-2 text-xs font-semibold shadow-sm">
          <button
            className={`transition-colors ${
              isAuto
                ? 'text-orange-600'
                : 'text-neutral-500 hover:text-neutral-950'
            }`}
            onClick={onAutoClick}
            type="button"
          >
            {t('auto')}
          </button>
          <div className="flex min-w-0 items-center">
            <input
              className={`w-8 bg-transparent text-right outline-none placeholder:text-neutral-500 ${valueStyle}`}
              id={slippageInputId}
              inputMode="decimal"
              onChange={e => onDraftChange(e.target.value)}
              onKeyDown={handleKeyDown}
              // Auto renders as a placeholder so the first keystroke replaces it
              // instead of appending to it.
              placeholder={String(defaultSlippage)}
              value={draft}
            />
            <span className={valueStyle}>%</span>
          </div>
        </div>
      </div>
      {level !== 'normal' && (
        <div
          className={`flex items-center gap-x-1 px-3 py-1 ${levelStyles[level]}`}
        >
          <WarningIcon />
          <span className="body-text-medium">{t(warningKeys[level])}</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-x-2 px-3 py-1">
        <span className="body-text-medium text-neutral-900">
          {approvalLabel}
        </span>
        <Toggle
          ariaLabel={approvalLabel}
          checked={approveExtraAmount}
          id="earn-extra-approval-toggle"
          onCheckedChange={onApproveExtraAmountChange}
        />
      </div>
    </div>
  )
}
