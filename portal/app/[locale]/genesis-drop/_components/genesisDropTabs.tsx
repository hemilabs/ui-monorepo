import { Tab, Tabs } from 'components/tabs'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { Suspense } from 'react'
import { useAccount } from 'wagmi'

import { useAllEligibleForTokens } from '../_hooks/useAllEligibleForTokens'
import { useSelectedClaimGroup } from '../_hooks/useSelectedClaimGroup'
import { isClaimRewardsEnabledOnTestnet } from '../_utils'

import { ClaimGroupName } from './claimGroupsName'

const GenesisDropTabsImpl = function () {
  const { address } = useAccount()
  const [networkType] = useNetworkType()
  const pathname = usePathnameWithoutLocale()
  const [selectedClaimGroup] = useSelectedClaimGroup()

  const enabled =
    isClaimRewardsEnabledOnTestnet(networkType) &&
    pathname.startsWith('/genesis-drop')

  const { data: eligibleTokens } = useAllEligibleForTokens({ enabled })

  if (
    !enabled ||
    !address ||
    // we only need the tabs if the user is eligible for two or more claim groups
    eligibleTokens === undefined ||
    eligibleTokens.length <= 1
  ) {
    return null
  }

  return (
    <div className="relative z-20 flex items-center justify-center gap-x-4 max-md:px-4 sm:flex-col sm:gap-y-4">
      <Tabs>
        {eligibleTokens.map(({ claimGroupId }) => (
          <Tab
            href={{
              pathname: '/genesis-drop',
              query: { claimGroupId },
            }}
            key={claimGroupId}
            selected={selectedClaimGroup === claimGroupId}
          >
            <span className="flex justify-center">
              <ClaimGroupName claimGroupId={claimGroupId} />
            </span>
          </Tab>
        ))}
      </Tabs>
    </div>
  )
}

export const GenesisDropTabs = () => (
  <Suspense>
    <GenesisDropTabsImpl />
  </Suspense>
)
