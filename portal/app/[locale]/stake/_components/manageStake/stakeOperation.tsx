import { DrawerParagraph } from 'components/drawer'
import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { Spinner } from 'components/spinner'
import { stakeManagerAddresses } from 'hemi-viem-stake-actions'
import { useAllowance } from 'hooks/useAllowance'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { StakeOperations, StakeStatusEnum, type StakeToken } from 'types/stake'
import { getNativeToken, isNativeToken } from 'utils/nativeToken'
import { canSubmit } from 'utils/stake'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useAmount } from '../../_hooks/useAmount'
import { useEstimateStakeFees } from '../../_hooks/useEstimateStakeFees'
import { useStake } from '../../_hooks/useStake'
import { StakeToast } from '../stakeToast'

import { Fees } from './fees'
import { StakeMaxBalance } from './maxBalance'
import { Operation } from './operation'
import { Preview } from './preview'
import { StakeCallToAction } from './stakeCallToAction'
import { StrategyDetails } from './strategyDetails'
import { SubmitButton } from './submitButton'

type Props = {
  closeDrawer: () => void
  heading: string
  onOperationChange: (op: StakeOperations) => void
  showTabs: boolean
  subheading: string
  token: StakeToken
}

const useBalance = function (token: StakeToken) {
  const nativeBalance = useNativeTokenBalance(token.chainId)
  const tokenBalance = useTokenBalance(token.chainId, token.address)

  return isNativeToken(token) ? nativeBalance : tokenBalance
}

