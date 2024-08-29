import dynamic from 'next/dynamic'
import Link from 'next-intl/link'
import { CloseIcon } from 'ui-common/components/closeIcon'
import { HamburgerIcon } from 'ui-common/components/hamburgerIcon'
import { HemiSymbol } from 'ui-common/components/hemiLogo'

// Use CSR because of useWindowSize() hook internally
const WalletConnection = dynamic(
  () =>
    import('app/components/connectWallets').then(mod => mod.WalletConnection),
  {
    ssr: false,
  },
)

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
    <WalletConnection isMenuOpen={isMenuOpen} />
  </header>
)
