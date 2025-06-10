import { CloseIcon } from 'components/icons/closeIcon'
import { HamburgerIcon } from 'components/icons/hamburgerIcon'
import { Link } from 'components/link'
import { StakeTabs } from 'components/stakeTabs'
import { TunnelTabs } from 'components/tunnelTabs'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import dynamic from 'next/dynamic'
import { Dispatch, SetStateAction } from 'react'

import { Badge } from './navbar/_components/badge'

const WalletConnection = dynamic(
  () => import('components/connectWallets').then(mod => mod.WalletConnection),
  {
    loading: () => <div className="ml-auto" />,
    ssr: false,
  },
)

const HemiSymbol = () => (
  <svg
    enableBackground="new 0 0 1080 1080"
    viewBox="0 0 1080 1080"
    xmlSpace="preserve"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M436.2 1069.8c5.5 1.1 10.8-2.6 11.7-8.1L515 681.5h49.9l67 380.2c1 5.5 6.3 9.2 11.7 8.1 238-46.3 420.2-248.8 435.3-496.4v.1c0-.2.6-10.9.7-16.1 0-.6 0-1.2.1-1.7.1-2 .1-3.9.1-5.9v-2.2c0-2.5.1-5 .1-7.4v-.1c0-262.6-187.7-481.4-436.2-529.8-5.5-1.1-10.8 2.6-11.7 8.1l-67 380.1h-49.9l-67-380.2c-1-5.5-6.3-9.2-11.7-8.1C198.3 56.4 16.2 259 1 506.6v-.1c0 .2-.6 10.9-.7 16.1 0 .6 0 1.2-.1 1.7-.1 2-.1 3.9-.1 5.9v2.2c0 2.5-.1 5-.1 7.4v.1c0 262.7 187.7 481.5 436.2 529.9z"
      fill="#FF5F00"
    />
  </svg>
)

type Props = {
  isMenuOpen: boolean
  setIsNavbarOpen: Dispatch<SetStateAction<boolean>>
  toggleMenu: () => void
}

export const Header = function ({
  isMenuOpen,
  setIsNavbarOpen,
  toggleMenu,
}: Props) {
  const href = useTunnelOperationByConnectedWallet()

  return (
    <header
      className="md:h-13 md:py-4.5 flex h-14 items-center border-b border-solid
     border-neutral-300/55 bg-white px-3 py-3 md:bg-transparent md:px-0"
    >
      <div className="flex items-center gap-x-2 md:hidden">
        <Link className="h-6 w-6" href={href}>
          <HemiSymbol />
        </Link>
        <Badge />
      </div>
      <div className="size-13 hidden items-center justify-center border-r border-neutral-300/55 md:flex lg:hidden">
        <div
          className="shadow-soft hidden size-7 cursor-pointer items-center
          justify-center rounded-lg border border-neutral-300/55 bg-white md:flex"
          onClick={() => setIsNavbarOpen(true)}
        >
          <HamburgerIcon />
        </div>
      </div>
      <div className="hidden pl-6 md:block">
        <StakeTabs />
        <TunnelTabs />
      </div>
      <WalletConnection />
      <button
        className="flex size-8 cursor-pointer items-center
      justify-center rounded-lg border border-neutral-300/55 md:hidden"
        onClick={toggleMenu}
        type="button"
      >
        {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
      </button>
    </header>
  )
}
