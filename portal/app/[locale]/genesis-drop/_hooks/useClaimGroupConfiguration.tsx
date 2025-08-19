import { useQuery } from '@tanstack/react-query'
import { type LockupMonths, lockupOptions } from 'genesis-drop-actions'
import { getClaimGroupConfiguration } from 'genesis-drop-actions/actions'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'

const bonusMap: Record<LockupMonths, number> = {
  [lockupOptions.sixMonths]: 0,
  [lockupOptions.twoYears]: 5,
  [lockupOptions.fourYears]: 10,
}

export const useClaimGroupConfiguration = function ({
  claimGroupId,
  lockupMonths,
}: {
  claimGroupId: number
  lockupMonths: LockupMonths | undefined
}) {
  const hemi = useHemi()
  const hemiClient = useHemiClient()

  return useQuery({
    enabled: lockupMonths !== undefined,
    // use initial data hardcoded so we get a straight render of the bonus,
    // but by using react-query we can revalidate in the background the bonuses on-chain
    // current claim tokens only supports lockup ratio of 50
    initialData: lockupMonths
      ? { bonus: bonusMap[lockupMonths], lockupRatio: 50 }
      : undefined,
    queryFn: () =>
      getClaimGroupConfiguration({
        chainId: hemi.id,
        claimGroupId,
        lockupMonths: lockupMonths!,
        publicClient: hemiClient,
      })
        .then(({ bonus, lockupRatio }) => ({
          bonus: bonus / 100,
          lockupRatio: lockupRatio / 100,
        }))
        // Bonus and lockupRatio are returned as a percentage with two decimals, e.g. 1523 = 15.23%
        .catch(() => ({ bonus: 0, lockupRatio: 0 })),
    queryKey: ['claim-bonus', hemi.id, claimGroupId, lockupMonths],
  })
}
