'use client'

import { HemiSymbolWhite } from 'components/icons/hemiSymbolWhite'
import { Spinner } from 'components/spinner'
import { useTranslations } from 'next-intl'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { DisconnectedState } from './_components/disconnectedState'
import { Eligible } from './_components/eligible'
import { NotEligible } from './_components/notEligible'
import { useAllEligibleForTokens } from './_hooks/useAllEligibleForTokens'
import { useSelectedClaimGroup } from './_hooks/useSelectedClaimGroup'

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

    if (!walletIsConnected(status) || allEligibility === undefined) {
      return spinner
    }

    if (allEligibility.length === 0) {
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
          {t('subheading')}
        </p>
        {getMainSection()}
      </div>
    </>
  )
}