export const StakeOperation = function ({
  closeDrawer,
  heading,
  onOperationChange,
  showTabs,
  subheading,
  token,
}: Props) {
  const { address, chainId } = useAccount()
  const [amountInput, setAmountInput] = useAmount()
  const operatesNativeToken = isNativeToken(token)
  const spender = stakeManagerAddresses[token.chainId]

  const { data: allowance, isPending } = useAllowance(token.address, {
    args: {
      owner: address,
      spender,
    },
  })

  const amount = parseTokenUnits(amountInput, token)

  const { fees: approvalEstimatedFees, isError: isApprovalEstimatedFeesError } =
    useEstimateApproveErc20Fees({
      amount,
      spender,
      token,
    })

  const { fees: stakeEstimatedFees, isError: isStakeEstimatedFeesError } =
    useEstimateStakeFees({
      amount,
      enabled: allowance > 0 || operatesNativeToken,
      token,
    })

  const hemi = useHemi()

  const {
    approvalTxHash,
    isSubmitting,
    stake,
    stakeStatus,
    stakeTransactionHash,
  } = useStake(token)
  const t = useTranslations()
  const { balance, isSuccess: balanceLoaded } = useBalance(token)

  const addApprovalStep = function (): StepPropsWithoutPosition {
    const showFees = [
      StakeStatusEnum.APPROVAL_TX_FAILED,
      StakeStatusEnum.APPROVAL_TX_PENDING,
    ].includes(stakeStatus)

    const statusMap = {
      [StakeStatusEnum.APPROVAL_TX_FAILED]: ProgressStatus.FAILED,
      [StakeStatusEnum.APPROVAL_TX_PENDING]: ProgressStatus.PROGRESS,
    }

    return {
      description: t('common.approving-token', { symbol: token.symbol }),
      explorerChainId: token.chainId,
      fees: showFees
        ? {
            amount: formatUnits(
              approvalEstimatedFees,
              hemi.nativeCurrency.decimals,
            ),
            isError: isApprovalEstimatedFeesError,
            token: getNativeToken(hemi.id),
          }
        : undefined,
      status: statusMap[stakeStatus] ?? ProgressStatus.COMPLETED,
      txHash: approvalTxHash,
    }
  }

  const addStakingStep = function (): StepPropsWithoutPosition {
    const statusMap: Record<StakeStatusEnum, ProgressStatus> = {
      [StakeStatusEnum.APPROVAL_TX_PENDING]: ProgressStatus.NOT_READY,
      [StakeStatusEnum.APPROVAL_TX_FAILED]: ProgressStatus.NOT_READY,
      [StakeStatusEnum.APPROVAL_TX_COMPLETED]: ProgressStatus.READY,
      [StakeStatusEnum.STAKE_TX_PENDING]: ProgressStatus.PROGRESS,
      [StakeStatusEnum.STAKE_TX_FAILED]: ProgressStatus.FAILED,
      [StakeStatusEnum.STAKE_TX_CONFIRMED]: ProgressStatus.COMPLETED,
    }
    const showFees = [
      StakeStatusEnum.APPROVAL_TX_COMPLETED,
      StakeStatusEnum.STAKE_TX_PENDING,
      StakeStatusEnum.STAKE_TX_FAILED,
    ].includes(stakeStatus)

    return {
      description: t('stake-page.drawer.stake-token', { symbol: token.symbol }),
      explorerChainId: token.chainId,
      fees: showFees
        ? {
            amount: formatUnits(
              stakeEstimatedFees,
              hemi.nativeCurrency.decimals,
            ),
            isError: isStakeEstimatedFeesError,
            token: getNativeToken(hemi.id),
          }
        : undefined,
      status: statusMap[stakeStatus] ?? ProgressStatus.NOT_READY,
      txHash: stakeTransactionHash,
    }
  }

  const allowanceLoaded = !isPending || operatesNativeToken

  const {
    canSubmit: isSubmitValid,
    error,
    errorKey,
  } = canSubmit({
    amountInput,
    balance,
    chainId,
    expectedChain: hemi.name,
    operation: 'stake',
    t,
    token,
  })

  const canStake =
    allowanceLoaded && balanceLoaded && !isSubmitting && isSubmitValid

  const requiresApproval = allowance < parseTokenUnits(amountInput, token)

  const handleStake = () => stake({ amountInput })

  const isOperating = stakeStatus !== undefined

  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    if (isOperating) {
      if (requiresApproval || approvalTxHash) {
        steps.push(addApprovalStep())
      }
      steps.push(addStakingStep())
    }
    return steps
  }

  const getSubmitButtonText = function () {
    if (!allowanceLoaded || isSubmitting) {
      return <Spinner size="small" />
    }
    if (error) {
      return error
    }
    if (requiresApproval) {
      return t('stake-page.drawer.approve-and-stake')
    }

    return t('common.stake')
  }

  return (
    <>
      {stakeStatus === StakeStatusEnum.STAKE_TX_CONFIRMED && (
        <StakeToast
          chainId={token.chainId}
          txHash={stakeTransactionHash}
          type="stake"
        />
      )}
      <Operation
        amount={amountInput}
        callToAction={
          <StakeCallToAction
            isSubmitting={isSubmitting}
            stakeStatus={stakeStatus}
          />
        }
        closeDrawer={closeDrawer}
        heading={heading}
        isOperating={isOperating}
        onSubmit={handleStake}
        preview={
          <Preview
            amount={amountInput}
            errorKey={allowanceLoaded && balanceLoaded ? errorKey : undefined}
            fees={
              <Fees
                estimatedFees={stakeEstimatedFees}
                isError={isStakeEstimatedFeesError}
              />
            }
            isOperating={isOperating}
            maxBalance={
              <StakeMaxBalance
                disabled={isSubmitting}
                estimateFees={stakeEstimatedFees}
                onSetMaxBalance={setAmountInput}
                token={token}
              />
            }
            operation="stake"
            setAmount={setAmountInput}
            setOperation={() => onOperationChange('unstake')}
            showTabs={showTabs}
            strategyDetails={<StrategyDetails token={token} />}
            submitButton={
              <div className="flex w-full flex-col gap-y-3 text-center">
                <DrawerParagraph>
                  {t('stake-page.drawer.you-can-unstake-anytime')}
                </DrawerParagraph>
                <SubmitButton
                  disabled={!canStake}
                  text={getSubmitButtonText()}
                />
              </div>
            }
            token={token}
          />
        }
        steps={getSteps()}
        subheading={subheading}
        token={token}
      />
    </>
  )
}
