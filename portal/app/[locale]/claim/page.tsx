'use client'

import { HemiSymbolWhite } from 'components/icons/hemiSymbolWhite'
import { PageLayout } from 'components/pageLayout'
import { useTranslations } from 'next-intl'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { DisconnectedState } from './_components/disconnectedState'
import { Eligible } from './_components/eligible'
import { NotEligible } from './_components/notEligible'
import { useEligibleForTokens } from './_hooks/useEligibleForTokens'

export default function Page() {
  const { status } = useAccount()

  const eligibility = useEligibleForTokens()
  const t = useTranslations()

  const getMainSection = function () {
    if (status === 'disconnected') {
      return <DisconnectedState />
    }
    if (!walletIsConnected(status)) {
      return <p>...</p>
    }

    // from this point on, the user is connected
    if (!eligibility) {
      return <NotEligible />
    }
    return <Eligible eligibility={eligibility} />
  }

  return (
    <PageLayout variant="wide">
      <div className="flex w-full flex-col items-center gap-y-2">
        <div className="size-14">
          <HemiSymbolWhite />
        </div>
        <p className="mt-1 text-xs font-semibold uppercase text-orange-500">
          {t('rewards-page.title')}
        </p>
        <p className="text-center text-4xl font-semibold text-neutral-950">
          {t('rewards-page.subheading')}
        </p>
        {getMainSection()}
      </div>
    </PageLayout>
  )
}
