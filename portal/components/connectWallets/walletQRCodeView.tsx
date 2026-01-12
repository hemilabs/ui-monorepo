import { ButtonLink } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { type WalletData } from 'hooks/useAllWallets'
import { useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { isMobile, isAndroid, isIOS } from 'react-device-detect'
import Skeleton from 'react-loading-skeleton'
import { useConnect } from 'wagmi'

import { QrcodePlaceholderIcon } from './icons/qrcodePlaceholder'
import { getWalletConnectUri } from './utils/walletConnect'

function getMobileDownloadUrl(downloadUrls: WalletData['downloadUrls']) {
  if (!downloadUrls) {
    return undefined
  }
  if (isIOS && downloadUrls.ios) {
    return downloadUrls.ios
  }
  if (isAndroid && downloadUrls.android) {
    return downloadUrls.android
  }

  return downloadUrls.mobile || downloadUrls.browserExtension
}

function getDesktopDownloadUrl(downloadUrls: WalletData['downloadUrls']) {
  if (!downloadUrls) {
    return undefined
  }

  return (
    downloadUrls.browserExtension || downloadUrls.chrome || downloadUrls.firefox
  )
}

function getWalletDownloadUrl(item: WalletData) {
  const { downloadUrls } = item

  if (!downloadUrls) {
    // If there is no download URL provided by the connector,
    // the only option left is the generic walletConnect
    const devices = isMobile ? 'Mobile' : 'Desktop,Web,Browser Extension'

    return `https://walletguide.walletconnect.network/?devices=${encodeURIComponent(
      devices,
    )}`
  }

  return isMobile
    ? getMobileDownloadUrl(downloadUrls)
    : getDesktopDownloadUrl(downloadUrls)
}

type Props = {
  onBack: VoidFunction
  wallet: WalletData
}

export function WalletQRCodeView({ onBack, wallet }: Props) {
  const t = useTranslations('connect-wallets')
  const [uri, setUri] = useState('')
  const { connect, connectors } = useConnect()

  const downloadUrl = getWalletDownloadUrl(wallet)

  useEffect(
    // This function generates the WalletConnect URI when the component mounts
    // Please see https://github.com/rainbow-me/rainbowkit/discussions/2129
    function generateWalletConnectUri() {
      if (isMobile) {
        return undefined
      }

      const walletConnectConnector = connectors.find(
        ({ id }) => id === 'walletConnect',
      )

      if (!walletConnectConnector) {
        return undefined
      }

      // Generate WalletConnect URI
      getWalletConnectUri(walletConnectConnector)
        .then(setUri)
        .catch(() => setUri(''))

      // Start connection
      connect({ connector: walletConnectConnector })

      return function cleanup() {
        walletConnectConnector.disconnect?.()
      }
    },
    [connect, connectors],
  )

  return (
    <>
      <div className="flex items-center gap-2 md:justify-between">
        <button
          className="group text-neutral-600 hover:text-neutral-950"
          onClick={onBack}
        >
          <Chevron.Left className="size-5 group-hover:[&>path]:fill-neutral-950" />
        </button>
        <h4 className="flex-1 text-center text-neutral-500 md:flex-none">
          <span className="md:hidden">
            {t('dont-have', { wallet: wallet.name })}
          </span>
          <span className="hidden md:inline">
            {t('scan-with', { wallet: wallet.name })}
          </span>
        </h4>
        <div className="hidden md:block">
          <QrcodePlaceholderIcon />
        </div>
      </div>
      <div className="flex h-full flex-col items-center justify-center gap-3 py-3.5">
        <div className="shadow-bs hidden size-full items-center justify-center rounded-md bg-neutral-50/80 md:flex">
          {uri ? (
            <QRCodeSVG size={240} value={uri} />
          ) : (
            <Skeleton className="size-60" />
          )}
        </div>

        {downloadUrl && (
          <div className="flex w-full flex-col items-center gap-4 px-1 md:flex-row md:justify-between">
            <h4 className="hidden text-neutral-500 md:block">
              {t('dont-have', { wallet: wallet.name })}
            </h4>
            <ButtonLink href={downloadUrl} size="xSmall" variant="secondary">
              {t('get')}
            </ButtonLink>
          </div>
        )}
      </div>
    </>
  )
}
