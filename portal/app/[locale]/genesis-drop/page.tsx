'use client'

import { HemiSymbolWhite } from 'components/icons/hemiSymbolWhite'
import { Spinner } from 'components/spinner'
import { type EligibilityData } from 'genesis-drop-actions'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { ClaimGroupName } from './_components/claimGroupsName'
import { DisconnectedState } from './_components/disconnectedState'
import { Eligible } from './_components/eligible'
import { NotEligible } from './_components/notEligible'
import { useAllEligibleForTokens } from './_hooks/useAllEligibleForTokens'
import { useSelectedClaimGroup } from './_hooks/useSelectedClaimGroup'

const hasAllocation = (
  allEligibility: EligibilityData[],
  selectedClaimGroup: number,
) =>
  (allEligibility.find(item => item.claimGroupId === selectedClaimGroup)
    ?.amount ?? BigInt(0)) > BigInt(0)

export default function Page() {
  const { status } = useAccount()

  const { data: allEligibility } = useAllEligibleForTokens()
  const [selectedClaimGroup] = useSelectedClaimGroup()
  const t = useTranslations('genesis-drop')

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
          {selectedClaimGroup !== null ? (
            <ClaimGroupName claimGroupId={selectedClaimGroup!} />
          ) : (
            <Skeleton className="h-10 w-72" />
          )}
        </p>
        {getMainSection()}
      </div>
    </>
  )
}
