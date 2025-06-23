import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { MessageStatus, ToEvmWithdrawOperation } from 'types/tunnel'
import { secondsToHours, secondsToMinutes } from 'utils/time'

import {
  useEvmWithdrawTimeToFinalize,
  useEvmWithdrawTimeToProve,
} from '../_hooks/useWaitTime'

type WithdrawalProps = {
  withdrawal: ToEvmWithdrawOperation
}

type WaitTimeProps = {
  timeInSeconds: number
}

const ExpectedWithdrawalWaitTimeSecondsTestnet = 20 * 60 // 20 minutes
const ExpectedWithdrawalWaitTimeSecondsMainnet = 40 * 60 // 40 minutes
const ExpectedProofWaitTimeSecondsTestnet = 3 * 60 * 60 // 3 hours
const ExpectedProofWaitTimeSecondsMainnet = 24 * 60 * 60 // 24 hours

const minuteInSeconds = 60
const hourInSeconds = 60 * 60

const WaitTime = function ({ timeInSeconds }: WaitTimeProps) {
  const tCommon = useTranslations('common')

  if (timeInSeconds > hourInSeconds) {
    return (
      <span>
        {tCommon.rich('wait-hours', {
          hours: () =>
            tCommon('hours', {
              hours: Math.ceil(secondsToHours(timeInSeconds)),
            }),
        })}
      </span>
    )
  }

  if (timeInSeconds > minuteInSeconds) {
    return (
      <span>
        {tCommon('wait-minutes', {
          minutes: Math.ceil(secondsToMinutes(timeInSeconds)),
        })}
      </span>
    )
  }

  return (
    <span>
      {tCommon('wait-minutes', {
        minutes: 1,
      })}
    </span>
  )
}

export const EvmWithdrawalWaitTimeToProve = function ({
  withdrawal,
}: WithdrawalProps) {
  const [networkType] = useNetworkType()
  const tCommon = useTranslations('common')

  const enabledStatus = MessageStatus.STATE_ROOT_NOT_PUBLISHED

  const { data, isError, isPending } = useEvmWithdrawTimeToProve({
    enabledStatus,
    withdrawal,
  })

  if (withdrawal.status === enabledStatus && isPending) {
    return <Skeleton className="w-12" />
  }

  if (isError) {
    return (
      <WaitTime
        timeInSeconds={
          networkType === 'mainnet'
            ? ExpectedWithdrawalWaitTimeSecondsMainnet
            : ExpectedWithdrawalWaitTimeSecondsTestnet
        }
      />
    )
  }

  if (withdrawal.status >= MessageStatus.READY_TO_PROVE) {
    return <span> {tCommon('waiting-completed')} </span>
  }

  return <WaitTime timeInSeconds={data} />
}

export const EvmWithdrawalWaitTimeToFinalize = function ({
  withdrawal,
}: WithdrawalProps) {
  const [networkType] = useNetworkType()
  const tCommon = useTranslations('common')

  const enabledStatus = MessageStatus.IN_CHALLENGE_PERIOD

  const { data, isError, isPending } = useEvmWithdrawTimeToFinalize({
    enabledStatus,
    withdrawal,
  })

  if (withdrawal.status === enabledStatus && isPending) {
    return <Skeleton className="w-12" />
  }

  if (isError || withdrawal.status < MessageStatus.READY_FOR_RELAY) {
    return (
      <WaitTime
        timeInSeconds={
          networkType === 'mainnet'
            ? ExpectedProofWaitTimeSecondsMainnet
            : ExpectedProofWaitTimeSecondsTestnet
        }
      />
    )
  }

  if (withdrawal.status >= MessageStatus.READY_FOR_RELAY) {
    return <span> {tCommon('waiting-completed')} </span>
  }

  return <WaitTime timeInSeconds={data} />
}
