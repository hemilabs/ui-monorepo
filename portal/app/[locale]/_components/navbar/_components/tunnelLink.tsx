import { TunnelIcon as BaseIcon } from 'components/icons/tunnelIcon'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { ComponentProps, Suspense } from 'react'

import { ItemLink } from './itemLink'

const ActionableOperations = dynamic(
  () =>
    import('components/actionableOperations').then(
      mod => mod.ActionableOperations,
    ),
  { ssr: false },
)

const UI = ({ href, icon, text }: ComponentProps<typeof ItemLink>) => (
  <ItemLink
    event="nav - tunnel"
    href={href}
    icon={icon}
    rightSection={
      <div className="ml-auto hidden md:block">
        {/* Initially users will be disconnected, so no need for a fallback here. */}
        <Suspense>
          <ActionableOperations />
        </Suspense>
      </div>
    }
    text={text}
  />
)

const TunnelIcon = () => (
  <div className="w-8 md:w-3">
    <BaseIcon />
  </div>
)

const TunnelLinkImpl = function (
  props: Omit<ComponentProps<typeof ItemLink>, 'href'>,
) {
  const [networkType] = useNetworkType()
  const href = useTunnelOperationByConnectedWallet()

  return (
    <UI
      href={{
        ...href,
        query: {
          ...href.query,
          ...(networkType === 'testnet' && { networkType }),
        },
      }}
      {...props}
    />
  )
}

export const TunnelLink = function () {
  const t = useTranslations('navbar')

  const text = t('tunnel')

  return (
    // The Tunnel link directs user to the tunnel page. However, if a wallet is connected,
    // query string is appended to redirect to the appropriate operation (Deposit, Withdraw, etc.).
    // Given statically there's no connected wallet, it will redirect to the default tunnel page.
    // On hydration, the query string will be updated to the appropriate operation.
    <Suspense
      fallback={<UI href="/tunnel" icon={<TunnelIcon />} text={text} />}
    >
      <TunnelLinkImpl icon={<TunnelIcon />} text={text} />
    </Suspense>
  )
}
