import { ConnectedChains } from 'components/connectedWallet/connectedChains'

export const Footer = () => (
  <footer className="flex h-14 w-full items-center justify-center border-t border-neutral-300 md:hidden">
    <ConnectedChains />
  </footer>
)
