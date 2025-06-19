import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { MessageStatus, ToEvmWithdrawOperation } from 'types/tunnel'
import { secondsToHours, secondsToMinutes } from 'utils/time'

import {
  useEvmWithdrawTimeToFinalize,
  useEvmWithdrawTimeToProve,
} from '../_hooks/useWaitTime'

type Props = {
  withdrawal: ToEvmWithdrawOperation
}

const ExpectedWithdrawalWaitTimeSecondsTestnet = 20 * 60 // 20 minutes
const ExpectedWithdrawalWaitTimeSecondsMainnet = 40 * 60 // 40 minutes
const ExpectedProofWaitTimeSecondsTestnet = 3 * 60 * 60 // 3 hours
const ExpectedProofWaitTimeSecondsMainnet = 24 * 60 * 60 // 24 hours

const renderTime = function (
  timeInSeconds: number,
  tCommon: ReturnType<typeof useTranslations>,
) {
  const minuteInSeconds = 60
  const hourInSeconds = 60 * 60

  if (timeInSeconds > hourInSeconds) {
    return tCommon.rich('wait-hours', {
      hours: () =>
        tCommon('hours', {
          hours: Math.ceil(secondsToHours(timeInSeconds)),
        }),
    })
  }

  if (timeInSeconds > minuteInSeconds) {
    return tCommon('wait-minutes', {
      minutes: Math.ceil(secondsToMinutes(timeInSeconds)),
    })
  }

  return tCommon('wait-minutes', {
    minutes: 1,
  })
}

export const EvmWithdrawalWaitTimeToProve = function ({ withdrawal }: Props) {
  const [networkType] = useNetworkType()
  const tCommon = useTranslations('common')
  const { data, isError, isPending } = useEvmWithdrawTimeToProve(withdrawal)

  if (isPending) {
    return <Skeleton className="w-12" />
  }

  if (isError) {
    return (
      <span>
        {renderTime(
          networkType === 'mainnet'
            ? ExpectedWithdrawalWaitTimeSecondsMainnet
            : ExpectedWithdrawalWaitTimeSecondsTestnet,
          tCommon,
        )}
      </span>
    )
  }

  if (data === 0 && withdrawal.status === MessageStatus.READY_TO_PROVE) {
    return <span> {tCommon('waiting-completed')} </span>
  }

  return <span> {renderTime(data, tCommon)} </span>
}

export const EvmWithdrawalWaitTimeToFinalize = function ({
  withdrawal,
}: Props) {
  const [networkType] = useNetworkType()
  const tCommon = useTranslations('common')
  const { data, isError, isPending } = useEvmWithdrawTimeToFinalize(withdrawal)

  if (isPending) {
    return <Skeleton className="w-12" />
  }

  if (isError || withdrawal.status < MessageStatus.READY_FOR_RELAY) {
    return (
      <span>
        {renderTime(
          networkType === 'mainnet'
            ? ExpectedProofWaitTimeSecondsMainnet
            : ExpectedProofWaitTimeSecondsTestnet,
          tCommon,
        )}
      </span>
    )
  }

  if (data === 0 && withdrawal.status === MessageStatus.READY_FOR_RELAY) {
    return <span> {tCommon('waiting-completed')} </span>
  }

  return <span> {renderTime(data, tCommon)} </span>
}
