import { ConnectedChains } from 'components/connectedWallet/connectedChains'

export const Footer = () => (
  <footer className="flex h-14 w-full items-center justify-center md:hidden">
    <ConnectedChains />
  </footer>
)
