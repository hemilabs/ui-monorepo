'use client'

import { HemiSymbolWhite } from 'components/icons/hemiSymbolWhite'
import { Spinner } from 'components/spinner'
import { type EligibilityData } from 'genesis-drop-actions'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { ClaimGroupName } from './_components/claimGroupsName'
import { DisconnectedState } from './_components/disconnectedState'
import { Eligible } from './_components/eligible'
import { NotEligible } from './_components/notEligible'
import { useAllEligibleForTokens } from './_hooks/useAllEligibleForTokens'
import { useSelectedClaimGroup } from './_hooks/useSelectedClaimGroup'

const hasAllocation = function (
  allEligibility: EligibilityData[],
  selectedClaimGroup: number,
) {
  const allocation = allEligibility.find(
    item => item.claimGroupId === selectedClaimGroup,
  )
  if (!allocation) {
    return false
  }
  return allocation.amount > BigInt(0)
}

export default function Page() {
  const { status } = useAccount()

  const { data: allEligibility } = useAllEligibleForTokens()
  const [selectedClaimGroup, setSelectedClaimGroup] = useSelectedClaimGroup()
  const t = useTranslations('genesis-drop')

  useEffect(
    function autoSelectClaimGroup() {
      if (allEligibility === undefined || allEligibility.length === 0) {
        // do nothing - still loading or claim groups not available
        return
      }
      const claimGroupIdFound = allEligibility.some(
        e => e.claimGroupId === selectedClaimGroup,
      )
      if (selectedClaimGroup === undefined || !claimGroupIdFound) {
        // select the first one by default, if not set already, unless the one set is not in the response
        setSelectedClaimGroup(allEligibility[0].claimGroupId)
      }
    },
    [allEligibility, selectedClaimGroup, setSelectedClaimGroup],
  )

  const getMainSection = function () {
    if (status === 'disconnected') {
      return (
        <>
          <DisconnectedState />
          <p className="max-w-50 mt-1 text-center text-xs font-medium text-neutral-500">
            {t('connect-demos-wallet')}
          </p>
        </>
      )
    }

    const spinner = (
      <div className="mt-5">
        <Spinner color="#FF6A00" size="small" />
      </div>
    )

    if (
      !walletIsConnected(status) ||
      allEligibility === undefined ||
      selectedClaimGroup === null
    ) {
      return spinner
    }

    if (
      allEligibility.length === 0 ||
      !hasAllocation(allEligibility, selectedClaimGroup)
    ) {
      return <NotEligible />
    }

    if (selectedClaimGroup === undefined) {
      return spinner
    }
    return (
      <Eligible
        eligibility={
          allEligibility.find(item => item.claimGroupId === selectedClaimGroup)!
        }
      />
    )
  }

  const getSubheading = function () {
    // use the default claim group if the user is disconnected
    if (status === 'disconnected') {
      return t('claim-groups.genesis-drop')
    }

    if (selectedClaimGroup !== null) {
      return <ClaimGroupName claimGroupId={selectedClaimGroup} />
    }

    return <Skeleton className="h-10 w-72" />
  }

  return (
    <>
      <div className="flex w-full flex-col items-center gap-y-2">
        <div className="size-14">
          <HemiSymbolWhite />
        </div>
        <p className="mt-1 text-xs font-semibold uppercase text-orange-500">
          {t('title')}
        </p>
        <p className="text-center text-4xl font-semibold text-neutral-950">
          {getSubheading()}
        </p>
        {getMainSection()}
      </div>
    </>
  )
}
