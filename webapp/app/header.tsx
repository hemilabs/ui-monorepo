'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useAccount } from 'wagmi'

const HamburgerIcon = () => (
  <svg
    fill="none"
    height="32"
    viewBox="0 0 32 32"
    width="32"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M28 16C28 16.2652 27.8946 16.5196 27.7071 16.7071C27.5196 16.8946 27.2652 17 27 17H5C4.73478 17 4.48043 16.8946 4.29289 16.7071C4.10536 16.5196 4 16.2652 4 16C4 15.7348 4.10536 15.4804 4.29289 15.2929C4.48043 15.1054 4.73478 15 5 15H27C27.2652 15 27.5196 15.1054 27.7071 15.2929C27.8946 15.4804 28 15.7348 28 16ZM5 9H27C27.2652 9 27.5196 8.89464 27.7071 8.70711C27.8946 8.51957 28 8.26522 28 8C28 7.73478 27.8946 7.48043 27.7071 7.29289C27.5196 7.10536 27.2652 7 27 7H5C4.73478 7 4.48043 7.10536 4.29289 7.29289C4.10536 7.48043 4 7.73478 4 8C4 8.26522 4.10536 8.51957 4.29289 8.70711C4.48043 8.89464 4.73478 9 5 9ZM27 23H5C4.73478 23 4.48043 23.1054 4.29289 23.2929C4.10536 23.4804 4 23.7348 4 24C4 24.2652 4.10536 24.5196 4.29289 24.7071C4.48043 24.8946 4.73478 25 5 25H27C27.2652 25 27.5196 24.8946 27.7071 24.7071C27.8946 24.5196 28 24.2652 28 24C28 23.7348 27.8946 23.4804 27.7071 23.2929C27.5196 23.1054 27.2652 23 27 23Z"
      fill="black"
    />
  </svg>
)

const WalletConnectButton = dynamic(
  () => import('app/walletConnectButton').then(mod => mod.WalletConnectButton),
  {
    loading: () => <Skeleton className="h-10 w-28" />,
    ssr: false,
  },
)

// Custom style implementation for the mobile view when disconnected
const CustomConnectButton = function () {
  const { isConnected } = useAccount()

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
              Connect wallet
            </button>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

type Props = {
  path: '/bridge' | '/swap'
  text: string
}

const Route = function ({ path, text }: Props) {
  const pathname = usePathname()
  const activeLink = 'bg-white text-black cursor-auto'
  const inactiveLink = 'bg-transparent cursor-pointer text-zinc-500'
  return (
    <li
      className={`rounded-2xl px-5 py-3 ${
        pathname === path ? activeLink : inactiveLink
      }`}
    >
      <Link href={path}>{text}</Link>
    </li>
  )
}

export const Header = function () {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const menuRef = useOnClickOutside<HTMLDivElement>(toggleMenu)

  return (
    <header className="relative flex h-24 items-center py-6">
      <div className="fixed bottom-0 left-0 right-0 z-10 h-[90px] bg-white/60 backdrop-blur-sm md:hidden" />
      <div className="fixed bottom-0 z-10 flex w-full pb-6 pt-4 md:absolute md:left-1/2 md:block md:-translate-x-1/2">
        <ul className="mx-auto flex justify-center gap-x-4 rounded-xl bg-neutral-100 p-[2px] md:mx-0 md:bg-inherit">
          <Route path="/bridge" text="Bridge" />
          <Route path="/swap" text="Swap" />
        </ul>
      </div>
      <WalletConnectButton />
      <button
        className="ml-auto mr-4 cursor-pointer md:hidden"
        onClick={toggleMenu}
        type="button"
      >
        <HamburgerIcon />
      </button>
      {isMenuOpen && (
        <>
          <div className="fixed bottom-0 top-0 z-20 w-full bg-neutral-200/30 backdrop-blur-sm"></div>
          <div
            className="fixed bottom-0 left-0 right-0 z-20 flex items-center shadow-2xl md:hidden"
            ref={menuRef}
          >
            <CustomConnectButton />
          </div>
        </>
      )}
    </header>
  )
}
