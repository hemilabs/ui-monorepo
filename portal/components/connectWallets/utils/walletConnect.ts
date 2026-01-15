import { type Connector } from 'wagmi'

export const getWalletConnectUri = (connector: Connector): Promise<string> =>
  new Promise(function (resolve) {
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
        // @ts-expect-error - TS can't infer provider type
        provider.once('display_uri', function (uri: string) {
          resolve(uri)
        })
      })
      .catch(function () {
        resolve('')
      })
  })
