import { ConnectedEvmChain } from 'components/connectedWallet/connectedAccount'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Fragment, useState } from 'react'
import { useAccount } from 'wagmi'

import { MetamaskLogo } from './metamaskLogo'

const ConnectWalletsDrawer = dynamic(
  () => import('./connectWalletsDrawer').then(mod => mod.ConnectWalletsDrawer),
  {
    ssr: false,
  },
)

const WalletIcon = () => (
  <svg fill="none" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.666 6H4.333a1.667 1.667 0 0 1 0-3.334h6.333v3.333Zm0 0h2.667v7.333H4.667a2 2 0 0 1-2-2V4.999"
      stroke="#000202"
      strokeLinecap="square"
      strokeWidth={1.333}
    />
    <path
      d="M10.333 10.25a.583.583 0 1 0 0-1.167.583.583 0 0 0 0 1.167Z"
      fill="#000202"
      stroke="#000202"
      strokeWidth={0.5}
    />
  </svg>
)

export const ConnectWallets = function () {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const t = useTranslations()

  const walletsConnected = []

  const { isConnected: isEvmWalletConnected } = useAccount()

  // TODO enable btc wallet connection https://github.com/BVM-priv/ui-monorepo/issues/339
  if (isEvmWalletConnected) {
    walletsConnected.push({ icon: <MetamaskLogo /> })
  }

  return (
    <div className="flex items-center gap-x-3">
      <div className="hidden md:block">
        {isEvmWalletConnected && <ConnectedEvmChain />}
      </div>
      <button
        className="flex h-10 items-center gap-x-2 rounded-xl border border-solid border-zinc-400/55 bg-white px-3 py-2 text-sm font-medium leading-normal shadow-sm"
        onClick={() => setIsDrawerOpen(true)}
      >
        {walletsConnected.length === 0 && (
          <>
            <WalletIcon />
            <span>{t('common.connect-wallets')}</span>
          </>
        )}
        {walletsConnected.length > 0 && (
          <>
            <div className="flex items-center justify-between rounded-full border border-solid border-orange-700/45 bg-orange-200 p-px">
              {walletsConnected.map(({ icon }, index) => (
                <Fragment key={index}>{icon}</Fragment>
              ))}
            </div>
            <span>
              {t('common.wallets-connected', {
                count: walletsConnected.length,
              })}
            </span>
          </>
        )}
      </button>
      {isDrawerOpen && (
        <ConnectWalletsDrawer closeDrawer={() => setIsDrawerOpen(false)} />
      )}
    </div>
  )
}
