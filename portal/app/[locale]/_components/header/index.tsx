import { GenesisDropTabs } from 'app/[locale]/genesis-drop/_components/genesisDropTabs'
import { ButtonIcon } from 'components/button'
import { CloseIcon } from 'components/icons/closeIcon'
import { HamburgerIcon } from 'components/icons/hamburgerIcon'
import { StakeTabs } from 'components/stakeTabs'
import { TunnelTabs } from 'components/tunnelTabs'
import { lazy, Suspense } from 'react'

import { Badge } from '../badge'

import { HomeLink } from './homeLink'

const WalletConnection = lazy(() =>
  import('components/connectWallets').then(mod => ({
    default: mod.WalletConnection,
  })),
)

type Props = {
  isMenuOpen: boolean
  openNavbar: VoidFunction
  toggleMenu: VoidFunction
}

export const Header = ({ isMenuOpen, openNavbar, toggleMenu }: Props) => (
  <header className="flex h-14 items-center border-b border-solid border-neutral-300/55 bg-white px-3 py-3 md:h-13 md:bg-transparent md:px-0 md:py-4.5">
    <div className="flex items-center gap-x-2 md:hidden">
      <HomeLink />
      <Badge />
    </div>
    <div className="hidden size-13 items-center justify-center border-r border-neutral-300/55 md:flex xl:hidden">
      <ButtonIcon onClick={openNavbar} size="xSmall" variant="secondary">
        <HamburgerIcon />
      </ButtonIcon>
    </div>
    <div className="hidden pl-3 md:block">
      <StakeTabs />
      <TunnelTabs />
      <GenesisDropTabs />
    </div>
    <Suspense fallback={<div className="ml-auto" />}>
      <WalletConnection />
    </Suspense>
    <div className="hidden sm:flex md:hidden">
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
