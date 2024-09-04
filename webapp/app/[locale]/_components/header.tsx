import { CloseIcon } from 'components/icons/closeIcon'
import { HamburgerIcon } from 'components/icons/hamburgerIcon'
import dynamic from 'next/dynamic'
import Link from 'next-intl/link'
import { HemiSymbol } from 'ui-common/components/hemiLogo'

const WalletConnection = dynamic(
  () =>
    import('app/components/connectWallets').then(mod => mod.WalletConnection),
  {
    loading: () => <div className="ml-auto" />,
    ssr: false,
  },
)

type Props = {
  isMenuOpen: boolean
  toggleMenu: () => void
}

export const Header = ({ isMenuOpen, toggleMenu }: Props) => (
  <header className="flex h-14 items-center border-b border-solid border-slate-100 bg-white px-3 py-3 md:h-auto md:border-b-0 md:bg-transparent md:px-0">
    <div className="h-6 w-6 md:hidden">
      <Link href="/tunnel">
        <HemiSymbol />
      </Link>
    </div>
    <WalletConnection />
    <button
      className="flex h-8 w-8 cursor-pointer items-center
      justify-center rounded-lg border border-neutral-500/55 md:hidden"
      onClick={toggleMenu}
      type="button"
    >
      {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
    </button>
  </header>
)
