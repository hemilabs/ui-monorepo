'use client'

import { Button } from 'components/button'
import { WarningRounded } from 'components/icons/warningRounded'
import { Modal } from 'components/modal'
import { PageLayout } from 'components/pageLayout'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useWindowSize } from 'hooks/useWindowSize'
import { Suspense, useLayoutEffect, useState } from 'react'
import { screenBreakpoints } from 'styles'
import {
  useAccount as useEvmAccount,
  useDisconnect as useEvmDisconnect,
} from 'wagmi'

import { Deposit } from './_components/deposit'
import { Withdraw } from './_components/withdraw'
import { useShouldShowRabbyWarningModal } from './_hooks/useShouldShowRabbyWarningModal'
import { useTunnelOperation } from './_hooks/useTunnelOperation'
import { useTunnelState } from './_hooks/useTunnelState'

const WarningModal = function () {
  const [isOpen, setIsOpen] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const { connector } = useEvmAccount()
  const { disconnect } = useEvmDisconnect()
  const { openDrawer } = useDrawerContext()
  const { width } = useWindowSize()
  const closeModal = () => setIsOpen(false)

  useLayoutEffect(function () {
    const t = requestAnimationFrame(() => setIsVisible(true))
    return () => cancelAnimationFrame(t)
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
              Switch wallet to continue
            </h3>
            <p className="text-sm text-neutral-500 md:mb-4">
              We’re currently experiencing an issue with the Rabby wallet where
              transactions between Hemi and Bitcoin may fail. While we work with
              the Rabby team to resolve this, please connect a different wallet
              to complete this transaction.
            </p>
          </div>
          <div
            className={
              isMobileBottom
                ? 'border-neutral-300/56 -mx-6 flex w-screen flex-col gap-y-2 border-t bg-neutral-50 px-6 pb-6 pt-4'
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
                Switch wallet
              </Button>
            </div>
            <div className={isMobileBottom ? '' : 'min-w-0 flex-1'}>
              <Button
                onClick={closeModal}
                size="small"
                style={{ width: '100%' }}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
const Tunnel = function () {
  const { operation } = useTunnelOperation()
  const tunnelState = useTunnelState()
  const shouldShowRabbyWarning = useShouldShowRabbyWarningModal(
    tunnelState.toNetworkId,
  )

  const props = {
    state: tunnelState,
  }

  return (
    <div className="h-fit-rest-screen">
      {operation === 'withdraw' ? (
        <Withdraw {...props} />
      ) : (
        <Deposit {...props} />
      )}
      {shouldShowRabbyWarning && <WarningModal />}
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
