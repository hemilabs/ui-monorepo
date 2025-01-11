import { useQuery } from '@tanstack/react-query'
import { getBitcoinWithdrawalGracePeriod } from 'utils/hemi'

import { useHemiClient } from './useHemiClient'

export const useSimpleVaultGracePeriod = function () {
  const hemiClient = useHemiClient()
  const { data: vaultGracePeriod, ...rest } = useQuery({
    queryFn: () =>
      hemiClient
        .getVaultChildIndex()
        .then(vaultIndex =>
          getBitcoinWithdrawalGracePeriod({ hemiClient, vaultIndex }),
        ),
    queryKey: ['vault-grace-period', hemiClient.chain.id],
    refetchInterval: false,
  })
  return {
    ...rest,
    vaultGracePeriod,
  }
}
