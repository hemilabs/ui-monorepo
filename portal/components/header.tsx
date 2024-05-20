import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next-intl/link'
import { CloseIcon } from 'ui-common/components/closeIcon'
import { HamburgerIcon } from 'ui-common/components/hamburgerIcon'
import { HemiSymbol } from 'ui-common/components/hemiLogo'

type Props = {
  isMenuOpen: boolean
  toggleMenu: () => void
}

export const Header = ({ isMenuOpen, toggleMenu }: Props) => (
  <header className="flex h-16 flex-row items-center border-b border-solid border-slate-100 bg-white px-5 py-3 md:h-auto md:border-b-0 md:bg-transparent md:px-0">
    <button
      className="cursor-pointer md:hidden"
      onClick={toggleMenu}
      type="button"
    >
      {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
    </button>
    <div className="ml-3 h-6 w-6 md:hidden">
      <Link href="/tunnel">
        <HemiSymbol />
      </Link>
    </div>
    <div className="ml-auto">
      <div className="ml-auto mr-8 hidden md:block xl:mr-12">
        <ConnectButton />
      </div>
      {/* Only visible in the mobile view, if the nav bar menu is not open */}
      <div className="md:hidden">{!isMenuOpen && <ConnectButton />}</div>
    </div>
  </header>
)
