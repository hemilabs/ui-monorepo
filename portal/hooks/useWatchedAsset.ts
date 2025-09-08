import { EvmToken } from 'types/token'
import useLocalStorageState from 'use-local-storage-state'
import { useAccount } from 'wagmi'

import { useHemi } from './useHemi'

// See https://github.com/hemilabs/wallet-watch-asset/blob/9ac4cef8ce57b90d350ebf029ad90b195257fc90/src/index.js#L36
export const useWatchedAsset = function (tokenAddress: EvmToken['address']) {
  const { address } = useAccount()
  const hemi = useHemi()
  const [storedKeys] = useLocalStorageState<string | undefined>(
    `watchedAssets:${address}`,
    {
      serializer: {
        parse: value => value,
        // Not really needed, but required to comply with the types.
        stringify: value => value as string,
      },
    },
  )
  return (
    !!storedKeys &&
    typeof storedKeys === 'string' &&
    storedKeys.includes(`${hemi.id}:${tokenAddress}`)
  )
}
