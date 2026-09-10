import { useQuery } from '@tanstack/react-query'
import { type BtcChain } from 'btc-wallet/chains'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { isAddressOfBitcoinNetwork } from 'utils/bitcoin'
import { isValidBtcAddress } from 'utils/hemi'

export const useIsValidBtcAddress = function ({
  address,
  enabled,
  network,
}: {
  address: string
  enabled: boolean
  network: BtcChain['id']
}) {
  const hemi = useHemi()
  const hemiClient = useHemiClient()

  return useQuery({
    enabled: enabled && address !== '',
    queryFn: () =>
      isAddressOfBitcoinNetwork(address, network)
        ? isValidBtcAddress(hemiClient, address)
        : Promise.resolve(false),
    queryKey: ['is-valid-btc-address', hemi.id, network, address],
    staleTime: Infinity,
  })
}
