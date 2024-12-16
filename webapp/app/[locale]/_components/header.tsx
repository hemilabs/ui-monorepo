import { CloseIcon } from 'components/icons/closeIcon'
import { HamburgerIcon } from 'components/icons/hamburgerIcon'
import { Link } from 'components/link'
import { TunnelTabs } from 'components/tunnelTabs'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import dynamic from 'next/dynamic'
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

export const Header = function ({ isMenuOpen, toggleMenu }: Props) {
  const href = useTunnelOperationByConnectedWallet()
  return (
    <header
      className="md:h-17 md:py-4.5 flex h-14 items-center border-b border-solid
     border-neutral-300/55 bg-white px-3 py-3 md:bg-transparent md:px-0"
    >
      <div className="h-6 w-6 md:hidden">
        <Link href={href}>
          <HemiSymbol />
        </Link>
      </div>
      <div className="hidden pl-6 md:block">
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
