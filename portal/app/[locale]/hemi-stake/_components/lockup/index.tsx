import { featureFlags } from 'app/featureFlags'
import { DisplayAmount } from 'components/displayAmount'
import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { useFormat } from 'hooks/useFormat'
import { useHemiToken } from 'hooks/useHemiToken'
import { useVeHemiToken } from 'hooks/useVeHemiToken'
import { ReactNode, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import type { Token } from 'types/token'
import { useTranslations } from 'use-intl'
import { unixNowTimestamp } from 'utils/time'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'

import {
  getUnlockInfo,
  wholeDaysToSeconds,
} from '../../_utils/lockCreationTimes'
import { getLockEnd, getPositionWeights } from '../../_utils/lockEpochs'
import { isValidLockup } from '../../_utils/lockupError'

import { LockupPicker } from './lockupPicker'
import { WarningMessage } from './warningMessage'

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
  autoRelock = false,
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
  const { formatDate, formatShortDateWithYear } = useFormat()
  const token = useHemiToken()

  const amount = parseTokenUnits(input, token)

  const canUsePresets = minLocked === undefined
  const valid = isValidLockup({ minLocked, value: Number(inputDays) })
  const lockupSeconds = wholeDaysToSeconds(lockupDays)
  const lockEnd = getLockEnd({
    lockTime: Number(lockupSeconds),
    timestamp: Number(unixNowTimestamp()),
  })
  const { unlockDate } = getUnlockInfo({
    unlockTime: lockEnd,
  })
  const expireDate = formatDate(unlockDate)

  const votingPowerRatio = useMemo(
    function calcVotingPower() {
      if (!amount || amount === BigInt(0)) {
        return '0'
      }

      const { current } = getPositionWeights({
        amount,
        autoRelock,
        fromChain: undefined,
        lockEnd,
        now: Number(unixNowTimestamp()),
      })

      const formattedPower = formatUnits(current, token.decimals)
      return formattedPower.toString()
    },
    [amount, autoRelock, lockEnd, token.decimals],
  )

  return (
    <>
      <div className="w-full space-y-4 rounded-lg border border-solid border-transparent bg-neutral-50 p-4 ring-1 ring-transparent hover:shadow-bs">
        <LockupPicker
          amount={amount}
          autoRelock={autoRelock}
          disabled={disabled}
          headerAction={
            <Tooltip
              id="lockup-apy-estimate"
              text={t('apy-estimate')}
              variant="info"
            >
              <div className="group/icon flex items-center">
                <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-950" />
              </div>
            </Tooltip>
          }
          inputDays={inputDays}
          lockupDays={lockupDays}
          minLocked={minLocked}
          updateAutoRelock={updateAutoRelock}
          updateInputDays={updateInputDays}
          updateLockupDays={updateLockupDays}
        />
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
            expireDate={formatShortDateWithYear(unlockDate)}
            show={featureFlags.enableHemiStakeAutoRelock && canUsePresets}
            valid={valid}
          />
        </div>
      </div>
      {minLocked && (
        <WarningMessage>{t('form.lockup-extend-warning')}</WarningMessage>
      )}
    </>
  )
}
