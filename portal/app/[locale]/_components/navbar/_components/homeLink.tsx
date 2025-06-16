import { Link } from 'components/link'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import { ComponentProps, Suspense } from 'react'

import { HemiLogoFull } from './hemiLogo'

const UI = ({ href }: Pick<ComponentProps<typeof Link>, 'href'>) => (
  <Link className="w-full" href={href}>
    <HemiLogoFull />
  </Link>
)

const HemiLogoImpl = function () {
  const href = useTunnelOperationByConnectedWallet()

  return <UI href={href} />
}

export const HomeLink = () => (
  // The logo link redirects to the tunnel page, but defining which operation to return to
  // (Deposit, Withdraw, etc.) depending on the connected wallet. In the initial render,
  // There is no connected wallet, so it will redirect to the tunnel page. After hydration, the
  // appropriate query string will be applied. This allow us to statically render this logo
  <Suspense fallback={<UI href="/tunnel" />}>
    <HemiLogoImpl />
  </Suspense>
)
