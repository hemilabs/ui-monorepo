import { useQuery } from '@tanstack/react-query'
import { getBitcoinWithdrawalGracePeriod } from 'utils/hemi'
import { getBitcoinWithdrawalVaultIndex } from 'utils/hemiClientExtraActions'

import { useHemi } from './useHemi'
import { useHemiClient } from './useHemiClient'

export const useSimpleVaultGracePeriod = function () {
  const hemi = useHemi()
  const hemiClient = useHemiClient()
  return useQuery({
    queryFn: () =>
      getBitcoinWithdrawalVaultIndex(hemiClient).then(vaultIndex =>
        getBitcoinWithdrawalGracePeriod({ hemiClient, vaultIndex }),
      ),
    queryKey: ['vault-grace-period', hemi.id],
    refetchInterval: false,
  })
}
