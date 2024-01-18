'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
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
      <div className="ml-auto mr-6 hidden md:block xl:mr-20">
        <ConnectButton />
      </div>
      {/* Only visible at the top when connected */}
      <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
        {!isDisconnected && <ConnectButton />}
      </div>
    </>
  )
}
