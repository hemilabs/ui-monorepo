import { useQuery } from '@tanstack/react-query'
import { useHemiClient } from 'hooks/useHemiClient'
import { EvmToken } from 'types/token'
import { getVaultAddressByIndex } from 'utils/hemiMemoized'
import { formatUnits } from 'viem'

// Minimum withdrawal sats are formatted with the Hemi bitcoin erc20 instead of
// using the native representation of bitcoin. While both should work, this gives us
// more confidence if, for example, we deploy a new version of the Hemi bitcoin erc20
// with a different number of decimals. Besides, the Hemi Bitcoin does have a different name
// and symbol, so it would be less confusing to use it like this
export const useMinWithdrawalSats = function (hemiBitcoinToken: EvmToken) {
  const hemiClient = useHemiClient()

  const { data: minWithdrawalSats, ...rest } = useQuery({
    queryFn: () =>
      hemiClient
        .getVaultChildIndex()
        .then(vaultIndex => getVaultAddressByIndex(hemiClient, vaultIndex))
        .then(vaultAddress =>
          hemiClient.getMinimumWithdrawalSats({ vaultAddress }),
        ),
    // TODO may need to be updated when multi-vault support is added
    // See https://github.com/hemilabs/ui-monorepo/issues/393
    queryKey: [
      'bitcoin-min-withdrawal-sats',
      hemiBitcoinToken.address,
      hemiBitcoinToken.chainId,
    ],
  })

  return {
    minWithdrawalFormattedSats:
      minWithdrawalSats !== undefined
        ? formatUnits(minWithdrawalSats, hemiBitcoinToken.decimals)
        : '',
    minWithdrawalSats,
    ...rest,
  }
}
