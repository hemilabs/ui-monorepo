import { DisplayAmount } from 'components/displayAmount'
import { LockupInput } from 'components/inputText'
import { useHemiToken } from 'hooks/useHemiToken'
import { useLocale, useTranslations } from 'next-intl'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { EvmToken } from 'types/token'
import { formatDate } from 'utils/format'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'

import {
  calculateVotingPower,
  daySeconds,
  maxDays,
  minDays,
  step,
  twoYears,
} from '../../_utils/lockCreationTimes'
import { sanitizeLockup } from '../../_utils/sanitizeLockup'

import { RangeSlider } from './rangeSlider'
import { WarningMessage } from './warningMessage'

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

type ValidLockupProps = {
  minLocked?: number
  value: number
}

export const isValidLockup = ({
  minLocked = minDays,
  value,
}: ValidLockupProps) =>
  !Number.isNaN(value) &&
  value >= minLocked &&
  value <= maxDays &&
  (value % step === 0 || value === maxDays)

type NearestValidValues = {
  minValue: number | null | undefined
  maxValue: number | null | undefined
} | null

type TryValuesHintProps = NearestValidValues & {
  inputText: string
  isValid: boolean
}

type NearestValidValuesProps = {
  minLocked?: number
  value: number
}

export function getNearestValidValues({
  minLocked,
  value,
}: NearestValidValuesProps): NearestValidValues {
  if (Number.isNaN(value)) {
    return null
  }

  if (value >= maxDays) return { maxValue: maxDays, minValue: null }
  if (value <= minDays) return { maxValue: null, minValue: minDays }

  // Calculate based on minDays
  const base = Math.floor((value - minDays) / step) * step + minDays
  const lower = base
  const upper = Math.min(base + step, maxDays)

  // Filter out values below minLocked
  const validLower = minLocked && lower < minLocked ? null : lower
  const validUpper = minLocked && upper < minLocked ? null : upper

  // If value is below minLocked, only suggest minLocked or higher
  if (minLocked && value < minLocked) {
    return { maxValue: null, minValue: minLocked }
  }

  return {
    maxValue: validUpper,
    minValue: validLower,
  }
}

const Divider = () => <div className="h-px w-full bg-neutral-300/55" />

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <p className="flex justify-between text-sm font-medium text-neutral-600">
    <span>{label}</span>
    <span className="text-neutral-950">{value}</span>
  </p>
)

const VotingPowerEquivalence = ({
  amount,
  token,
  votingPower,
}: {
  amount: string
  token: EvmToken
  votingPower: string
}) => (
  <div className="flex items-center gap-x-1">
    <DisplayAmount amount={amount} showSymbol={true} token={token} />
    <span className="text-neutral-600">=</span>
    <DisplayAmount amount={votingPower} showSymbol={true} token={token} />
    <span className="text-neutral-600">ve{token.symbol}</span>
  </div>
)

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
  const t = useTranslations('staking-dashboard.form')
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
  input: string
  inputDays: string
  lockupDays: number
  minLocked?: number
  updateInputDays: (days: string) => void
  updateLockupDays: (days: number) => void
}

export function Lockup({
  input,
  inputDays,
  lockupDays,
  minLocked,
  updateInputDays,
  updateLockupDays,
}: Props) {
  const t = useTranslations('staking-dashboard')
  const locale = useLocale()
  const token = useHemiToken()

  const amount = parseTokenUnits(input, token)

  const [touched, setTouched] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const inputNumber = Number(inputDays)
  const valid = isValidLockup({ minLocked, value: inputNumber })
  const nearest = getNearestValidValues({ minLocked, value: inputNumber })
  const expireDate = formatDate(addDays(new Date(), lockupDays), locale)

  const votingPowerRatio = useMemo(
    function calcVotingPower() {
      if (!amount || amount === BigInt(0)) {
        return '0'
      }

      const now = BigInt(Math.floor(Date.now() / 1000))
      const lockTime = BigInt(lockupDays * daySeconds)

      const { votingPower } = calculateVotingPower({
        amount,
        lockTime,
        timestamp: now,
      })

      const formattedPower = formatUnits(votingPower, token.decimals)
      return formattedPower.toString()
    },
    [amount, lockupDays, token.decimals],
  )

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
    // Prevent clicking on steps below minLocked
    if (minLocked && days < minLocked) {
      return
    }
    handleInputChange(days.toString())
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
      <div className="hover:shadow-bs w-full space-y-4 rounded-lg border border-solid border-transparent bg-neutral-50 p-4 ring-1 ring-transparent">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-500">
            {t('lockup-period')}
          </span>
          <div className="flex items-center justify-center gap-x-3">
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
          </div>
        </div>
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
        <Divider />
        <InfoRow label={t('form.expire-date')} value={expireDate} />
        <Divider />
        <InfoRow
          label={`${t('voting-power')}:`}
          value={
            <VotingPowerEquivalence
              amount={input}
              token={token}
              votingPower={votingPowerRatio}
            />
          }
        />
      </div>
      <div className="mt-5 space-y-2">
        <WarningMessage isError={touched && !valid}>
          {t('form.lockup-increment-warning')}
        </WarningMessage>
        {minLocked && (
          <WarningMessage>{t('form.lockup-extend-warning')}</WarningMessage>
        )}
      </div>
    </>
  )
}
