'use client'

import { HemiSymbolWhite } from 'components/icons/hemiSymbolWhite'
import { Spinner } from 'components/spinner'
import { useTranslations } from 'next-intl'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

import { DisconnectedState } from './_components/disconnectedState'
import { Eligible } from './_components/eligible'
import { NotEligible } from './_components/notEligible'
import { useEligibleForTokens } from './_hooks/useEligibleForTokens'

export default function Page() {
  const { status } = useAccount()

  const { data: eligibility } = useEligibleForTokens()
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
    if (!walletIsConnected(status) || eligibility === undefined) {
      return (
        <div className="mt-5">
          <Spinner color="#FF6A00" size="small" />
        </div>
      )
    }

    // from this point on, the user is connected
    if (eligibility.amount === BigInt(0)) {
      return <NotEligible />
    }
    return <Eligible eligibility={eligibility} />
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
