import { DisplayAmount } from 'components/displayAmount'
import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { useHemiToken } from 'hooks/useHemiToken'
import { useVeHemiToken } from 'hooks/useVeHemiToken'
import { ReactNode, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import type { Token } from 'types/token'
import { useLocale, useTranslations } from 'use-intl'
import { formatDate } from 'utils/format'
import { unixNowTimestamp } from 'utils/time'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'

import {
  getUnlockInfo,
  predictVotingPower,
  wholeDaysToSeconds,
} from '../../_utils/lockCreationTimes'

import { LockupPicker } from './lockupPicker'
import { WarningMessage } from './warningMessage'

const Divider = () => <div className="h-px w-full bg-neutral-300/55" />

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <p className="flex justify-between font-medium text-neutral-600">
    <span>{label}</span>
    <span className="text-neutral-950">{value}</span>
  </p>
)

const VotingPowerEquivalence = function ({
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
  const t = useTranslations('hemi-stake')
  const locale = useLocale()
  const token = useHemiToken()

  const amount = parseTokenUnits(input, token)

  const lockupSeconds = wholeDaysToSeconds(lockupDays)
  const expireDate = formatDate(
    getUnlockInfo({
      lockTime: lockupSeconds,
      timestamp: Number(unixNowTimestamp()),
    }).unlockDate,
    locale,
  )

  const votingPowerRatio = useMemo(
    function calcVotingPower() {
      if (!amount || amount === BigInt(0)) {
        return '0'
      }

      const votingPower = predictVotingPower({
        amount,
        lockTime: lockupSeconds,
        timestamp: unixNowTimestamp(),
      })

      const formattedPower = formatUnits(votingPower, token.decimals)
      return formattedPower.toString()
    },
    [amount, lockupSeconds, token.decimals],
  )

  return (
    <>
      <div className="w-full space-y-4 rounded-lg border border-solid border-transparent bg-neutral-50 p-4 ring-1 ring-transparent hover:shadow-bs">
        <LockupPicker
          amount={amount}
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
      {minLocked && (
        <div className="mt-5">
          <WarningMessage>{t('form.lockup-extend-warning')}</WarningMessage>
        </div>
      )}
    </>
  )
}
