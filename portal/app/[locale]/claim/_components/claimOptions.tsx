import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { LockupMonths, lockupOptions, type EligibilityData } from 'tge-claim'

const TermsAndConditions = dynamic(() =>
  import('./termsAndConditions').then(mod => mod.TermsAndConditions),
)

import { Strategy } from './strategy'

type Props = {
  eligibility: EligibilityData
}

export const ClaimOptions = function ({ eligibility }: Props) {
  const [termsAndConditions, setTermsAndConditions] = useState<{
    lockup: LockupMonths | undefined
    show: boolean
  }>({ lockup: undefined, show: false })
  const t = useTranslations('rewards-page')

  const onSubmit = function (lockupMonths: LockupMonths) {
    setTermsAndConditions({ lockup: lockupMonths, show: true })
  }

  const disableSubmit = termsAndConditions.show

  const handleAcceptTermsAndConditions = () =>
    setTermsAndConditions(prev => ({ ...prev, show: false }))

  const getSubmitButtonText = function (strategyLockupMonths: LockupMonths) {
    if (termsAndConditions.lockup === strategyLockupMonths) {
      return (
        <div className="flex items-center gap-x-1.5">
          <Spinner size="xSmall" />
          <span>{t('claim-options.claiming-and-staking')}</span>
        </div>
      )
    }

    return t('claim-options.claim-and-stake')
  }

  return (
    <>
      <div className="mt-7 flex w-full flex-col flex-wrap items-center justify-center gap-6 md:flex-row md:gap-8">
        <Strategy
          amount={eligibility.amount}
          bgColor="bg-neutral-50"
          heading={t('claim-options.standard-claim')}
          lockupMonths={lockupOptions.sixMonths}
          onSubmit={onSubmit}
          recommendationLevel="low"
          submitButton={
            <Button disabled={disableSubmit} type="submit" variant="secondary">
              {getSubmitButtonText(lockupOptions.sixMonths)}
            </Button>
          }
        />
        <Strategy
          amount={eligibility.amount}
          bgColor="bg-[#fcfcfc]"
          bonusPercentage={5}
          heading={t('claim-options.hybrid-claim')}
          lockupMonths={lockupOptions.twoYears}
          onSubmit={onSubmit}
          recommendationLevel="medium"
          submitButton={
            <Button disabled={disableSubmit} type="submit" variant="primary">
              {getSubmitButtonText(lockupOptions.twoYears)}
            </Button>
          }
        />
        <div className="relative">
          <div className="border-1.5 border-sky-450 absolute -inset-2 rounded-2xl border-solid" />
          <Strategy
            amount={eligibility.amount}
            bgColor="bg-recommended-claim"
            bonusPercentage={10}
            heading={t('claim-options.max-yield')}
            lockupMonths={lockupOptions.fourYears}
            onSubmit={onSubmit}
            recommendationLevel="high"
            submitButton={
              <Button disabled={disableSubmit} type="submit" variant="primary">
                {getSubmitButtonText(lockupOptions.fourYears)}
              </Button>
            }
          />
        </div>
      </div>
      {termsAndConditions.show && (
        <TermsAndConditions
          onAccept={handleAcceptTermsAndConditions}
          onClose={() =>
            setTermsAndConditions({ lockup: undefined, show: false })
          }
        />
      )}
    </>
  )
}
