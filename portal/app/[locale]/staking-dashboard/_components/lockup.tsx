import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { sanitizeLockup } from 'utils/form'
import { formatDate } from 'utils/format'

import { useStakingDashboardState } from '../_hooks/useStakingDashboardState'
import { WarningIcon } from '../_icons/warningIcon'

import { RangeSlider } from './rangeSlider'

type NearestValidValues = {
  minValue: number | null
  maxValue: number | null
} | null

type TryValuesHintProps = NearestValidValues & {
  isValid: boolean
}

type Props = {
  stakingDashboardState: ReturnType<typeof useStakingDashboardState>
}

const minDays = 6
const maxDays = 1460 // 4 years
const step = 6 // 6-day increments

const isMultipleOfStep = (n: number) => n % step === 0

const isWithinRange = (n: number) => n >= minDays && n <= maxDays

const isValidLockup = (n: number) =>
  !Number.isNaN(n) && isWithinRange(n) && isMultipleOfStep(n)

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getNearestValidValues(n: number): NearestValidValues {
  if (Number.isNaN(n)) return null

  const lower = Math.floor(n / step) * step
  const upper = lower + step
  const minValue = lower >= minDays ? lower : null
  const maxValue = upper <= maxDays ? upper : null

  if (minValue === null && maxValue === null) {
    return null
  }

  return {
    maxValue,
    minValue,
  }
}

function TryValuesHint({ isValid, maxValue, minValue }: TryValuesHintProps) {
  const t = useTranslations('staking-dashboard.form')
  if (isValid) {
    return null
  }

  return (
    <span className="text-xs font-medium text-neutral-500">
      {maxValue && minValue
        ? t('try-values', { max: maxValue, min: minValue })
        : minValue ?? maxValue}
    </span>
  )
}

export function Lockup({ stakingDashboardState }: Props) {
  const { estimatedApy, lockup, updateLockup } = stakingDashboardState
  const t = useTranslations('staking-dashboard')
  const locale = useLocale()

  const [inputValue, setInputValue] = useState(lockup.days.toString())
  const [touched, setTouched] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const inputNumber = Number(inputValue)
  const valid = isValidLockup(inputNumber)
  const nearest = getNearestValidValues(inputNumber)
  const expireDate = formatDate(addDays(new Date(), lockup.days), locale)

  function handleSliderChange(val: number) {
    updateLockup({ days: val, valid: true })
    setInputValue(String(val))
    setTouched(false)
  }

  function handleInputChange(val: string) {
    const { value } = sanitizeLockup({ input: val, value: inputValue })
    setInputValue(value)
    setTouched(true)
    const num = Number(value)
    const isValid = isValidLockup(num)
    if (isValid) {
      updateLockup({ days: num, valid: isValid })
    } else {
      updateLockup({ valid: isValid })
    }
  }

  const displayValue = isFocused
    ? inputValue
    : t('form.days', { days: inputValue })

  useEffect(
    function handleInputFocusReset() {
      if (!inputValue && !isFocused) {
        setInputValue(minDays.toString())
        updateLockup({ days: minDays, valid: true })
      }
    },
    [inputValue, isFocused, updateLockup],
  )

  return (
    <>
      <div className="w-full rounded-lg bg-neutral-50 p-4 ring-1 ring-transparent hover:ring-neutral-300/55">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-500">
            {t('lockup-period')}
          </span>
          <div className="flex items-center justify-center gap-x-3">
            <TryValuesHint
              isValid={valid}
              maxValue={nearest.maxValue}
              minValue={nearest.minValue}
            />
            <input
              className={`w-24 rounded-md border px-2.5 py-1.5 text-center text-sm font-medium text-neutral-950 focus:outline-none focus:ring-0 ${
                touched && !valid
                  ? 'shadow-lockup-input-error'
                  : 'shadow-lockup-input-default'
              }`}
              onBlur={() => setIsFocused(false)}
              onChange={e => handleInputChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              type="text"
              value={displayValue}
            />
          </div>
        </div>
        <div className="mt-2">
          <RangeSlider
            max={maxDays}
            min={minDays}
            onChange={handleSliderChange}
            step={step}
            value={lockup.days}
          />
          <p className="mt-2 flex items-center justify-between text-xs font-medium text-neutral-500">
            <span>{t('form.days', { days: 6 })}</span>
            <span>{t('form.years', { years: 2 })}</span>
            <span>{t('form.years', { years: 4 })}</span>
          </p>
          <div className="mt-4 h-px w-full bg-neutral-300/55" />
        </div>

        <div className="mt-2.5 flex flex-col justify-between gap-y-2 md:flex-row md:items-center md:gap-y-0">
          <p className="text-sm font-medium text-neutral-600">
            {t('form.expire-date')}
            <span className="ml-1 text-neutral-950">{expireDate}</span>
          </p>
          <p className="text-sm font-medium text-neutral-600">
            {t('form.estimated-apy')}
            <span className="ml-1 text-emerald-600">{estimatedApy}%</span>
          </p>
        </div>
      </div>
      <div
        className={`mt-3 flex items-center justify-center gap-x-1 text-center text-sm font-medium ${
          touched && !valid ? 'text-rose-500' : 'text-neutral-900'
        }`}
      >
        <WarningIcon />
        <span>{t('form.lockup-increment-warning')}</span>
      </div>
    </>
  )
}
