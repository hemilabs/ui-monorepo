import { useQuery } from '@tanstack/react-query'
import { getMinimumDepositSats } from 'hemi-viem/actions'
import { useBitcoin } from 'hooks/useBitcoin'
import { useHemiClient } from 'hooks/useHemiClient'
import { getVaultChildIndex } from 'utils/hemiClientExtraActions'
import { getVaultAddressByIndex } from 'utils/hemiMemoized'
import { formatUnits } from 'viem'

export const useMinDepositSats = function () {
  const bitcoin = useBitcoin()
  const hemiClient = useHemiClient()

  const { data: minDepositSats, ...rest } = useQuery({
    queryFn: () =>
      getVaultChildIndex(hemiClient)
        .then(vaultIndex => getVaultAddressByIndex(hemiClient, vaultIndex))
        .then(vaultAddress =>
          getMinimumDepositSats(hemiClient, { vaultAddress }),
        ),
    // TODO may need to be updated when multi-vault support is added
    // See https://github.com/hemilabs/ui-monorepo/issues/393
    queryKey: ['bitcoin-min-deposit-sats', bitcoin.id],
  })

  return {
    minDepositFormattedSats:
      minDepositSats !== undefined
        ? formatUnits(minDepositSats, bitcoin.nativeCurrency.decimals)
        : '',
    minDepositSats,
    ...rest,
  }
}
