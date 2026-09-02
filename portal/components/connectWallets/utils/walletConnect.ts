import { type Connector } from 'wagmi'

type WalletConnectUriRequest = {
  cancel: VoidFunction
  promise: Promise<string>
}

export const getWalletConnectUri = function (
  connector: Connector,
): WalletConnectUriRequest {
  let removeListener: VoidFunction | undefined

  const promise = new Promise<string>(function (resolve) {
    connector
      .getProvider()
      .then(function (provider) {
        // Special case for Coinbase wallet
        if (connector.id === 'coinbase') {
          // @ts-expect-error - Coinbase provider has qrUrl
          const qrUrl = provider.qrUrl
          resolve(qrUrl || '')
          return
        }

        // Standard WalletConnect flow
        function onDisplayUri(uri: string) {
          resolve(uri)
        }
        // @ts-expect-error - TS can't infer provider type
        provider.once('display_uri', onDisplayUri)
        removeListener = () =>
          // @ts-expect-error - TS can't infer provider type
          provider.removeListener('display_uri', onDisplayUri)
      })
      .catch(function () {
        resolve('')
      })
  })

  return {
    cancel: () => removeListener?.(),
    promise,
  }
}
