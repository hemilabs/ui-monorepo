import { useAllowance } from '@hemilabs/react-hooks/useAllowance'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { DrawerParagraph } from 'components/drawer'
import { HemiFees } from 'components/hemiFees'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { Spinner } from 'components/spinner'
import { ToastLoader } from 'components/toast/toastLoader'
import { stakeManagerAddresses } from 'hemi-viem-stake-actions'
import { useAmount } from 'hooks/useAmount'
import { useTokenBalance } from 'hooks/useBalance'
import { useEstimateApprovalFees } from 'hooks/useEstimateApprovalFees'
import { useHemi } from 'hooks/useHemi'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import {
  StakeOperations,
  StakeStatusEnum,
  type StakeStatusEnumType,
  type StakeToken,
} from 'types/stake'
import { toChecksumAddress } from 'utils/address'
import { getNativeToken, isNativeToken } from 'utils/nativeToken'
import { canSubmit } from 'utils/stake'
import { parseTokenUnits } from 'utils/token'
import { formatUnits, type Hash, zeroAddress } from 'viem'
import { useAccount } from 'wagmi'

import { useEstimateStakeFees } from '../../_hooks/useEstimateStakeFees'
import { useStake } from '../../_hooks/useStake'

const StakeToast = dynamic(
  () => import('../stakeToast').then(mod => mod.StakeToast),
  {
    loading: () => <ToastLoader />,
    ssr: false,
  },
)

import { StakeMaxBalance } from './maxBalance'
import { Operation } from './operation'
import { Preview } from './preview'
import { StakeCallToAction } from './stakeCallToAction'
import { StrategyDetails } from './strategyDetails'
import { SubmitButton } from './submitButton'

type TranslationKey = Parameters<ReturnType<typeof useTranslations>>[0]

const APPROVAL_STATUS_MAP: Partial<
  Record<StakeStatusEnumType, ProgressStatusType>
> = {
  [StakeStatusEnum.APPROVAL_TX_FAILED]: ProgressStatus.FAILED,
  [StakeStatusEnum.APPROVAL_TX_PENDING]: ProgressStatus.PROGRESS,
}

const getApprovalProgressStatus = (
  stakeStatus: StakeStatusEnumType | undefined,
): ProgressStatusType =>
  stakeStatus === undefined
    ? ProgressStatus.COMPLETED
    : APPROVAL_STATUS_MAP[stakeStatus] ?? ProgressStatus.COMPLETED

const STAKING_STATUS_MAP: Record<StakeStatusEnumType, ProgressStatusType> = {
  [StakeStatusEnum.APPROVAL_TX_PENDING]: ProgressStatus.NOT_READY,
  [StakeStatusEnum.APPROVAL_TX_FAILED]: ProgressStatus.NOT_READY,
  [StakeStatusEnum.APPROVAL_TX_COMPLETED]: ProgressStatus.READY,
  [StakeStatusEnum.STAKE_TX_PENDING]: ProgressStatus.PROGRESS,
  [StakeStatusEnum.STAKE_TX_FAILED]: ProgressStatus.FAILED,
  [StakeStatusEnum.STAKE_TX_CONFIRMED]: ProgressStatus.COMPLETED,
}

const getStakingProgressStatus = (
  stakeStatus: StakeStatusEnumType | undefined,
): ProgressStatusType =>
  stakeStatus === undefined
    ? ProgressStatus.NOT_READY
    : STAKING_STATUS_MAP[stakeStatus] ?? ProgressStatus.NOT_READY

const APPROVAL_FEE_STATES: StakeStatusEnumType[] = [
  StakeStatusEnum.APPROVAL_TX_FAILED,
  StakeStatusEnum.APPROVAL_TX_PENDING,
]

const shouldShowApprovalFees = (
  stakeStatus: StakeStatusEnumType | undefined,
): boolean => Boolean(stakeStatus && APPROVAL_FEE_STATES.includes(stakeStatus))

const STAKING_FEE_STATES: StakeStatusEnumType[] = [
  StakeStatusEnum.APPROVAL_TX_COMPLETED,
  StakeStatusEnum.STAKE_TX_PENDING,
  StakeStatusEnum.STAKE_TX_FAILED,
]

const shouldShowStakingFees = (
  stakeStatus: StakeStatusEnumType | undefined,
): boolean => Boolean(stakeStatus && STAKING_FEE_STATES.includes(stakeStatus))

