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
  isMenuOpen: boolean
  openMenu: VoidFunction
}

export const MobileBottomBar = ({ closeMenu, isMenuOpen, openMenu }: Props) => (
  <div
    className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center
      border-t border-neutral-300/55 bg-white px-3 sm:hidden"
  >
    <WalletConnection placement="bottom-bar" />
    <div className="ml-auto">
      {/* When opening (hamburger): stopImmediatePropagation blocks
       * useOnClickOutside on any open drawer so it doesn't close on the
       * same mousedown that opens the menu.
       * When closing (X): propagation is allowed so the navbar Drawer's
       * useOnClickOutside detects the click outside and plays its closing
       * animation; closeMenu only changes the button icon.
       */}
      <ButtonIcon
        onClick={isMenuOpen ? closeMenu : openMenu}
        onMouseDown={
          isMenuOpen ? undefined : e => e.nativeEvent.stopImmediatePropagation()
        }
        onTouchStart={
          isMenuOpen ? undefined : e => e.nativeEvent.stopImmediatePropagation()
        }
        size="xSmall"
        type="button"
        variant="secondary"
      >
        {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
      </ButtonIcon>
    </div>
  </div>
)
