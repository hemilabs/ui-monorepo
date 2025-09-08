import { WarningIcon } from 'components/icons/warningIcon'
import { LockupInput } from 'components/inputText'
import { useLocale, useTranslations } from 'next-intl'
import { ReactNode, useState } from 'react'
import { formatDate } from 'utils/format'

import { useStakingDashboard } from '../_context/stakingDashboardContext'
import { maxDays, minDays, step, twoYears } from '../_utils/lockCreationTimes'
import { sanitizeLockup } from '../_utils/sanitizeLockup'

import { RangeSlider } from './rangeSlider'

type NearestValidValues = {
  minValue: number | null | undefined
  maxValue: number | null | undefined
} | null

type TryValuesHintProps = NearestValidValues & {
  inputText: string
  isValid: boolean
}

export const isValidLockup = (n: number) =>
  !Number.isNaN(n) &&
  n >= minDays &&
  n <= maxDays &&
  (n % step === 0 || n === maxDays)

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getNearestValidValues(n: number): NearestValidValues {
  if (Number.isNaN(n)) return null

  if (n <= minDays) return { maxValue: null, minValue: minDays }
  if (n >= maxDays) return { maxValue: maxDays, minValue: null }

  const base = Math.floor((n - minDays) / step) * step + minDays
  const lower = base
  const upper = Math.min(base + step, maxDays)

  return {
    maxValue: upper <= maxDays ? upper : null,
    minValue: lower >= minDays ? lower : null,
  }
}

function TryValuesHint({
  inputText,
  isValid,
  maxValue,
  minValue,
  onSelectValue,
}: TryValuesHintProps & { onSelectValue: (value: number) => void }) {
  const t = useTranslations('staking-dashboard.form')
  if (isValid || !inputText) return null

  const renderValue = (value: number, label?: ReactNode) => (
    <button
      className="transition-colors duration-150 hover:text-neutral-950"
      onClick={() => onSelectValue(value)}
      type="button"
    >
      {label ?? value}
    </button>
  )

  const getText = function () {
    if (maxValue && minValue) {
      return t.rich('use-or', {
        max: () => renderValue(maxValue),
        min: () => renderValue(minValue),
      })
    }
    if (minValue) {
      return renderValue(minValue, t('min-days', { days: minValue }))
    }
    if (maxValue) {
      return renderValue(maxValue, t('max-days', { days: maxValue }))
    }
    return undefined
  }

  return (
    <span className="text-xs font-medium text-neutral-500">{getText()}</span>
  )
}

export function Lockup() {
  const { inputDays, lockupDays, updateInputDays, updateLockupDays } =
    useStakingDashboard()
  const t = useTranslations('staking-dashboard')
  const locale = useLocale()

  const [touched, setTouched] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const inputNumber = Number(inputDays)
  const valid = isValidLockup(inputNumber)
  const nearest = getNearestValidValues(inputNumber)
  const expireDate = formatDate(addDays(new Date(), lockupDays), locale)

  function handleSliderChange(val: number) {
    updateLockupDays(val)
    updateInputDays(String(val))
    setTouched(false)
  }

  function handleInputChange(val: string) {
    const { value } = sanitizeLockup({ input: val, value: inputDays })
    updateInputDays(value)
    setTouched(true)
    updateLockupDays(Number(value))
  }

  const displayValue =
    isFocused || !inputDays ? inputDays : t('form.days', { days: inputDays })

  return (
    <>
      <div className="w-full rounded-lg bg-neutral-50 p-4 ring-1 ring-transparent hover:ring-neutral-300/55">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-500">
            {t('lockup-period')}
          </span>
          <div className="flex items-center justify-center gap-x-3">
            <TryValuesHint
              inputText={inputDays}
              isValid={valid}
              maxValue={nearest?.maxValue}
              minValue={nearest?.minValue}
              onSelectValue={value => handleInputChange(value.toString())}
            />
            <div className="w-26">
              <LockupInput
                autoFocus={false}
                isError={touched && !valid}
                onBlur={() => setIsFocused(false)}
                onChange={e => handleInputChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                value={displayValue}
              />
            </div>
          </div>
        </div>
        <div className="mt-2">
          <RangeSlider
            max={maxDays}
            min={minDays}
            onChange={handleSliderChange}
            step={step}
            value={lockupDays}
          />
          <p className="mt-2 flex items-center justify-between text-xs font-medium text-neutral-500">
            <span
              className="cursor-pointer hover:text-neutral-950"
              onClick={() => handleInputChange(minDays.toString())}
            >
              {t('form.days', { days: minDays })}
            </span>
            <span
              className="cursor-pointer hover:text-neutral-950"
              onClick={() => handleInputChange(twoYears.toString())}
            >
              {t('form.years', { years: 2 })}
            </span>
            <span
              className="cursor-pointer hover:text-neutral-950"
              onClick={() => handleInputChange(maxDays.toString())}
            >
              {t('form.years', { years: 4 })}
            </span>
          </p>
          <div className="mt-4 h-px w-full bg-neutral-300/55" />
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium text-neutral-600">
            {t('form.expire-date')}
            <span className="ml-1 text-neutral-950">{expireDate}</span>
          </p>
        </div>
      </div>
      <div
        className={`mt-3 flex items-start justify-center gap-x-1 text-center text-sm font-medium ${
          touched && !valid ? 'text-rose-500' : 'text-neutral-900'
        }`}
      >
        <span className="mt-0.5 shrink-0 leading-none">
          <WarningIcon />
        </span>
        <span>{t('form.lockup-increment-warning')}</span>
      </div>
    </>
  )
}
