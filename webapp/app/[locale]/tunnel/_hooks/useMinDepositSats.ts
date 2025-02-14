import { useQuery } from '@tanstack/react-query'
import { useBitcoin } from 'hooks/useBitcoin'
import { useHemiClient } from 'hooks/useHemiClient'
import { getVaultAddressByIndex } from 'utils/hemiMemoized'
import { formatUnits } from 'viem'

export const useMinDepositSats = function () {
  const bitcoin = useBitcoin()
  const hemiClient = useHemiClient()

  const { data: minDepositSats, ...rest } = useQuery({
    queryFn: () =>
      hemiClient
        .getVaultChildIndex()
        .then(vaultIndex => getVaultAddressByIndex(hemiClient, vaultIndex))
        .then(vaultAddress =>
          hemiClient.getMinimumDepositSats({ vaultAddress }),
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
