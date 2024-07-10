import type { EvmToken } from 'types/token'
import type { WalletClient } from 'viem'

/**
 * Helper to let EIP-747 compatible wallets track ERC20 assets.
 *
 * After the first successful call, it will store a flag in the local storage of
 * the browser so multiple watch requests to the user are prevented.
 *
 * @todo Switch flags to EIP-3770 format: eth:0x1234...5678
 */
export function watchAsset(client: WalletClient, token: EvmToken) {
  // Tokens with invalid addresses, like native tokens, should be skipped.
  if (!token.address.startsWith('0x')) {
    return Promise.resolve(true)
  }

  // All assets watched by the user are stored concatenated in a single key.
  const key = `watchingAssets-${client.account.address}`
  const flag = `${token.address}:${token.chainId || client.chain.id}|`
  const value = window.localStorage.getItem(key) || ''

  if (value.includes(flag)) {
    return Promise.resolve(true)
  }

  // The call to wallet_watchAsset requires the image URL in the `image` prop.
  const options = { ...token, image: token.logoURI }
  return client.watchAsset({ options, type: 'ERC20' }).then(function (success) {
    if (success) {
      window.localStorage.setItem(key, value.concat(flag))
    }
    return success
  })
}
