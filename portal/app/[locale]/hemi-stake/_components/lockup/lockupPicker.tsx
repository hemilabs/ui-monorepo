import { LockupInput } from 'components/inputText'
import { ReactNode, useEffect, useId, useState } from 'react'
import { useTranslations } from 'use-intl'

import { useLockupApySublabels } from '../../_hooks/useLockupApySublabels'
import {
  getNearestPreset,
  maxDays,
  minDays,
  oneYear,
  sixMonths,
  step,
  twoYears,
} from '../../_utils/lockCreationTimes'
import { isValidLockup } from '../../_utils/lockupError'
import {
  getNearestValidValues,
  type NearestValidValues,
} from '../../_utils/nearestValidValues'
import { sanitizeLockup } from '../../_utils/sanitizeLockup'

import { LockupPresets } from './lockupPresets'
import { RangeSlider } from './rangeSlider'

type TryValuesHintProps = NearestValidValues & {
  inputText: string
  isValid: boolean
}

type TryValuesHintFullProps = TryValuesHintProps & {
  minLocked?: number
  onSelectValue: (value: number) => void
  touched?: boolean
}

function TryValuesHint({
  inputText,
  isValid,
  maxValue,
  minLocked,
  minValue,
  onSelectValue,
  touched,
}: TryValuesHintFullProps) {
  const t = useTranslations('hemi-stake.form')
  if (
    isValid ||
    !inputText ||
    (!touched && minLocked && Number(inputText) < minLocked)
  ) {
    return null
  }

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

type Props = {
  amount: bigint
  headerAction?: ReactNode
  inputDays: string
  lockupDays: number
  minLocked?: number
  updateInputDays: (days: string) => void
  updateLockupDays: (days: number) => void
}

export function LockupPicker({
  amount,
  headerAction,
  inputDays,
  lockupDays,
  minLocked,
  updateInputDays,
  updateLockupDays,
}: Props) {
  const t = useTranslations('hemi-stake')

  const sublabels = useLockupApySublabels(amount)

  const presets = [
    { days: sixMonths, label: t('form.months', { months: 6 }) },
    { days: oneYear, label: t('form.years', { years: 1 }) },
    { days: twoYears, label: t('form.years', { years: 2 }) },
    { days: maxDays, label: t('form.years', { years: 4 }) },
  ].map(preset => ({ ...preset, sublabel: sublabels[preset.days] }))

  const presetDays = presets.map(preset => preset.days)

  const canUsePresets = minLocked === undefined

  const isSelectablePreset = (days: number) => presetDays.includes(days)

  const [touched, setTouched] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showSlider, setShowSlider] = useState(
    () => !isSelectablePreset(lockupDays),
  )
  const showPresets = canUsePresets && !showSlider
  const labelId = useId()

  const inputNumber = Number(inputDays)
  const valid = isValidLockup({ minLocked, value: inputNumber })
  const nearest = getNearestValidValues({ minLocked, value: inputNumber })

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

  function handleStepClick(days: number) {
    if (minLocked && days < minLocked) {
      return
    }
    handleSliderChange(days)
  }

  function handleCustomClick() {
    if (showSlider && !isSelectablePreset(lockupDays)) {
      handleStepClick(
        getNearestPreset({ days: lockupDays, presets: presetDays }),
      )
    }
    setShowSlider(!showSlider)
  }

  function getDisplayValue() {
    if (isFocused) {
      return inputDays
    }

    let days = inputDays

    if (minLocked && (!inputDays || Number(inputDays) < minLocked)) {
      days = String(minLocked)
    }

    return days ? t('form.days', { days }) : days
  }

  const displayValue = getDisplayValue()

  useEffect(
    function updateInputDaysByMinLocked() {
      if (minLocked && Number(inputDays) < minLocked && !touched) {
        updateInputDays(String(minLocked))
        updateLockupDays(minLocked)
      }
    },
    [inputDays, minLocked, touched, updateInputDays, updateLockupDays],
  )

  return (
    <>
      <div className="flex h-7 items-center justify-between">
        <div className="flex items-center gap-x-1">
          <span className="text-sm font-medium text-neutral-500" id={labelId}>
            {t('lockup-period')}
          </span>
          {showPresets && headerAction}
        </div>
        <div className="flex items-center justify-center gap-x-3">
          {showSlider && (
            <>
              <TryValuesHint
                inputText={inputDays}
                isValid={valid}
                maxValue={nearest?.maxValue}
                minLocked={minLocked}
                minValue={nearest?.minValue}
                onSelectValue={value => handleInputChange(value.toString())}
                touched={touched}
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
            </>
          )}
          {canUsePresets && (
            <button
              aria-pressed={showSlider}
              className={`text-sm font-medium transition-colors ${
                showSlider
                  ? 'text-orange-600'
                  : 'text-neutral-500 hover:text-neutral-950'
              }`}
              onClick={handleCustomClick}
              type="button"
            >
              {t('form.custom')}
            </button>
          )}
        </div>
      </div>
      <div className="flex min-h-26 flex-col justify-center xs:min-h-14">
        {!showPresets ? (
          <div className="flex flex-col gap-y-4">
            <RangeSlider
              max={maxDays}
              min={minDays}
              minLocked={minLocked}
              onChange={handleSliderChange}
              step={step}
              value={lockupDays}
            />
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
              {[
                { days: minDays, label: t('form.days', { days: minDays }) },
                { days: twoYears, label: t('form.years', { years: 2 }) },
                { days: maxDays, label: t('form.years', { years: 4 }) },
              ].map(function ({ days, label }) {
                const isDisabled = minLocked && days < minLocked

                return (
                  <span
                    className={`${
                      isDisabled
                        ? 'cursor-default text-neutral-400'
                        : 'cursor-pointer hover:text-neutral-950'
                    }`}
                    key={days}
                    onClick={() => handleStepClick(days)}
                  >
                    {label}
                  </span>
                )
              })}
            </div>
          </div>
        ) : (
          <LockupPresets
            labelledBy={labelId}
            onSelect={handleStepClick}
            options={presets}
            value={lockupDays}
          />
        )}
      </div>
    </>
  )
}
