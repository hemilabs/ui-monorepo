'use client'

import { Button } from 'components/button'
import { CheckMark } from 'components/icons/checkMark'
import { PlusIcon } from 'components/icons/plusIcon'
import { useAddTokenToWallet } from 'hooks/useAddTokenToWallet'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useWatchedAsset } from 'hooks/useWatchedAsset'
import { useTranslations } from 'next-intl'
import { type ReactNode, useEffect, useState } from 'react'
import { EvmToken } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
import { useAccount } from 'wagmi'

import { AddTokenToWalletToast } from './addTokenToWalletToast'

type Props = {
  token: EvmToken
}

const ActionSlot = ({ children }: { children: ReactNode }) => (
  <div className="flex h-7 shrink-0 items-center gap-x-1">{children}</div>
)

const ActionLabel = ({ children }: { children: ReactNode }) => (
  <span className="whitespace-nowrap text-xs font-semibold text-neutral-950">
    {children}
  </span>
)

const AddedAction = function () {
  const tCommon = useTranslations('common')

  return (
    <>
      <CheckMark className="size-4 [&>path]:fill-emerald-500" />
      <ActionLabel>{tCommon('added')}</ActionLabel>
    </>
  )
}

type AddTokenActionProps = {
  disabled: boolean
  onClick: () => void
}

const AddTokenAction = function ({ disabled, onClick }: AddTokenActionProps) {
  const t = useTranslations('get-started')

  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      size="xSmall"
      type="button"
      variant="secondary"
    >
      <PlusIcon className="[&>path]:fill-neutral-500" />
      <ActionLabel>{t('add-token')}</ActionLabel>
    </Button>
  )
}

export const AddTokenTableButton = function ({ token }: Props) {
  const { isConnected } = useAccount()
  const { openDrawer } = useDrawerContext()
  const isTokenAdded = useWatchedAsset(token.address)

  const [toastKey, setToastKey] = useState(0)
  const [toastVariant, setToastVariant] = useState<'error' | 'success' | null>(
    null,
  )

  const { isPending, mutate, reset, status } = useAddTokenToWallet({
    token,
  })

  useEffect(
    function handleMutationStatus() {
      if (status === 'success') {
        setToastVariant('success')
        setToastKey(k => k + 1)
      } else if (status === 'error') {
        setToastVariant('error')
        setToastKey(k => k + 1)
        reset()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status],
  )

  if (isNativeToken(token)) {
    return null
  }

  const isAdded = isTokenAdded || status === 'success'

  const onClick = function () {
    if (!isConnected) {
      openDrawer?.()
      return
    }
    mutate()
  }

  return (
    <>
      {toastVariant !== null && (
        <AddTokenToWalletToast key={toastKey} variant={toastVariant} />
      )}
      <ActionSlot>
        {isAdded ? (
          <AddedAction />
        ) : (
          <AddTokenAction disabled={isPending} onClick={onClick} />
        )}
      </ActionSlot>
    </>
  )
}
