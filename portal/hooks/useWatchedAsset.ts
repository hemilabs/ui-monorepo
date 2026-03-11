import { EvmToken } from 'types/token'
import useLocalStorageState from 'use-local-storage-state'
import { useAccount } from 'wagmi'

import { useHemi } from './useHemi'

// Storage key format matches @hemilabs/wallet-watch-asset
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
