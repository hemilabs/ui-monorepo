'use client'

import { Button, ButtonLink } from 'components/button'
import { ExternalLink } from 'components/externalLink'
import { EligibilityData } from 'genesis-drop-actions'
import { useAddTokenToWallet } from 'hooks/useAddTokenToWallet'
import { useHemi } from 'hooks/useHemi'
import { useHemiToken } from 'hooks/useHemiToken'
import { useWatchedAsset } from 'hooks/useWatchedAsset'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect } from 'react'
import ConfettiExplosion from 'react-confetti-explosion'
import Skeleton from 'react-loading-skeleton'
import useLocalStorageState from 'use-local-storage-state'
import { useAccount } from 'wagmi'

import { useClaimGroupConfiguration } from '../_hooks/useClaimGroupConfiguration'
import { useGetClaimTransaction } from '../_hooks/useGetClaimTransaction'
import { calculateSplitAmount, formatHemi, getMultiplier } from '../_utils'

import { ClaimToast } from './claimToast'
import { Incentives } from './incentives'
import { MultiplierRewardsTooltip } from './multiplierRewardsTooltip'

function usePageVisitTracker(claimGroupId: number) {
  const { address } = useAccount()

  const [hasVisited, setHasVisited] = useLocalStorageState(
    `portal.visited-claim-page-${address!.toLowerCase()}-claim-group-${claimGroupId}`,
    {
      defaultValue: false,
    },
  )

  useEffect(
    // marks the page as "visited" when the component unmounts
    // technically, we could just directly use the cleanup function from useEffect
    // but when running locally with strict mode, effects run twice,
    // which makes it hard to reproduce the unmount behavior
    // See https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development
    function markAsVisited() {
      if (hasVisited) {
        return undefined
      }
      const handleBeforeUnload = () => setHasVisited(true)

      window.addEventListener('beforeunload', handleBeforeUnload)

      return function cleanup() {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    },
    [hasVisited, setHasVisited],
  )

  return hasVisited
}

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
  const hemi = useHemi()
  const hemiToken = useHemiToken()
  const isTokenAdded = useWatchedAsset(hemiToken.address)

  const { mutate: addToken, status: addTokenStatus } = useAddTokenToWallet({
    token: hemiToken,
  })

  const { data: transaction, isLoading: isLoadingTransaction } =
    useGetClaimTransaction(eligibility.claimGroupId, {
      // do not revalidate - use the cached version, given TheGraph tiny delay
      refetchOnMount: false,
    })

  const { data: claimConfig, isLoading: isLoadingClaimConfiguration } =
    useClaimGroupConfiguration({
      claimGroupId: eligibility.claimGroupId,
      lockupMonths: transaction?.lockupMonths,
    })

  const hasVisited = usePageVisitTracker(eligibility.claimGroupId)

  const t = useTranslations('genesis-drop')

  const loadingSkeleton = (
    <Skeleton className="w-21 h-4" containerClassName="flex-1" />
  )

  const isStandardLock = () => transaction?.lockupMonths === 6

  const getUnlockedAmount = function () {
    if (
      !claimConfig ||
      !transaction ||
      isLoadingTransaction ||
      isLoadingClaimConfiguration
    ) {
      return loadingSkeleton
    }

    const { unlocked } = calculateSplitAmount({
      amount: eligibility.amount,
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
      amount: eligibility.amount,
      bonusPercentage: claimConfig.bonus,
      lockupRatio: transaction.ratio,
    })

    const formattedAmount = formatHemi(staked, hemiToken.decimals)
    return t('staked-for-months', {
      amount: formattedAmount,
      months: transaction.lockupMonths,
    })
  }

  const getIncentives = function () {
    if (isLoadingTransaction) {
      return loadingSkeleton
    }
    if (isStandardLock()) {
      return null
    }
    return (
      <Row>
        <Label>{t('claim-options.future-incentives-from')}</Label>
        <Value>
          <div className="flex items-center gap-x-1">
            <Incentives />
          </div>
        </Value>
      </Row>
    )
  }
  const canAddHemiTokenToWallet = !['pending', 'success'].includes(
    addTokenStatus,
  )

  const addHemiToken = function () {
    if (canAddHemiTokenToWallet) {
      addToken()
    }
  }

  const getMultiplierRewards = function () {
    if (isLoadingTransaction || !transaction) {
      return loadingSkeleton
    }
    if (isStandardLock()) {
      return null
    }

    return (
      <Row>
        <Label>
          {t('rewards-multiplier')}
          <MultiplierRewardsTooltip
            multiplier={
              transaction?.lockupMonths &&
              getMultiplier(transaction.lockupMonths)
            }
          />
        </Label>
        <Value>
          {t('up-to-multiplier', {
            multiplier: getMultiplier(transaction.lockupMonths),
          })}
        </Value>
      </Row>
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
        <h3 className="text-mid-md px-6 py-3 font-semibold text-black">
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
              {isLoadingTransaction || !transaction
                ? loadingSkeleton
                : t(`claim-options.claim-title-${transaction.lockupMonths}`)}
            </Value>
          </Row>
          <Row>
            <Label>
              {t('claim-options.liquid-hemi', { symbol: hemiToken.symbol })}
            </Label>
            <Value>{getUnlockedAmount()}</Value>
          </Row>
          <Row>
            <Label>
              <span>
                {t('claim-options.staked-hemi', { symbol: hemiToken.symbol })}
              </span>
            </Label>
            <Value>{getStakedAmount()}</Value>
          </Row>
          {getMultiplierRewards()}
          {getIncentives()}
        </div>
        <div className="flex items-center justify-between gap-x-4 p-4 [&>*]:flex-1">
          <Button
            disabled={!canAddHemiTokenToWallet || isTokenAdded}
            onClick={addHemiToken}
            type="button"
            variant="secondary"
          >
            {t(isTokenAdded ? 'hemi-token-added' : 'add-hemi-to-your-wallet', {
              symbol: hemiToken.symbol,
            })}
          </Button>
          <ButtonLink href="/staking-dashboard" variant="primary">
            {t('stake-hemi', { symbol: hemiToken.symbol })}
          </ButtonLink>
        </div>
      </div>
      <ExternalLink
        className="flex w-full justify-center py-3 text-xs font-medium text-orange-500 hover:text-orange-700"
        href={`${
          hemi.blockExplorers!.default.url
        }/tx/${transaction?.transactionHash}`}
      >
        {t('view-tx-on-explorer')}
      </ExternalLink>
    </>
  )
}
