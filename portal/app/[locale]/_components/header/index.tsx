import { GenesisDropTabs } from 'app/[locale]/genesis-drop/_components/genesisDropTabs'
import { ButtonIcon } from 'components/button'
import { CloseIcon } from 'components/icons/closeIcon'
import { HamburgerIcon } from 'components/icons/hamburgerIcon'
import { StakeTabs } from 'components/stakeTabs'
import { TunnelTabs } from 'components/tunnelTabs'
import dynamic from 'next/dynamic'
import { Dispatch, SetStateAction } from 'react'

import { Badge } from '../badge'

import { HomeLink } from './homeLink'

const WalletConnection = dynamic(
  () => import('components/connectWallets').then(mod => mod.WalletConnection),
  {
    loading: () => <div className="ml-auto" />,
    ssr: false,
  },
)

type Props = {
  isMenuOpen: boolean
  setIsNavbarOpen: Dispatch<SetStateAction<boolean>>
  toggleMenu: () => void
}

export const Header = ({ isMenuOpen, setIsNavbarOpen, toggleMenu }: Props) => (
  <header
    className="md:h-13 md:py-4.5 flex h-14 items-center border-b border-solid
     border-neutral-300/55 bg-white px-3 py-3 md:bg-transparent md:px-0"
  >
    <div className="flex items-center gap-x-2 md:hidden">
      <HomeLink />
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
      <GenesisDropTabs />
    </div>
    <WalletConnection />
    <div className="md:hidden">
      <ButtonIcon
        onClick={toggleMenu}
        size="xSmall"
        type="button"
        variant="secondary"
      >
        {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
      </ButtonIcon>
    </div>
  </header>
)
