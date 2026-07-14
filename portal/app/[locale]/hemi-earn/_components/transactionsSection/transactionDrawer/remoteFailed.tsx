'use client'

import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { WarningBox } from 'components/warningBox'
import { type EventEmitter } from 'events'
import { type RetryRequestEvents } from 'hemi-earn-actions'
import { useTranslations } from 'next-intl'
import { type MouseEvent, type ReactNode } from 'react'

import {
  useCancelRequest,
  useRetryRequest,
} from '../../../_hooks/useRemoteFailedActions'
import { useRemoteFailedState } from '../../../_hooks/useRemoteFailedState'
import { remoteFailedSettlement } from '../../../_utils'
import { type EarnSettlement, type EarnTransaction } from '../../../types'

import { useTxDrawerQueryString } from './useTxDrawerQueryString'

type RecoveryConfig = {
  idleKey: 'retry' | 'return-share-tokens'
  kind: EarnSettlement['kind']
  mutation: ReturnType<typeof useRetryRequest>
  pendingKey: 'status.cancelling-request' | 'status.retrying'
  primary: boolean
}

const RecoveryButton = function ({
  config,
  disabled,
  marker,
}: {
  config: RecoveryConfig
  disabled: boolean
  marker: EarnSettlement | undefined
}) {
  const t = useTranslations('hemi-earn.transactions')
  const own = marker?.kind === config.kind ? marker : undefined
  const pending = config.mutation.isPending || (!!own && !own.failed)

  const onClick = function (e: MouseEvent) {
    e.stopPropagation()
    if (!disabled) config.mutation.mutate()
  }

  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      size="small"
      type="button"
      variant={config.primary ? 'primary' : 'secondary'}
    >
      {pending ? t(config.pendingKey) : t(config.idleKey)}
    </Button>
  )
}

export const RemoteFailedCta = function ({
  fallback = null,
  fullWidth = true,
  redirectOnSign = false,
  transaction,
}: {
  fallback?: ReactNode
  fullWidth?: boolean
  redirectOnSign?: boolean
  transaction: EarnTransaction
}) {
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()
  const { category, show } = useRemoteFailedState(transaction)

  const on = redirectOnSign
    ? (emitter: EventEmitter<RetryRequestEvents>) =>
        emitter.on('user-signed-tx', () =>
          setTxDrawerQueryString(transaction.requestTxHash),
        )
    : undefined

  const retry = useRetryRequest({ on, transaction })
  const cancel = useCancelRequest({ on, transaction })

  const marker = remoteFailedSettlement(transaction.settlement)
  const retryConfig: RecoveryConfig = {
    idleKey: 'retry',
    kind: 'RETRY',
    mutation: retry,
    pendingKey: 'status.retrying',
    primary: true,
  }
  const cancelConfig: RecoveryConfig = {
    idleKey: 'return-share-tokens',
    kind: 'CANCEL_REQUEST',
    mutation: cancel,
    pendingKey: 'status.cancelling-request',
    primary: category === 'slippage',
  }
  // A slippage retry just slips again against the frozen min-out, so offer only Cancel;
  // for gas/unknown, Retry leads with Cancel as the escape hatch.
  const configs =
    category === 'slippage' ? [cancelConfig] : [retryConfig, cancelConfig]
  const anyPending = configs.some(
    c => c.mutation.isPending || (marker?.kind === c.kind && !marker.failed),
  )

  if (!show) {
    return <>{fallback}</>
  }

  return (
    <SubmitWhenConnected
      submitButton={
        <div
          className={
            fullWidth ? 'flex w-full gap-x-2 [&>button]:flex-1' : 'flex gap-x-2'
          }
        >
          {configs.map(config => (
            <RecoveryButton
              config={config}
              disabled={anyPending}
              key={config.kind}
              marker={marker}
            />
          ))}
        </div>
      }
      submitButtonSize="small"
    />
  )
}

export const RemoteFailedBanner = function ({
  transaction,
}: {
  transaction: EarnTransaction | undefined
}) {
  const t = useTranslations('hemi-earn.transactions.banner')
  const { category, show } = useRemoteFailedState(transaction)

  if (!show) {
    return null
  }
  return (
    <div className="px-4 py-6 md:px-6">
      <WarningBox
        heading={t(
          category === 'slippage'
            ? 'remote-failed.heading-slippage'
            : 'remote-failed.heading',
        )}
        subheading={t(
          category === 'slippage'
            ? 'remote-failed.subheading-slippage'
            : 'remote-failed.subheading',
        )}
      />
    </div>
  )
}
