'use client'

import { Button } from 'components/button'
import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { ToastLoader } from 'components/toast/toastLoader'
import { useHemi } from 'hooks/useHemi'
import { useHemiWalletClient } from 'hooks/useHemiClient'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { getNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useClaimRewards } from '../_hooks/useClaimRewards'
import { useEstimateClaimRewardFees } from '../_hooks/useEstimateClaimRewardFees'
import { useHasClaimableRewards } from '../_hooks/useHasClaimableRewards'
import { useMerklRewards } from '../_hooks/useMerklRewards'
import {
  type BitcoinYieldClaimRewardOperation,
  BitcoinYieldClaimRewardStatus,
  type BitcoinYieldClaimRewardStatusType,
} from '../_types'

import { Operation } from './operation'
import { Rewards } from './rewards'

const SuccessToast = dynamic(
  () => import('./successToast').then(mod => mod.SuccessToast),
  {
    loading: () => <ToastLoader />,
    ssr: false,
  },
)

type Props = {
  onClose: VoidFunction
}

export const VaultClaimRewardOperation = function ({ onClose }: Props) {
  const [vaultClaimRewardOperation, setVaultClaimRewardOperation] = useState<
    BitcoinYieldClaimRewardOperation | undefined
  >()
  const hasStartedClaimRef = useRef(false)

  const hemi = useHemi()
  const { address } = useAccount()
  const { data: hasClaimableRewards } = useHasClaimableRewards()
  const { data: merklRewards } = useMerklRewards()
  const { hemiWalletClient } = useHemiWalletClient()

  const {
    isPending,
    isSuccess,
    mutate: claimReward,
  } = useClaimRewards({
    updateBitcoinYieldOperation: newStatus =>
      setVaultClaimRewardOperation(prev =>
        prev ? { ...prev, ...newStatus } : newStatus,
      ),
  })

  const claimRewardStatus = vaultClaimRewardOperation?.status

  const t = useTranslations()

  useEffect(
    // Auto-start claim reward operation when the drawer mounts
    function claimOnMount() {
      if (
        // wait until connected
        hemiWalletClient &&
        address &&
        // with rewards available
        hasClaimableRewards &&
        // making sure we haven't started already
        !isPending &&
        // and that we can't start again after finished
        !hasStartedClaimRef.current
      ) {
        hasStartedClaimRef.current = true
        claimReward()
      }
    },
    [address, claimReward, hasClaimableRewards, isPending, hemiWalletClient],
  )

  const { fees: claimRewardGasFees, isError: isClaimRewardFeesError } =
    useEstimateClaimRewardFees({
      enabled:
        claimRewardStatus ===
          BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_PENDING ||
        claimRewardStatus ===
          BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_FAILED ||
        claimRewardStatus === undefined,
    })

  const getStepFees = ({
    fee,
    isError,
    show,
  }: {
    fee: bigint
    isError: boolean
    show: boolean
  }): StepPropsWithoutPosition['fees'] =>
    show
      ? {
          amount: formatUnits(fee, hemi.nativeCurrency.decimals),
          isError,
          token: getNativeToken(hemi.id),
        }
      : undefined

  const addClaimRewardStep = function (): StepPropsWithoutPosition {
    const getStatus = function () {
      if (claimRewardStatus === undefined) {
        return ProgressStatus.READY
      }
      const statusMap: Record<
        BitcoinYieldClaimRewardStatusType,
        ProgressStatusType
      > = {
        [BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_PENDING]:
          ProgressStatus.PROGRESS,
        [BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_FAILED]:
          ProgressStatus.FAILED,
        [BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_CONFIRMED]:
          ProgressStatus.COMPLETED,
      }
      return statusMap[claimRewardStatus]
    }

    const showFees =
      claimRewardStatus ===
        BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_PENDING ||
      claimRewardStatus ===
        BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_FAILED ||
      claimRewardStatus === undefined

    return {
      description: (
        <ChainLabel
          active={
            claimRewardStatus ===
            BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_PENDING
          }
          chainId={hemi.id}
          label={t('bitcoin-yield.table.claim-rewards')}
        />
      ),
      explorerChainId: hemi.id,
      fees: getStepFees({
        fee: claimRewardGasFees,
        isError: isClaimRewardFeesError,
        show: showFees,
      }),
      status: getStatus(),
      txHash: vaultClaimRewardOperation?.transactionHash,
    }
  }

  const steps: StepPropsWithoutPosition[] = [addClaimRewardStep()]

  const canClaimReward = !!address && hasClaimableRewards

  const handleClaimReward = function () {
    if (canClaimReward) {
      claimReward()
    }
  }

  const getCallToAction = (
    status: BitcoinYieldClaimRewardStatusType | undefined,
  ) =>
    status === BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_FAILED ? (
      <div className="w-full [&>button]:w-full">
        <Button
          disabled={isPending}
          onClick={handleClaimReward}
          size="small"
          type="button"
          variant="primary"
        >
          {t('common.try-again')}
        </Button>
      </div>
    ) : null

  const renderToast = () =>
    vaultClaimRewardOperation?.status ===
      BitcoinYieldClaimRewardStatus.CLAIM_REWARD_TX_CONFIRMED && (
      <SuccessToast
        description={t('bitcoin-yield.toast.claim-rewards-successful')}
        title={t('bitcoin-yield.toast.claim-rewards-confirmed')}
        txHash={vaultClaimRewardOperation.transactionHash!}
      />
    )

  return (
    <>
      {renderToast()}
      <Operation
        amount={
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-neutral-500">{t('common.total-amount')}</span>
            {
              /*
            we only need to check for undefined (loading). If there were no rewards or an error
            we wouldn't have pool rewards to claim, so this component wouldn't be rendering. I even think
            we could skip undefined check, but I'm following Typescript suggestion here.*/
              merklRewards !== undefined ? (
                <Rewards merklRewards={merklRewards} />
              ) : (
                <Skeleton className="h-4 w-24" />
              )
            }
          </div>
        }
        callToAction={getCallToAction(claimRewardStatus)}
        heading={t('bitcoin-yield.drawer.claim-rewards-heading')}
        isOperating={isPending || isSuccess}
        onClose={onClose}
        steps={steps}
        subheading={t('bitcoin-yield.drawer.claim-rewards-subheading')}
      />
    </>
  )
}
