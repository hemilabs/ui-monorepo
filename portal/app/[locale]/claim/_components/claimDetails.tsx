'use client'

import { ButtonLink } from 'components/button'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect } from 'react'
import ConfettiExplosion from 'react-confetti-explosion'
import Skeleton from 'react-loading-skeleton'
import { EligibilityData, LockupMonths } from 'tge-claim'
import useLocalStorageState from 'use-local-storage-state'
import { useAccount } from 'wagmi'

import { useClaimGroupConfiguration } from '../_hooks/useClaimGroupConfiguration'
import { useGetClaimTransaction } from '../_hooks/useGetClaimTransaction'
import { useHemiToken } from '../_hooks/useHemiToken'
import {
  calculateSplitAmount,
  formatHemi,
  PercentageApyStakedHemi,
} from '../_utils'

import { ClaimToast } from './claimToast'
import { Incentives } from './incentives'
import { StakedHemiTooltip } from './stakedHemiTooltip'

const Row = ({ children }: { children: ReactNode }) => (
  <div className="text-mid flex items-center justify-between border-b border-solid border-neutral-300/55 py-3 font-medium last:border-b-0">
    {children}
  </div>
)

const Label = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-x-0.5 text-neutral-600">{children}</div>
)

const Value = ({ children }: { children: ReactNode }) => (
  <span className="text-neutral-950">{children}</span>
)

type Props = {
  eligibility: EligibilityData
}

export const ClaimDetails = function ({ eligibility }: Props) {
  const { address } = useAccount()
  const hemi = useHemi()
  const hemiToken = useHemiToken()

  const { data: transaction, isLoading: isLoadingTransaction } =
    useGetClaimTransaction(eligibility.claimGroupId)

  const { data: claimConfig, isLoading: isLoadingClaimConfiguration } =
    useClaimGroupConfiguration({
      claimGroupId: eligibility.claimGroupId,
      lockupMonths: transaction?.lockupMonths,
    })

  const [hasVisited, setHasVisited] = useLocalStorageState(
    `portal.visited-claim-page-${address.toLowerCase()}-claim-group-${
      eligibility.claimGroupId
    }`,
    { defaultValue: false },
  )

  const t = useTranslations('rewards-page')

  useEffect(
    // marks the page as "visited" when the component unmounts
    // technically, we could just directly use the cleanup function from useEffect
    // but when running locally with strict mode, effects run twice,
    // which makes it hard to reproduce the unmount behavior
    // See https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development
    // that's why I am using the beforeunload event
    function markAsVisited() {
      const handleBeforeUnload = () => setHasVisited(true)
      window.addEventListener('beforeunload', handleBeforeUnload)

      return () =>
        window.removeEventListener('beforeunload', handleBeforeUnload)
    },
    [hasVisited, setHasVisited],
  )

  const claimTitle: Record<LockupMonths, string> = {
    6: t('claim-options.standard-claim'),
    24: t('claim-options.hybrid-claim'),
    48: t('claim-options.max-yield'),
  }

  const loadingSkeleton = (
    <Skeleton className="w-21 h-4" containerClassName="flex-1" />
  )

  const isStandardLock = () => transaction?.lockupMonths === 6

  const getUnlockedAmount = function () {
    if (isLoadingTransaction || isLoadingClaimConfiguration) {
      return loadingSkeleton
    }

    const { unlocked } = calculateSplitAmount({
      amount: BigInt(eligibility.amount),
      bonusPercentage: claimConfig.bonus,
      lockupRatio: transaction.ratio,
    })

    return formatHemi(unlocked, hemiToken.decimals)
  }

  const getStakedAmount = function () {
    if (
      isLoadingTransaction ||
      isLoadingClaimConfiguration ||
      !transaction ||
      !claimConfig
    ) {
      return loadingSkeleton
    }

    const { staked } = calculateSplitAmount({
      amount: BigInt(eligibility.amount),
      bonusPercentage: claimConfig.bonus,
      lockupRatio: transaction.ratio,
    })

    return formatHemi(staked, hemiToken.decimals)
  }

  const getApy = function () {
    if (isLoadingTransaction) {
      return loadingSkeleton
    }
    if (isStandardLock()) {
      return `-`
    }
    return `${PercentageApyStakedHemi}%`
  }

  const getIncentives = function () {
    if (isLoadingTransaction) {
      return loadingSkeleton
    }
    if (isStandardLock()) {
      return '-'
    }
    return (
      <div className="flex items-center gap-x-1">
        <Incentives />
      </div>
    )
  }

  return (
    <>
      {!hasVisited && (
        <>
          <ConfettiExplosion
            duration={3000}
            force={0.8}
            particleCount={250}
            width={1600}
          />
          {!!transaction && (
            <ClaimToast transactionHash={transaction.transactionHash} />
          )}
        </>
      )}
      <div
        className="md:w-120 relative w-full rounded-xl bg-neutral-50"
        style={{
          boxShadow:
            '0 0 0 1px rgba(10, 10, 10, 0.08), 0 1px 2px 0 rgba(10, 10, 10, 0.10)',
        }}
      >
        <h3 className="px-6 py-3 text-lg font-semibold text-black">
          {t('claim-details')}
        </h3>
        <div
          className="relative z-10 rounded-xl bg-white px-6"
          style={{
            boxShadow:
              '0 0 0 1px rgba(10, 10, 10, 0.08), 0 8px 12px -4px rgba(10, 10, 10, 0.08), 0 1px 2px 0 rgba(10, 10, 10, 0.10)',
          }}
        >
          <Row>
            <Label>{t('claim-name')}</Label>
            <Value>
              {isLoadingTransaction
                ? loadingSkeleton
                : claimTitle[transaction.lockupMonths]}
            </Value>
          </Row>
          <Row>
            <Label>{t('lock-period')}</Label>
            <Value>
              {isLoadingTransaction
                ? loadingSkeleton
                : t(`claim-options.lockup-period-${transaction.lockupMonths}`)}
            </Value>
          </Row>
          <Row>
            <Label>{t('claim-options.unlocked-hemi')}</Label>
            <Value>{getUnlockedAmount()}</Value>
          </Row>
          <Row>
            <Label>
              <span>{t('claim-options.staked-hemi')}</span>
              <StakedHemiTooltip />
            </Label>
            <Value>
              <span>{getStakedAmount()}</span>
            </Value>
          </Row>
          <Row>
            <Label>
              <span>{t('apy-in-staked-hemi')}</span>
              <StakedHemiTooltip />
            </Label>
            <Value>{getApy()}</Value>
          </Row>
          <Row>
            <Label>{t('claim-options.future-incentives-from')}</Label>
            <Value>{getIncentives()}</Value>
          </Row>
        </div>
        <div className="flex items-center justify-between p-4">
          <ButtonLink
            aria-disabled={isLoadingTransaction}
            href={`${hemi.blockExplorers.default.url}/tx/${transaction.transactionHash}`}
            variant="secondary"
          >
            {t('view-tx-on-explorer')}
          </ButtonLink>
          <ButtonLink href="/staking-dashboard" variant="primary">
            {t('stake-more')}
          </ButtonLink>
        </div>
      </div>
    </>
  )
}
