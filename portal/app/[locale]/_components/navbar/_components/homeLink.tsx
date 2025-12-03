import { featureFlags } from 'app/featureFlags'
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
  const tunnelHref = useTunnelOperationByConnectedWallet()
  const href = featureFlags.enableBtcYieldPage ? '/btc-yield' : tunnelHref

  return <UI href={href} />
}

export const HomeLink = () => (
  // The logo link redirects based on feature flag. When btc yield page is enabled, it goes to
  // /btc-yield. Otherwise, it redirects to the tunnel page with the appropriate operation
  // (Deposit, Withdraw, etc.) based on the connected wallet. Initial render shows /tunnel as
  // fallback, with the correct href applied after hydration for static rendering.
  <Suspense
    fallback={
      <UI href={featureFlags.enableBtcYieldPage ? '/btc-yield' : '/tunnel'} />
    }
  >
    <HemiLogoImpl />
  </Suspense>
)
