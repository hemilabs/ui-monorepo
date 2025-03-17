import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useDrawerContext } from 'hooks/useDrawerContext'
import { useNetworkType } from 'hooks/useNetworkType'
import { useUmami } from 'hooks/useUmami'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { walletIsConnected } from 'utils/wallet'
import { useAccount as useEvmAccount } from 'wagmi'

import { ConnectedChains } from '../connectedWallet/connectedChains'

import { MetamaskLogo } from './metamaskLogo'
import { UnisatLogo } from './unisatLogo'

const ConnectWalletsDrawer = dynamic(
  () => import('./connectWalletsDrawer').then(mod => mod.ConnectWalletsDrawer),
  {
    ssr: false,
  },
)

const WalletIcon = () => (
  <svg fill="none" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v.401a2.986 2.986 0 0 0-1.5-.401h-9c-.546 0-1.059.146-1.5.401V3.5ZM3.5 5A1.5 1.5 0 0 0 2 6.5v.401A2.986 2.986 0 0 1 3.5 6.5h9c.546 0 1.059.146 1.5.401V6.5A1.5 1.5 0 0 0 12.5 5h-9ZM8 10a2 2 0 0 0 1.938-1.505c.068-.268.286-.495.562-.495h2A1.5 1.5 0 0 1 14 9.5v3a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-3A1.5 1.5 0 0 1 3.5 8h2c.276 0 .494.227.562.495A2 2 0 0 0 8 10Z"
      fill="#0A0A0A"
    />
  </svg>
)

export const WalletConnection = function () {
  const { closeDrawer, isDrawerOpen, openDrawer } = useDrawerContext()
  const [networkType] = useNetworkType()
  const t = useTranslations()

  const { status: btcStatus } = useBtcAccount()
  const { status: evmStatus } = useEvmAccount()
  const { track } = useUmami()

  const walletsConnected = []
  if (walletIsConnected(evmStatus)) {
    walletsConnected.push({ icon: <MetamaskLogo /> })
  }
  if (walletIsConnected(btcStatus)) {
    walletsConnected.push({ icon: <UnisatLogo /> })
  }

  const onConnectWalletsClick = function () {
    openDrawer()
    track?.('connect wallets', { chain: networkType })
  }

  return (
    <div className="ml-auto mr-2 md:mr-6">
      <div className="flex items-center gap-x-3">
        <div className="hidden md:block">
          <ConnectedChains />
        </div>
        <button
          className="flex h-8 items-center gap-x-2 rounded-lg border border-solid border-neutral-300/55 bg-white 
          py-1.5 pl-2 pr-4 text-sm font-medium shadow-sm hover:bg-neutral-100"
          onClick={onConnectWalletsClick}
        >
          {walletsConnected.length === 0 && (
            <>
              <WalletIcon />
              <span>{t('common.connect-wallets')}</span>
            </>
          )}
          {walletsConnected.length > 0 && (
            <div className="flex items-center justify-between gap-x-1 border-neutral-500/55">
              {walletsConnected.map(({ icon }, index) => (
                <div
                  className="flex items-center justify-center rounded-full border border-solid p-1"
                  key={index}
                >
                  {icon}
                </div>
              ))}
              <span>
                {t('common.wallets-connected', {
                  count: walletsConnected.length,
                })}
              </span>
            </div>
          )}
        </button>
        {isDrawerOpen && <ConnectWalletsDrawer closeDrawer={closeDrawer} />}
      </div>
    </div>
  )
}
