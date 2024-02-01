'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import { useAccount } from 'wagmi'

// This component is only intended to be used in the header.tsx file
// However, it needs to be forcefully loaded dynamically with SSR: false
// otherwise hydration warnings are throw and I can't figure out why :(
// Suspicious of the useAccount hook
export const WalletConnectButton = function () {
  const { isDisconnected } = useAccount()

  return (
    <>
      {/* Only visible for large screens */}
      <div className="z-20 ml-auto mr-6 hidden md:block xl:mr-20">
        <ConnectButton />
      </div>
      {/* Only visible at the top when connected */}
      <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
        {!isDisconnected && <ConnectButton />}
      </div>
    </>
  )
}

// Custom style implementation for the mobile view when disconnected
export const WalletConnectMobile = function () {
  const { isConnected } = useAccount()
  const t = useTranslations('common')
  const connectWalletLabel = t('connect-wallet')

  const containerCommonCss = 'w-full rounded-xl bg-white px-5 py-4'

  if (isConnected) {
    return (
      <div className={`${containerCommonCss} flex justify-center`}>
        <ConnectButton />
      </div>
    )
  }
  return (
    <ConnectButton.Custom>
      {function ({
        account,
        chain,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')
        if (!ready || connected) {
          return null
        }
        return (
          <div className={containerCommonCss}>
            <button
              className="px-auto w-full rounded-xl bg-black py-3 text-sm font-medium text-white"
              onClick={openConnectModal}
              type="button"
            >
              {connectWalletLabel}
            </button>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
