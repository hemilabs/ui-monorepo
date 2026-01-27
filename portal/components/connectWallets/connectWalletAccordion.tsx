import { AnalyticsEvent } from 'app/analyticsEvents'
import { Chevron } from 'components/icons/chevron'
import { OrangeCheckIcon } from 'components/icons/orangeCheckIcon'
import { Tooltip } from 'components/tooltip'
import { useUmami } from 'hooks/useUmami'
import { useTranslations } from 'next-intl'
import { ReactNode, useState } from 'react'

import { DownloadIcon } from './icons/download'

// Base type for any wallet in the accordion
type WalletItem = {
  downloadUrls?: {
    android?: string
    chrome?: string
    ios?: string
  }
  id: string
  installed: boolean
  name: string
}

// Visual state for a wallet item
export type WalletItemState = {
  showCheck: boolean
  showInstall: boolean
}

type Props<T extends WalletItem> = {
  event: AnalyticsEvent
  getWalletState: (wallet: T) => WalletItemState
  icon: ReactNode
  // Returns boolean or Promise<boolean> indicating if detail view should be shown
  // If not provided or returns true, and renderDetailView exists, detail view is shown
  onConnect: (wallet: T) => boolean | Promise<boolean> | void
  // Optional - if provided, enables detail view (e.g., QR code for EVM)
  renderDetailView?: (wallet: T, onBack: VoidFunction) => ReactNode
  renderLogo: (wallet: T) => ReactNode
  text: string
  wallets: T[]
}

export function ConnectWalletAccordion<T extends WalletItem>({
  event,
  getWalletState,
  icon,
  onConnect,
  renderDetailView,
  renderLogo,
  text,
  wallets,
}: Props<T>) {
  const { track } = useUmami()
  const t = useTranslations('connect-wallets')
  const [isOpen, setIsOpen] = useState(true)
  const [selectedWallet, setSelectedWallet] = useState<T | null>(null)

  const handleClick = function () {
    track?.(event)
    setIsOpen(!isOpen)
  }

  const handleWalletClick = async function (wallet: T) {
    const result = await onConnect(wallet)

    // If onConnect returns true (or void) and renderDetailView exists, show detail view
    // This allows EVM wallets to show QR code after initiating connection
    // If onConnect returns false, don't show detail view (e.g., direct connection succeeded)
    if (renderDetailView && result !== false) {
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

  const showDetailView = selectedWallet && renderDetailView

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
            <Chevron.Bottom className="size-5 group-hover:[&>path]:fill-neutral-950" />
          ) : (
            <Chevron.Right className="size-5 group-hover:[&>path]:fill-neutral-950" />
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
              showDetailView ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            <h4 className="mb-3 mt-1 text-neutral-500">{t('wallets')}</h4>
            <div className="flex gap-2 overflow-x-auto p-1 md:grid md:grid-cols-3 md:overflow-x-visible md:p-0">
              {sortedWallets.map(function (wallet) {
                const { showCheck, showInstall } = getWalletState(wallet)

                return (
                  <button
                    className="size-30 group relative mb-2 flex shrink-0 flex-col items-center justify-center gap-2 rounded-lg bg-neutral-50/80 p-2 transition-shadow duration-300 hover:shadow-sm md:mb-0"
                    key={wallet.id}
                    onClick={() => handleWalletClick(wallet)}
                  >
                    {showCheck && (
                      <div className="absolute right-2 top-2">
                        <Tooltip
                          borderRadius="6px"
                          id="wallet-installed"
                          text={t('installed')}
                          variant="simple"
                        >
                          <OrangeCheckIcon size="small" />
                        </Tooltip>
                      </div>
                    )}
                    <div className="size-14">{renderLogo(wallet)}</div>
                    <span className="text-center text-sm font-medium text-neutral-950">
                      {wallet.name}
                    </span>
                    {showInstall && (
                      <div className="group-hover:backdrop-blur-2 absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 opacity-0 transition-all duration-300 group-hover:opacity-100">
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
          {renderDetailView && (
            <div
              className={`absolute inset-0 m-4 transition-transform duration-300 ${
                showDetailView ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              {selectedWallet &&
                renderDetailView(selectedWallet, () => setSelectedWallet(null))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
