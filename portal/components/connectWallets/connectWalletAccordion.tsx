import { AnalyticsEvent } from 'app/analyticsEvents'
import { Chevron } from 'components/icons/chevron'
import { OrangeCheckIcon } from 'components/icons/orangeCheckIcon'
import { type WalletData } from 'hooks/useAllWallets'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { ReactNode, useState } from 'react'
import { useConnect } from 'wagmi'

import { EvmWalletLogo } from './evmWalletLogo'
import { DownloadIcon } from './icons/download'
import { WalletQRCodeView } from './walletQRCodeView'

// These are the connector types that require a QR code to connect
const qrCodeConnectorTypes = ['walletConnect', 'binanceWallet']

function getWalletState(wallet: WalletData) {
  const hasConnector = !!wallet.connector
  const needsQRCode = wallet.connector?.type
    ? qrCodeConnectorTypes.includes(wallet.connector.type)
    : false

  return {
    canConnectDirectly: hasConnector && !needsQRCode,
    hasConnector,
    needsQRCode,
    showCheck: hasConnector && !needsQRCode,
    showInstall: !hasConnector || needsQRCode,
  }
}

type Props = {
  event: AnalyticsEvent
  icon: ReactNode
  text: string
  wallets: WalletData[]
}

export const ConnectWalletAccordion = function ({
  event,
  icon,
  text,
  wallets,
}: Props) {
  const { track } = useUmami()
  const t = useTranslations('connect-wallets')
  const [isOpen, setIsOpen] = useState(true)
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null)
  const { connect } = useConnect()

  const handleClick = function () {
    track?.(event)
    setIsOpen(!isOpen)
  }

  function handleWalletConnect(wallet: WalletData) {
    const { canConnectDirectly } = getWalletState(wallet)

    if (canConnectDirectly) {
      if (wallet.connector) {
        connect({ connector: wallet.connector })
      }
    } else {
      setSelectedWallet(wallet)
    }
  }

  const sortedWallets = [...wallets].sort(function (a, b) {
    const aState = getWalletState(a)
    const bState = getWalletState(b)

    if (aState.showCheck && !bState.showCheck) {
      return -1
    }
    if (!aState.showCheck && bState.showCheck) {
      return 1
    }

    return 0
  })

  return (
    <div className="rounded-lg bg-white shadow-sm">
      <button
        className="hover:bg-connect-wallet-hovered group flex w-full cursor-pointer items-center gap-x-2 p-4"
        onClick={handleClick}
      >
        {icon}
        <span className="text-base font-medium text-neutral-950">{text}</span>
        <div className="group ml-auto">
          {isOpen ? (
            <Chevron.Bottom className="group-hover:[&>path]:fill-neutral-950" />
          ) : (
            <Chevron.Right className="group-hover:[&>path]:fill-neutral-950" />
          )}
        </div>
      </button>

      <div
        className={`h-px border-t border-neutral-300/55 ${
          isOpen ? 'block' : 'hidden'
        }`}
      />
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-120' : 'max-h-0'
        }`}
      >
        <div className="relative overflow-hidden">
          <div
            className={`p-3 transition-transform duration-300 ${
              selectedWallet ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            <h4 className="mb-3 mt-1 text-neutral-500">{t('wallets')}</h4>
            <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-x-visible md:pb-0">
              {sortedWallets.map(function (wallet) {
                const { showCheck, showInstall } = getWalletState(wallet)

                return (
                  <button
                    className="size-30 group relative flex shrink-0 flex-col items-center justify-center gap-2 rounded-lg bg-neutral-50/80 p-2 transition-shadow duration-300 hover:shadow-sm"
                    key={wallet.id}
                    onClick={() => handleWalletConnect(wallet)}
                  >
                    {showCheck && (
                      <div className="absolute right-2 top-2">
                        <OrangeCheckIcon size="small" />
                      </div>
                    )}
                    <EvmWalletLogo
                      className="size-14"
                      walletName={wallet.name}
                    />
                    <span className="text-center text-sm font-medium text-neutral-950">
                      {wallet.name}
                    </span>
                    {showInstall && (
                      <div className="group-hover:backdrop-blur-px absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 opacity-0 transition-all duration-300 group-hover:opacity-100">
                        <div className="flex items-center gap-1 text-orange-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <DownloadIcon />
                          <span className="text-sm font-semibold">
                            {t('install')}
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          <div
            className={`absolute inset-0 m-4 transition-transform duration-300 ${
              selectedWallet ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {selectedWallet && (
              <WalletQRCodeView
                onBack={() => setSelectedWallet(null)}
                wallet={selectedWallet}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
