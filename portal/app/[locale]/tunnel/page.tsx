'use client'

import { Button } from 'components/button'
import { WarningRounded } from 'components/icons/warningRounded'
import { Modal } from 'components/modal'
import { PageLayout } from 'components/pageLayout'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useWindowSize } from 'hooks/useWindowSize'
import { useTranslations } from 'next-intl'
import { Suspense, useLayoutEffect, useState } from 'react'
import { screenBreakpoints } from 'styles'
import {
  useAccount as useEvmAccount,
  useDisconnect as useEvmDisconnect,
} from 'wagmi'

import { Deposit } from './_components/deposit'
import { Withdraw } from './_components/withdraw'
import { useTunnelOperation } from './_hooks/useTunnelOperation'
import { useTunnelState } from './_hooks/useTunnelState'

const WarningModal = function ({ onClose }: { onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const { connector } = useEvmAccount()
  const { disconnect } = useEvmDisconnect()
  const { openDrawer } = useDrawerContext()
  const { width } = useWindowSize()
  const t = useTranslations('tunnel-page')
  function closeModal() {
    setIsOpen(false)
    onClose?.()
  }

  useLayoutEffect(function () {
    const rafId = requestAnimationFrame(() => setIsVisible(true))
    return () => cancelAnimationFrame(rafId)
  }, [])

  function onSwitchWallet() {
    closeModal()
    if (connector) disconnect({ connector })
    openDrawer()
  }

  if (!isOpen) return null

  const isMobileBottom = width < screenBreakpoints.md

  return (
    <Modal
      onClose={closeModal}
      verticalAlign={isMobileBottom ? 'bottom' : 'center'}
    >
      <div
        className={
          isMobileBottom
            ? 'fixed bottom-0 left-0 right-0 z-30 w-screen transition-opacity duration-200'
            : 'mx-auto max-w-[448px] transition-opacity duration-200'
        }
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <div
          className={
            isMobileBottom
              ? 'card-container rounded-b-none rounded-t-xl bg-white pl-6 pr-6 pt-6 shadow-md'
              : 'card-container mx-auto rounded-xl bg-white p-8 shadow-md'
          }
        >
          <WarningRounded className="mb-4" />
          <div className={`flex flex-col ${isMobileBottom ? 'mb-6' : ''}`}>
            <h3 className="text-mid-md mb-2 font-semibold">
              {t('warning-modal.heading')}
            </h3>
            <p className="text-sm text-neutral-500 md:mb-4">
              {t('warning-modal.description')}
            </p>
          </div>
          <div
            className={
              isMobileBottom
                ? '-mx-6 flex w-screen flex-col gap-y-2 border-t border-neutral-300/55 bg-neutral-50 px-6 pb-6 pt-4'
                : 'flex w-full flex-row-reverse gap-x-2'
            }
          >
            <div className={isMobileBottom ? '' : 'min-w-0 flex-1'}>
              <Button
                onClick={onSwitchWallet}
                size="small"
                style={{ width: '100%' }}
                variant="primary"
              >
                {t('warning-modal-button.switch-wallet')}
              </Button>
            </div>
            <div className={isMobileBottom ? '' : 'min-w-0 flex-1'}>
              <Button
                onClick={closeModal}
                size="small"
                style={{ width: '100%' }}
                variant="secondary"
              >
                {t('warning-modal-button.cancel')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
const TunnelWithdrawWithWarning = function ({
  state,
}: {
  state: ReturnType<typeof useTunnelState>
}) {
  const [showRabbyWarning, setShowRabbyWarning] = useState(false)
  return (
    <>
      <Withdraw
        onOpenRabbyWarning={() => setShowRabbyWarning(true)}
        state={state}
      />
      {showRabbyWarning && (
        <WarningModal onClose={() => setShowRabbyWarning(false)} />
      )}
    </>
  )
}

const Tunnel = function () {
  const { operation } = useTunnelOperation()
  const tunnelState = useTunnelState()

  const props = {
    state: tunnelState,
  }

  return (
    <div className="h-fit-rest-screen">
      {operation === 'withdraw' ? (
        <TunnelWithdrawWithWarning state={tunnelState} />
      ) : (
        <Deposit {...props} />
      )}
    </div>
  )
}

export default function Page() {
  return (
    <PageLayout variant="center">
      <Suspense>
        <Tunnel />
      </Suspense>
    </PageLayout>
  )
}
