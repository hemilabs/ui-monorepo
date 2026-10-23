import { DisplayAmount } from 'components/displayAmount'
import { InfoIcon } from 'components/icons/infoIcon'
import { LockupInput } from 'components/inputText'
import { Toggle } from 'components/toggle'
import { Tooltip } from 'components/tooltip'
import { useHemiToken } from 'hooks/useHemiToken'
import { useVeHemiToken } from 'hooks/useVeHemiToken'
import { ReactNode, useEffect, useId, useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import type { Token } from 'types/token'
import { useLocale, useTranslations } from 'use-intl'
import { formatDate, formatShortDateWithYear } from 'utils/format'
import { unixNowTimestamp } from 'utils/time'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'

import { useLockupApySublabels } from '../../_hooks/useLockupApySublabels'
import {
  getNearestPreset,
  getUnlockInfo,
  maxDays,
  minDays,
  oneYear,
  predictVotingPower,
  sixMonths,
  step,
  twoYears,
  wholeDaysToSeconds,
} from '../../_utils/lockCreationTimes'
import { getLockEnd } from '../../_utils/lockEpochs'
import { getLockupErrorMessage } from '../../_utils/lockupError'
import {
  getNearestValidValues,
  type NearestValidValues,
} from '../../_utils/nearestValidValues'
import { sanitizeLockup } from '../../_utils/sanitizeLockup'

import { LockupPresets } from './lockupPresets'
import { RangeSlider } from './rangeSlider'
import { WarningMessage } from './warningMessage'

type ValidLockupProps = {
  minLocked?: number
  value: number
}

export const isValidLockup = (props: ValidLockupProps) =>
  getLockupErrorMessage(props) === undefined

type TryValuesHintProps = NearestValidValues & {
  inputText: string
  isValid: boolean
}

const Divider = () => <div className="h-px w-full bg-neutral-300/55" />

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <p className="flex justify-between font-medium text-neutral-600">
    <span>{label}</span>
    <span className="text-neutral-950">{value}</span>
  </p>
)

export const VotingPowerEquivalence = function ({
  amount,
  token,
  votingPower,
}: {
  amount: string
  token: Token
  votingPower: string
}) {
  const { data: veHemiToken, isLoading: isLoadingVeHemiToken } =
    useVeHemiToken()

  return (
    <div className="flex items-center gap-x-1">
      <DisplayAmount amount={amount} token={token} />
      <span>=</span>
      {isLoadingVeHemiToken || !veHemiToken ? (
        <Skeleton className="w-16" />
      ) : (
        <DisplayAmount amount={votingPower} token={veHemiToken} />
      )}
    </div>
  )
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

const AutoRelockRow = function ({
  checked = false,
  disabled,
  onCheckedChange,
  show,
}: {
  checked?: boolean
  disabled?: boolean
  onCheckedChange?: (enabled: boolean) => void
  show: boolean
}) {
  const id = useId()
  const t = useTranslations('hemi-stake.form')
  if (!show || onCheckedChange === undefined) {
    return null
  }
  return (
    <div className="body-text-medium flex items-center justify-between gap-x-2 text-neutral-900">
      <div className="flex items-center gap-x-1">
        <span>{t('auto-relock')}</span>
        <Tooltip
          id={`auto-relock-estimate-${id}`}
          text={t('auto-relock-tooltip')}
          variant="info"
        >
          <div className="group/icon flex items-center">
            <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-950" />
          </div>
        </Tooltip>
      </div>
      <Toggle
        ariaLabel={t('auto-relock')}
        checked={checked}
        disabled={disabled}
        id={`auto-relock-${id}`}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}

const VotingPowerCaption = function ({
  autoRelock = false,
  expireDate,
  show,
  valid,
}: {
  autoRelock?: boolean
  expireDate: string
  show: boolean
  valid: boolean
}) {
  const t = useTranslations('hemi-stake.form')
  if (!show) {
    return null
  }
  if (!valid) {
    return <span className="text-xxs text-neutral-400">-</span>
  }
  return (
    <span className="text-xxs text-neutral-400">
      {autoRelock
        ? t('voting-power-stays')
        : t('voting-power-decays', { date: expireDate })}
    </span>
  )
}

type Props = {
  autoRelock?: boolean
  disabled?: boolean
  input: string
  inputDays: string
  lockupDays: number
  minLocked?: number
  updateAutoRelock?: (enabled: boolean) => void
  updateInputDays: (days: string) => void
  updateLockupDays: (days: number) => void
}

export function Lockup({
  autoRelock,
  disabled,
  input,
  inputDays,
  lockupDays,
  minLocked,
  updateAutoRelock,
  updateInputDays,
  updateLockupDays,
}: Props) {
  const t = useTranslations('hemi-stake')
  const locale = useLocale()
  const token = useHemiToken()

  const amount = parseTokenUnits(input, token)

  const sublabels = useLockupApySublabels(amount, autoRelock)

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
  const lockupSeconds = wholeDaysToSeconds(lockupDays)
  const lockEnd = getLockEnd({
    lockTime: Number(lockupSeconds),
    timestamp: Number(unixNowTimestamp()),
  })
  const { unlockDate } = getUnlockInfo({
    unlockTime: lockEnd,
  })
  const expireDate = formatDate(unlockDate, locale)

  const votingPowerRatio = useMemo(
    function calcVotingPower() {
      if (!amount || amount === BigInt(0)) {
        return '0'
      }

      const votingPower = predictVotingPower({
        amount,
        unlockTime: lockEnd,
      })

      const formattedPower = formatUnits(votingPower, token.decimals)
      return formattedPower.toString()
    },
    [amount, lockEnd, token.decimals],
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

    if (
      minLocked &&
      (!inputDays || (!touched && Number(inputDays) < minLocked))
    ) {
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
      <div className="w-full space-y-4 rounded-lg border border-solid border-transparent bg-neutral-50 p-4 ring-1 ring-transparent hover:shadow-bs">
        <div className="flex h-7 items-center justify-between">
          <div className="flex items-center gap-x-1">
            <span className="text-sm font-medium text-neutral-500" id={labelId}>
              {t('lockup-period')}
            </span>
            {showPresets && (
              <Tooltip
                id="lockup-apy-estimate"
                text={t('apy-estimate')}
                variant="info"
              >
                <div className="group/icon flex items-center">
                  <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-950" />
                </div>
              </Tooltip>
            )}
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
        <AutoRelockRow
          checked={autoRelock}
          disabled={disabled}
          onCheckedChange={updateAutoRelock}
          show={canUsePresets}
        />
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
        {minLocked !== undefined && (
          <>
            <Divider />
            <InfoRow label={t('form.expire-date')} value={expireDate} />
            <Divider />
          </>
        )}
        <div className="flex flex-col gap-y-0.5">
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
          <VotingPowerCaption
            autoRelock={autoRelock}
            expireDate={formatShortDateWithYear(unlockDate, locale)}
            show={canUsePresets}
            valid={valid}
          />
        </div>
      </div>
      {minLocked && (
        <div className="mt-5">
          <WarningMessage>{t('form.lockup-extend-warning')}</WarningMessage>
        </div>
      )}
    </>
  )
}
