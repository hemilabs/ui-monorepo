import { WarningIcon } from 'components/icons/warningIcon'
import { Toggle } from 'components/toggle'
import { useTranslations } from 'next-intl'
import { type KeyboardEvent } from 'react'

import { type SlippageLevel } from '../../../../_utils/slippage'
import { type PoolOperation } from '../../_types/operations'

type Props = {
  approveExtraAmount: boolean
  defaultSlippage: number
  disabled: boolean
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
  normal: 'text-neutral-900',
  veryHigh: 'text-rose-500',
}

const slippageInputId = 'earn-max-slippage'

export const SettingsPanel = function ({
  approveExtraAmount,
  defaultSlippage,
  disabled,
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

  return (
    <div className="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-y-1 rounded-lg bg-white p-1 shadow-xl">
      <div className="px-3 py-1.5 text-sm font-medium text-neutral-500">
        {t('advanced-settings')}
      </div>
      <div className="flex items-center justify-between gap-x-2 px-3 py-1">
        <label
          className="text-sm font-medium text-neutral-900"
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
            } disabled:opacity-55`}
            disabled={disabled}
            onClick={onAutoClick}
            type="button"
          >
            {t('auto')}
          </button>
          <div className="flex min-w-0 items-center">
            <input
              className={`w-8 bg-transparent text-right outline-none placeholder:text-neutral-500 ${valueStyle}`}
              disabled={disabled}
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
          <span className="text-sm font-medium">
            {t(level === 'veryHigh' ? 'very-high-slippage' : 'high-slippage')}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between gap-x-2 rounded px-3 py-1 transition-colors hover:bg-neutral-50">
        <span
          className={`text-sm font-medium text-neutral-900 ${
            disabled ? 'opacity-55' : ''
          }`}
        >
          {t(
            operation === 'deposit'
              ? 'approve-extra-deposit'
              : 'approve-extra-withdrawal',
            { multiplier },
          )}
        </span>
        <Toggle
          checked={approveExtraAmount}
          disabled={disabled}
          id="earn-extra-approval-toggle"
          onCheckedChange={onApproveExtraAmountChange}
        />
      </div>
    </div>
  )
}
