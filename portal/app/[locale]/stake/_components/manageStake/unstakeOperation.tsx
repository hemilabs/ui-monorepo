import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { Spinner } from 'components/spinner'
import { ToastLoader } from 'components/toast/toastLoader'
import { useHemi } from 'hooks/useHemi'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import {
  UnstakeStatusEnum,
  type StakeOperations,
  type StakeToken,
} from 'types/stake'
import { getNativeToken } from 'utils/nativeToken'
import { canSubmit } from 'utils/stake'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useAmount } from '../../_hooks/useAmount'
import { useEstimateUnstakeFees } from '../../_hooks/useEstimateUnstakeFees'
import { useStakedBalance } from '../../_hooks/useStakedBalance'
import { useUnstake } from '../../_hooks/useUnstake'

const StakeToast = dynamic(
  () => import('../stakeToast').then(mod => mod.StakeToast),
  {
    loading: () => <ToastLoader />,
    ssr: false,
  },
)

import { Fees } from './fees'
import { UnstakeMaxBalance } from './maxBalance'
import { Operation } from './operation'
import { Preview } from './preview'
import { SubmitButton } from './submitButton'
import { UnstakeCallToAction } from './unstakeCallToAction'

const StakedBalance = dynamic(
  () => import('../stakedBalance').then(mod => mod.StakedBalance),
  {
    loading: () => (
      <Skeleton className="h-full" containerClassName="basis-1/3" />
    ),
    ssr: false,
  },
)

type Props = {
  closeDrawer: () => void
  heading: string
  onOperationChange: (op: StakeOperations) => void
  subheading: string
  token: StakeToken
}

export const UnstakeOperation = function ({
  closeDrawer,
  heading,
  onOperationChange,
  subheading,
  token,
}: Props) {
  const { chainId } = useAccount()
  const [amountInput, setAmountInput] = useAmount()

  const hemi = useHemi()
  const {
    balance = BigInt(0),
    isPending: isStakedPositionPending,
    isSuccess: isStakedPositionSuccess,
  } = useStakedBalance(token)
  const t = useTranslations()
  const { isSubmitting, unstake, unstakeStatus, unStakeTransactionHash } =
    useUnstake(token)

  const {
    canSubmit: isSubmitValid,
    error,
    errorKey,
  } = canSubmit({
    amountInput,
    balance,
    chainId,
    expectedChain: hemi.name,
    operation: 'unstake',
    t,
    token,
  })

  const canUnstake = isStakedPositionSuccess && !isSubmitting && isSubmitValid

  const { fees: unstakeEstimatedFees, isError: isUnstakeEstimatedFeesError } =
    useEstimateUnstakeFees({
      amount: parseTokenUnits(amountInput, token),
      enabled: canUnstake,
      token,
    })

  const getStatus = function () {
    if (unstakeStatus === undefined) {
      return ProgressStatus.NOT_READY
    }

    const statusMap = {
      [UnstakeStatusEnum.UNSTAKE_TX_PENDING]: ProgressStatus.PROGRESS,
      [UnstakeStatusEnum.UNSTAKE_TX_FAILED]: ProgressStatus.FAILED,
      [UnstakeStatusEnum.UNSTAKE_TX_CONFIRMED]: ProgressStatus.COMPLETED,
    }
    return statusMap[unstakeStatus] ?? ProgressStatus.NOT_READY
  }

  const unstakeStep: StepPropsWithoutPosition = {
    description: t('stake-page.drawer.unstake-token', { symbol: token.symbol }),
    explorerChainId: token.chainId,
    fees:
      unstakeStatus === UnstakeStatusEnum.UNSTAKE_TX_PENDING
        ? {
            amount: formatUnits(
              unstakeEstimatedFees,
              hemi.nativeCurrency.decimals,
            ),
            isError: isUnstakeEstimatedFeesError,
            token: getNativeToken(hemi.id),
          }
        : undefined,
    status: getStatus(),
    txHash: unStakeTransactionHash,
  }

  const handleUnstake = () => unstake({ amountInput })

  const isOperating = unstakeStatus !== undefined

  const getSubmitButtonText = function () {
    if (isStakedPositionPending || isSubmitting) {
      return <Spinner size="small" />
    }
    if (error) {
      return error
    }
    return t('common.unstake')
  }

  return (
    <>
      {unstakeStatus === UnstakeStatusEnum.UNSTAKE_TX_CONFIRMED &&
        unStakeTransactionHash && (
          <StakeToast
            chainId={token.chainId}
            txHash={unStakeTransactionHash}
            type="unstake"
          />
        )}
      <Operation
        amount={amountInput}
        callToAction={
          <UnstakeCallToAction
            isSubmitting={isSubmitting}
            unstakeStatus={unstakeStatus}
          />
        }
        closeDrawer={closeDrawer}
        heading={heading}
        isOperating={isOperating}
        onSubmit={handleUnstake}
        preview={
          <Preview
            amount={amountInput}
            balanceComponent={StakedBalance}
            errorKey={isStakedPositionSuccess ? errorKey : undefined}
            fees={
              <Fees
                estimatedFees={unstakeEstimatedFees}
                isError={isUnstakeEstimatedFeesError}
              />
            }
            isOperating={isOperating}
            maxBalance={
              <UnstakeMaxBalance
                disabled={isSubmitting}
                onSetMaxBalance={setAmountInput}
                token={token}
              />
            }
            operation="unstake"
            setAmount={setAmountInput}
            setOperation={() => onOperationChange('stake')}
            showTabs
            submitButton={
              <SubmitButton
                disabled={!canUnstake}
                text={getSubmitButtonText()}
              />
            }
            token={token}
          />
        }
        steps={[unstakeStep]}
        subheading={subheading}
        token={token}
      />
    </>
  )
}
