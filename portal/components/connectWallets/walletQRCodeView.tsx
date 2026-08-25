import { Button, ButtonLink } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { type EvmWalletData } from 'hooks/useAllWallets'
import { useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import Skeleton from 'react-loading-skeleton'
import { useConfig, useConnect } from 'wagmi'
import { getConnections } from 'wagmi/actions'

import { QrcodePlaceholderIcon } from './icons/qrcodePlaceholder'
import { getWalletConnectUri } from './utils/walletConnect'
import { getWalletDownloadUrl } from './utils/walletDownload'

// If no QR code URI is produced within this window, surface a retry option so
// the user is never stuck looking at an endless loading skeleton.
const qrCodeTimeoutMs = 15_000

type Props = {
  onBack: VoidFunction
  wallet: EvmWalletData
}

export function WalletQRCodeView({ onBack, wallet }: Props) {
  const t = useTranslations('connect-wallets')
  const tCommon = useTranslations('common')
  const [uri, setUri] = useState('')
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const config = useConfig()
  const { connect, connectors, reset } = useConnect()

  const downloadUrl = getWalletDownloadUrl(wallet)

  const retry = useCallback(function retry() {
    setRetryCount(count => count + 1)
  }, [])

  useEffect(
    // This function generates the WalletConnect URI when the component mounts
    // Please see https://github.com/rainbow-me/rainbowkit/discussions/2129
    function generateWalletConnectUri() {
      if (isMobile) {
        return undefined
      }

      // Prefer the wallet's own connector when it is a WalletConnect type so
      // that its dedicated storage / SDK instance is used instead of the
      // generic fallback. This avoids a mismatch between the connector that
      // owns the WalletConnect session state and the one the QR view is
      // driving (which would prevent `display_uri` from being emitted).
      const walletConnectConnector =
        wallet.connector?.type === 'walletConnect'
          ? wallet.connector
          : connectors.find(({ id }) => id === 'walletConnect')

      if (!walletConnectConnector) {
        return undefined
      }

      let cancelled = false
      setUri('')
      setHasTimedOut(false)

      const timeoutId = window.setTimeout(function markTimedOut() {
        if (!cancelled) {
          setHasTimedOut(true)
        }
      }, qrCodeTimeoutMs)

      async function startConnection(
        connector: NonNullable<typeof walletConnectConnector>,
      ) {
        // A previous visit may leave a WalletConnect session cached in the
        // provider storage. This is common in browsers that ship their own
        // wallet (e.g. Brave). wagmi skips creating a new pairing while such a
        // session exists, so no `display_uri` is emitted and the QR code never
        // appears (the skeleton stays forever). Tear down the stale session
        // first so a fresh pairing, and therefore a fresh URI, is generated.
        // The disconnect publishes to the relay and can stall when it is
        // unreachable, so it is capped with a short race to never block the URI
        // generation below.
        try {
          const provider = await connector.getProvider()
          // @ts-expect-error - provider session type isn't inferred
          if (provider?.session) {
            await Promise.race([
              connector.disconnect(),
              new Promise(resolve => window.setTimeout(resolve, 3_000)),
            ])
          }
        } catch {
          // Ignore and still attempt to connect below.
        }

        if (cancelled) {
          return
        }

        // Generate WalletConnect URI. The listener is attached before starting
        // the connection so the `display_uri` event is not missed.
        getWalletConnectUri(connector)
          .then(function (generatedUri) {
            if (cancelled) {
              return
            }
            setUri(generatedUri)
            if (generatedUri) {
              window.clearTimeout(timeoutId)
            }
          })
          .catch(function () {
            if (!cancelled) {
              setUri('')
            }
          })

        // Start connection
        connect({ connector })
      }

      startConnection(walletConnectConnector)

      return function cleanup() {
        cancelled = true
        window.clearTimeout(timeoutId)
        // Only tear down the pairing when this WalletConnect connector did not
        // end up connected. Checking this connector's own active connection
        // (instead of the global account status) avoids leaving a dangling
        // pairing when a different connector happens to be connected or
        // reconnecting at this moment.
        const isConnected = getConnections(config).some(
          connection => connection.connector.uid === walletConnectConnector.uid,
        )
        if (!isConnected) {
          walletConnectConnector.disconnect?.()
        }
        reset()
      }
    },
    [config, connect, connectors, reset, retryCount, wallet],
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
        <div className="hidden size-full items-center justify-center rounded-md bg-neutral-50/80 shadow-bs md:flex">
          {uri ? (
            <QRCodeSVG size={240} value={uri} />
          ) : hasTimedOut ? (
            <div className="flex flex-col items-center gap-3 p-4 text-center">
              <p className="text-sm text-neutral-500">{t('qr-code-error')}</p>
              <Button onClick={retry} size="xSmall" variant="secondary">
                {tCommon('try-again')}
              </Button>
            </div>
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
