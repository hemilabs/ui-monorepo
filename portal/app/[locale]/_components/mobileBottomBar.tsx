'use client'

import { ButtonIcon } from 'components/button'
import { CloseIcon } from 'components/icons/closeIcon'
import { HamburgerIcon } from 'components/icons/hamburgerIcon'
import dynamic from 'next/dynamic'

const WalletConnection = dynamic(
  () => import('components/connectWallets').then(mod => mod.WalletConnection),
  { loading: () => <div className="flex-1" />, ssr: false },
)

type Props = {
  closeMenu: VoidFunction
  isMobileViewport: boolean
  isMenuOpen: boolean
  openMenu: VoidFunction
}

export const MobileBottomBar = ({
  closeMenu,
  isMenuOpen,
  isMobileViewport,
  openMenu,
}: Props) => (
  <div
    className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center
      border-t border-neutral-300/55 bg-white px-3 sm:hidden"
  >
    {isMobileViewport && <WalletConnection placement="bottom-bar" />}
    <div className="ml-auto">
      <ButtonIcon
        onClick={isMenuOpen ? closeMenu : openMenu}
        onMouseDown={e => e.nativeEvent.stopImmediatePropagation()}
        onTouchStart={e => e.nativeEvent.stopImmediatePropagation()}
        size="xSmall"
        type="button"
        variant="secondary"
      >
        {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
      </ButtonIcon>
    </div>
  </div>
)
