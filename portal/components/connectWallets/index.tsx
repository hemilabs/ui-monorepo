import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { Button } from 'components/button'
import { DrawerLoader } from 'components/drawer/drawerLoader'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useUmami } from 'hooks/useUmami'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'
import { walletIsConnected } from 'utils/wallet'
import { useAccount as useEvmAccount } from 'wagmi'

import { EvmWalletLogo } from './evmWalletLogo'
import { UnisatLogo } from './unisatLogo'

const ConnectWalletsDrawer = dynamic(
  () => import('./connectWalletsDrawer').then(mod => mod.ConnectWalletsDrawer),
  {
    loading: () => <DrawerLoader className="h-[55dvh] md:h-full" />,
    ssr: false,
  },
)

const WalletIcon = (props: ComponentProps<'svg'>) => (
  <svg
    fill="none"
    height={16}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v.401a2.986 2.986 0 0 0-1.5-.401h-9c-.546 0-1.059.146-1.5.401V3.5ZM3.5 5A1.5 1.5 0 0 0 2 6.5v.401A2.986 2.986 0 0 1 3.5 6.5h9c.546 0 1.059.146 1.5.401V6.5A1.5 1.5 0 0 0 12.5 5h-9ZM8 10a2 2 0 0 0 1.938-1.505c.068-.268.286-.495.562-.495h2A1.5 1.5 0 0 1 14 9.5v3a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-3A1.5 1.5 0 0 1 3.5 8h2c.276 0 .494.227.562.495A2 2 0 0 0 8 10Z"
      fill="currentColor"
    />
  </svg>
)

export const WalletConnection = function () {
  const { closeDrawer, isDrawerOpen, openDrawer } = useDrawerContext()
  const t = useTranslations()

  const { status: btcStatus } = useBtcAccount()
  const { connector, status: evmStatus } = useEvmAccount()
  const { track } = useUmami()

  const walletsConnected = []
  if (walletIsConnected(evmStatus)) {
    walletsConnected.push({
      icon: <EvmWalletLogo walletName={connector?.name} />,
    })
  }
  if (walletIsConnected(btcStatus)) {
    walletsConnected.push({ icon: <UnisatLogo className="h-4 w-4" /> })
  }

  const onConnectWalletsClick = function () {
    openDrawer()
    track?.('connect wallets')
  }

  return (
    <div className="ml-auto mr-2 md:mr-6">
      <div className="group flex items-center gap-x-3">
        <Button
          onClick={onConnectWalletsClick}
          size="xSmall"
          variant="secondary"
        >
          {walletsConnected.length === 0 && (
            <>
              <WalletIcon className="[&>path]:fill-neutral-500 [&>path]:transition-colors [&>path]:duration-200 [&>path]:group-hover:fill-neutral-950" />
              <span>{t('common.connect-wallets')}</span>
            </>
          )}
          {walletsConnected.length > 0 && (
            <div className="flex items-center justify-between gap-x-1">
              {walletsConnected.map(({ icon }, index) => (
                <div
                  className="flex h-4 w-4 items-center justify-center rounded-full"
                  key={index}
                >
                  {icon}
                </div>
              ))}
              <span className="ml-1">
                {t('common.wallets-connected', {
                  count: walletsConnected.length,
                })}
              </span>
            </div>
          )}
        </Button>
        {isDrawerOpen && <ConnectWalletsDrawer closeDrawer={closeDrawer} />}
      </div>
    </div>
  )
}