function getStakeSubmitButtonContent({
  allowanceLoaded,
  error,
  isSubmitting,
  requiresApproval,
  t,
}: {
  allowanceLoaded: boolean
  error: string | undefined
  isSubmitting: boolean
  requiresApproval: boolean
  t: ReturnType<typeof useTranslations>
}): ReactNode {
  if (!allowanceLoaded || isSubmitting) {
    return <Spinner size="small" />
  }
  if (error) {
    return error
  }
  if (requiresApproval) {
    return t('stake-page.drawer.approve-and-stake' as TranslationKey)
  }
  return t('common.stake' as TranslationKey)
}

type StepsParams = {
  approvalEstimatedFees: bigint
  approvalTxHash: Hash | undefined
  hemi: ReturnType<typeof useHemi>
  isApprovalEstimatedFeesError: boolean
  isStakeEstimatedFeesError: boolean
  requiresApproval: boolean
  stakeEstimatedFees: bigint
  stakeStatus: StakeStatusEnumType | undefined
  stakeTransactionHash: Hash | undefined
  t: ReturnType<typeof useTranslations>
  token: StakeToken
}

function getStakeOperationSteps({
  approvalEstimatedFees,
  approvalTxHash,
  hemi,
  isApprovalEstimatedFeesError,
  isStakeEstimatedFeesError,
  requiresApproval,
  stakeEstimatedFees,
  stakeStatus,
  stakeTransactionHash,
  t,
  token,
}: StepsParams): StepPropsWithoutPosition[] {
  const isOperating = stakeStatus !== undefined
  const approvalStep: StepPropsWithoutPosition = {
    description: t('common.approving-token' as TranslationKey, {
      symbol: token.symbol,
    }),
    explorerChainId: token.chainId,
    fees: shouldShowApprovalFees(stakeStatus)
      ? {
          amount: formatUnits(
            approvalEstimatedFees,
            hemi.nativeCurrency.decimals,
          ),
          isError: isApprovalEstimatedFeesError,
          token: getNativeToken(hemi.id),
        }
      : undefined,
    status: getApprovalProgressStatus(stakeStatus),
    txHash: approvalTxHash,
  }
  const stakingStep: StepPropsWithoutPosition = {
    description: t('stake-page.drawer.stake-token' as TranslationKey, {
      symbol: token.symbol,
    }),
    explorerChainId: token.chainId,
    fees: shouldShowStakingFees(stakeStatus)
      ? {
          amount: formatUnits(stakeEstimatedFees, hemi.nativeCurrency.decimals),
          isError: isStakeEstimatedFeesError,
          token: getNativeToken(hemi.id),
        }
      : undefined,
    status: getStakingProgressStatus(stakeStatus),
    txHash: stakeTransactionHash,
  }
  if (!isOperating) {
    return []
  }
  return [
    ...(requiresApproval || approvalTxHash ? [approvalStep] : []),
    stakingStep,
  ]
}

type Props = {
  closeDrawer: () => void
  heading: string
  onOperationChange: (op: StakeOperations) => void
  showTabs: boolean
  subheading: string
  token: StakeToken
}

type StakeOperationViewProps = {
  amountInput: string
  approvalLoaded: boolean
  balanceLoaded: boolean
  canStake: boolean
  closeDrawer: () => void
  errorKey: string | undefined
  heading: string
  isOperating: boolean
  isStakeEstimatedFeesError: boolean
  isSubmitting: boolean
  onOperationChange: (op: StakeOperations) => void
  setAmountInput: (value: string) => void
  showTabs: boolean
  stake: (params: { amountInput: string }) => void
  stakeEstimatedFees: bigint
  stakeStatus: StakeStatusEnumType | undefined
  stakeTransactionHash: Hash | undefined
  steps: StepPropsWithoutPosition[]
  subheading: string
  submitButtonContent: ReactNode
  token: StakeToken
  t: ReturnType<typeof useTranslations>
}

