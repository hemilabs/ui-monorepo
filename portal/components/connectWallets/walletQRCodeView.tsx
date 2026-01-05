import { Button } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { type WalletData } from 'hooks/useAllWallets'
import { useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { isMobile, isAndroid, isIOS } from 'react-device-detect'
import Skeleton from 'react-loading-skeleton'
import { useConnect } from 'wagmi'

import { QrcodePlaceholderIcon } from './icons/qrcodePlaceholder'

function getWalletDownloadUrl(item: WalletData) {
  const { downloadUrls } = item

  if (!downloadUrls) {
    return undefined
  }

  if (isMobile) {
    if (isIOS && downloadUrls.ios) {
      return downloadUrls.ios
    }
    if (isAndroid && downloadUrls.android) {
      return downloadUrls.android
    }
    if (downloadUrls.mobile) {
      return downloadUrls.mobile
    }
  }

  return (
    downloadUrls.browserExtension || downloadUrls.chrome || downloadUrls.firefox
  )
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

      const abortController = new AbortController()
      const walletConnectConnector = connectors.find(
        ({ id }) => id === 'walletConnect',
      )

      if (!walletConnectConnector) {
        return undefined
      }

      let provider: unknown = null
      const listenForWalletConnectUri = async function () {
        try {
          provider = await walletConnectConnector.getProvider()

          // @ts-expect-error - Ts can't infer it
          provider.once('display_uri', function (value: string) {
            if (!abortController.signal.aborted) {
              setUri(value)
            }
          })

          connect({ connector: walletConnectConnector })
        } catch {
          setUri('')
        }
      }

      listenForWalletConnectUri()

      return function cleanup() {
        abortController.abort()
        if (provider) {
          // @ts-expect-error - Ts can't infer it
          provider.removeAllListeners?.()
        }
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
          <Chevron.Left className="group-hover:[&>path]:fill-neutral-950" />
        </button>

        <h4 className="flex-1 text-center text-neutral-500 md:flex-none">
          {t('scan-with', { wallet: wallet.name })}
        </h4>
        <div className="hidden md:block">
          <QrcodePlaceholderIcon />
        </div>
      </div>

      <div className="flex h-full flex-col items-center justify-center gap-4 py-3">
        <div className="shadow-bs hidden size-full items-center justify-center rounded-md bg-neutral-50/80 md:flex">
          {uri ? (
            <QRCodeSVG size={240} value={uri} />
          ) : (
            <Skeleton className="size-60" />
          )}
        </div>

        {downloadUrl && (
          <div className="flex w-full flex-col items-center gap-4 md:flex-row md:justify-between">
            <h4 className="text-center text-neutral-500 md:text-left">
              {t('dont-have', { wallet: wallet.name })}
            </h4>

            <Button
              onClick={() =>
                window.open(downloadUrl, '_blank', 'noopener,noreferrer')
              }
              size="xSmall"
              type="submit"
              variant="secondary"
            >
              {t('get')}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
