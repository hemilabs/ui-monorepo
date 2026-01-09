import { useQuery } from '@tanstack/react-query'
import { getBitcoinWithdrawalGracePeriod } from 'utils/hemi'
import { getVaultChildIndex } from 'utils/hemiClientExtraActions'

import { useHemi } from './useHemi'
import { useHemiClient } from './useHemiClient'

export const useSimpleVaultGracePeriod = function () {
  const hemi = useHemi()
  const hemiClient = useHemiClient()
  return useQuery({
    queryFn: () =>
      getVaultChildIndex(hemiClient).then(vaultIndex =>
        getBitcoinWithdrawalGracePeriod({ hemiClient, vaultIndex }),
      ),
    queryKey: ['vault-grace-period', hemi.id],
    refetchInterval: false,
  })
}