const StakeOperationView = ({
  amountInput,
  approvalLoaded,
  balanceLoaded,
  canStake,
  closeDrawer,
  errorKey,
  heading,
  isOperating,
  isStakeEstimatedFeesError,
  isSubmitting,
  onOperationChange,
  setAmountInput,
  showTabs,
  stake,
  stakeEstimatedFees,
  stakeStatus,
  stakeTransactionHash,
  steps,
  subheading,
  submitButtonContent,
  t,
  token,
}: StakeOperationViewProps) => (
  <>
    {stakeStatus === StakeStatusEnum.STAKE_TX_CONFIRMED && (
      <StakeToast
        chainId={token.chainId}
        txHash={stakeTransactionHash!}
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
      onSubmit={() => stake({ amountInput })}
      preview={
        <Preview
          amount={amountInput}
          errorKey={approvalLoaded && balanceLoaded ? errorKey : undefined}
          fees={
            <HemiFees
              fees={stakeEstimatedFees}
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
                {t(
                  'stake-page.drawer.you-can-unstake-anytime' as TranslationKey,
                )}
              </DrawerParagraph>
              <SubmitButton disabled={!canStake} text={submitButtonContent} />
            </div>
          }
          token={token}
        />
      }
      steps={steps}
      subheading={subheading}
      token={token}
    />
  </>
)

const getBalanceValue = (
  balance: bigint | { value: bigint } | undefined,
): bigint | undefined =>
  balance === undefined
    ? undefined
    : typeof balance === 'bigint'
      ? balance
      : balance.value

const useBalance = function (token: StakeToken) {
  const nativeBalance = useNativeBalance(token.chainId)
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
  const { address } = useAccount()
  const [amountInput, setAmountInput] = useAmount()
  const operatesNativeToken = isNativeToken(token)
  const spender = stakeManagerAddresses[token.chainId]

  const { data: allowance = BigInt(0), isPending } = useAllowance({
    enabled: !operatesNativeToken,
    owner: address ? toChecksumAddress(address) : undefined,
    spender,
    token: operatesNativeToken
      ? { address: zeroAddress, chainId: token.chainId }
      : {
          address: toChecksumAddress(token.address),
          chainId: token.chainId,
        },
  } as Parameters<typeof useAllowance>[0])

  const amount = parseTokenUnits(amountInput, token)

  const { fees: approvalEstimatedFees, isError: isApprovalEstimatedFeesError } =
    useEstimateApprovalFees({
      amount,
      spender,
      token,
    })

  const { fees: stakeEstimatedFees, isError: isStakeEstimatedFeesError } =
    useEstimateStakeFees({
      amount,
      enabled: (allowance as bigint) > BigInt(0) || operatesNativeToken,
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
  const { data: balance, isSuccess: balanceLoaded } = useBalance(token)

  const allowanceLoaded = !isPending || operatesNativeToken
  const balanceValue = getBalanceValue(balance)

  const {
    canSubmit: isSubmitValid,
    error,
    errorKey,
  } = canSubmit({
    amountInput,
    balance: balanceValue,
    operation: 'stake',
    t,
    token,
  })

  const allowanceBigInt = BigInt(allowance as bigint)
  const requiresApproval =
    !operatesNativeToken &&
    allowanceBigInt < parseTokenUnits(amountInput, token)

  const canStake =
    allowanceLoaded && balanceLoaded && !isSubmitting && isSubmitValid

  const steps = getStakeOperationSteps({
    approvalEstimatedFees,
    approvalTxHash,
    hemi,
    isApprovalEstimatedFeesError,
    isStakeEstimatedFeesError,
    requiresApproval,
    stakeEstimatedFees,
    stakeStatus,
    stakeTransactionHash,
    t,
    token,
  })

  const submitButtonContent = getStakeSubmitButtonContent({
    allowanceLoaded,
    error,
    isSubmitting,
    requiresApproval,
    t,
  })

  const isOperating = stakeStatus !== undefined

  return (
    <StakeOperationView
      amountInput={amountInput}
      approvalLoaded={allowanceLoaded}
      balanceLoaded={balanceLoaded}
      canStake={canStake}
      closeDrawer={closeDrawer}
      errorKey={errorKey}
      heading={heading}
      isOperating={isOperating}
      isStakeEstimatedFeesError={isStakeEstimatedFeesError}
      isSubmitting={isSubmitting}
      onOperationChange={onOperationChange}
      setAmountInput={setAmountInput}
      showTabs={showTabs}
      stake={stake}
      stakeEstimatedFees={stakeEstimatedFees}
      stakeStatus={stakeStatus}
      stakeTransactionHash={stakeTransactionHash}
      steps={steps}
      subheading={subheading}
      submitButtonContent={submitButtonContent}
      t={t}
      token={token}
    />
  )
}
