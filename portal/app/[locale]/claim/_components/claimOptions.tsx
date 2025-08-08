import { MutationStatus } from '@tanstack/react-query'
import { Button } from 'components/button'
import { Spinner } from 'components/spinner'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { LockupMonths, lockupOptions, type EligibilityData } from 'tge-claim'
import { Hash } from 'viem'

import { useClaimTokens } from '../_hooks/useClaimTokens'

import { Strategy } from './strategy'

const TermsAndConditions = dynamic(() =>
  import('./termsAndConditions').then(mod => mod.TermsAndConditions),
)

const ClaimDrawer = dynamic(() =>
  import('./claimDrawer').then(mod => mod.ClaimDrawer),
)

type Props = {
  eligibility: EligibilityData
}

// Currently, we don't allow customization for users of the ratio
// so we default to 50%
const defaultRatio = 50

export const ClaimOptions = function ({ eligibility }: Props) {
  const [termsAndConditions, setTermsAndConditions] = useState<{
    lockup: LockupMonths | undefined
    show: boolean
  }>({ lockup: undefined, show: false })

  const [isRetrying, setIsRetrying] = useState(false)
  const [signedTerms, setSignedTerms] = useState<Hash | undefined>(undefined)
  const [transactionHash, setTransactionHash] = useState<Hash | undefined>(
    undefined,
  )
  const [claimStatus, setClaimStatus] = useState<MutationStatus>('idle')
  const t = useTranslations('rewards-page')

  const closeDrawer = function () {
    setTermsAndConditions({ lockup: undefined, show: false })
    setClaimStatus('idle')
  }

  const { mutate: claimTokens } = useClaimTokens({
    on(emitter) {
      emitter.on('user-signing-claim-error', () => closeDrawer())
      emitter.on('user-signed-claim', function (hash) {
        // no need to sign T&C again - we can reuse the signature, and retry from the drawer
        setTermsAndConditions(prev => ({ ...prev, show: false }))
        setTransactionHash(hash)
        setClaimStatus('pending')
        setIsRetrying(false)
      })
      emitter.on('claim-transaction-succeeded', function () {
        setTermsAndConditions(prev => ({ ...prev, lockup: undefined }))
        setClaimStatus('success')
        closeDrawer()
        setTransactionHash(undefined)
      })
      emitter.on('claim-transaction-reverted', () => setClaimStatus('error'))
    },
  })

  const onSubmit = (lockupMonths: LockupMonths) =>
    setTermsAndConditions({ lockup: lockupMonths, show: true })

  const disableSubmit =
    termsAndConditions.show || ['pending', 'success'].includes(claimStatus)

  const handleClaim = (termsSignature: Hash) =>
    claimTokens({
      lockupMonths: termsAndConditions.lockup!,

      ratio: defaultRatio,
      termsSignature,
    })

  const handleRetry = function () {
    handleClaim(signedTerms)
    setIsRetrying(true)
  }

  const handleAcceptTermsAndConditions = function (termsSignature: Hash) {
    // save it for retrying
    setSignedTerms(termsSignature)
    handleClaim(termsSignature)
  }

  const showDrawer =
    claimStatus !== 'idle' && termsAndConditions.lockup !== undefined

  const getSubmitButtonText = function (strategyLockupMonths: LockupMonths) {
    if (termsAndConditions.lockup === strategyLockupMonths && !showDrawer) {
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
          claimGroupId={eligibility.claimGroupId}
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
          claimGroupId={eligibility.claimGroupId}
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
            claimGroupId={eligibility.claimGroupId}
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
      {showDrawer && (
        <ClaimDrawer
          eligibility={eligibility}
          isRetrying={isRetrying}
          lockupMonths={termsAndConditions.lockup}
          onClose={closeDrawer}
          onRetry={handleRetry}
          ratio={defaultRatio}
          status={claimStatus}
          termsSignature={signedTerms}
          transactionHash={transactionHash}
        />
      )}
    </>
  )
}
