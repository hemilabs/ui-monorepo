'use client'

import { Button } from 'components/button'
import { HemiFees } from 'components/hemiFees'
import { Amount } from 'components/reviewOperation/amount'
import { ChainLabel } from 'components/reviewOperation/chainLabel'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { SetMaxEvmBalance } from 'components/setMaxBalance'
import { ToastLoader } from 'components/toast/toastLoader'
import { validateInput } from 'components/tokenInput/utils'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import { useTokenBalance } from 'hooks/useBalance'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useHemi } from 'hooks/useHemi'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'

import { useDeposit } from '../_hooks/useDeposit'
import { useEstimateDepositFees } from '../_hooks/useEstimateDepositFees'
import { usePoolAsset } from '../_hooks/usePoolAsset'
import {
  BitcoinYieldDepositOperation,
  BitcoinYieldDepositStatus,
  type BitcoinYieldDepositStatusType,
} from '../_types'

import { Operation } from './operation'
import { Preview } from './preview'
import { SubmitDeposit } from './submitDeposit'

const SuccessToast = dynamic(
  () => import('./successToast').then(mod => mod.SuccessToast),
  {
    loading: () => <ToastLoader />,
    ssr: false,
  },
)

type Props = {
  input: string
  onAmountChange: (input: string) => void
  onClose: VoidFunction
}

export const VaultDepositOperation = function ({
  input,
  onAmountChange,
  onClose,
}: Props) {
  const [vaultDepositOperation, setVaultDepositOperation] = useState<
    BitcoinYieldDepositOperation | undefined
  >()

  const hemi = useHemi()
  const { data: token } = usePoolAsset()
  const {
    isPending,
    isSuccess,
    mutate: deposit,
  } = useDeposit({
    input,
    updateBitcoinYieldOperation: newStatus =>
      setVaultDepositOperation(prev =>
        prev ? { ...prev, ...newStatus } : newStatus,
      ),
  })

  const { balance: tokenBalance } = useTokenBalance(
    token.chainId,
    token.address,
  )

  const depositStatus = vaultDepositOperation?.status

  const t = useTranslations()

  const vaultAddress = getBtcStakingVaultContractAddress(token.chainId)

  const amount = parseTokenUnits(input, token)

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: token.address,
      amount,
      spender: vaultAddress,
    })

  const { fees: approvalTokenGasFees, isError: isApprovalTokenGasFeesError } =
    useEstimateApproveErc20Fees({
      amount,
      enabled:
        depositStatus === BitcoinYieldDepositStatus.APPROVAL_TX_FAILED ||
        depositStatus === BitcoinYieldDepositStatus.APPROVAL_TX_PENDING,
      spender: vaultAddress,
      token,
    })

  const { fees: depositGasFees, isError: isDepositFeesError } =
    useEstimateDepositFees({
      amount,
      enabled:
        depositStatus === BitcoinYieldDepositStatus.APPROVAL_TX_COMPLETED ||
        depositStatus === BitcoinYieldDepositStatus.DEPOSIT_TX_PENDING ||
        depositStatus === BitcoinYieldDepositStatus.DEPOSIT_TX_FAILED,
    })

  const getStepFees = ({
    fee,
    isError,
    show,
  }: {
    fee: bigint
    show: boolean
    isError: boolean
  }): StepPropsWithoutPosition['fees'] =>
    show
      ? {
          amount: formatUnits(fee, hemi.nativeCurrency.decimals),
          isError,
          token: getNativeToken(hemi.id),
        }
      : undefined

  const addApprovalStep = function (): StepPropsWithoutPosition {
    const showFees =
      depositStatus === BitcoinYieldDepositStatus.APPROVAL_TX_FAILED ||
      depositStatus === BitcoinYieldDepositStatus.APPROVAL_TX_PENDING

    const statusMap: Partial<
      Record<BitcoinYieldDepositStatusType, ProgressStatusType>
    > = {
      [BitcoinYieldDepositStatus.APPROVAL_TX_FAILED]: ProgressStatus.FAILED,
      [BitcoinYieldDepositStatus.APPROVAL_TX_PENDING]: ProgressStatus.PROGRESS,
    }

    const getStatus = function () {
      if (depositStatus === undefined) {
        return ProgressStatus.NOT_READY
      }
      return statusMap[depositStatus] ?? ProgressStatus.COMPLETED
    }

    return {
      description: (
        <ChainLabel
          active={
            depositStatus === BitcoinYieldDepositStatus.APPROVAL_TX_PENDING
          }
          chainId={hemi.id}
          label={t('common.approving-token', { symbol: token.symbol })}
        />
      ),
      explorerChainId: token.chainId,
      fees: getStepFees({
        fee: approvalTokenGasFees,
        isError: isApprovalTokenGasFeesError,
        show: showFees,
      }),
      status: getStatus(),
      txHash: vaultDepositOperation?.approvalTxHash,
    }
  }

  const addDepositStep = function (): StepPropsWithoutPosition {
    const getStatus = function () {
      if (depositStatus === undefined) {
        return ProgressStatus.NOT_READY
      }
      const statusMap: Record<
        BitcoinYieldDepositStatusType,
        ProgressStatusType
      > = {
        [BitcoinYieldDepositStatus.APPROVAL_TX_PENDING]:
          ProgressStatus.NOT_READY,
        [BitcoinYieldDepositStatus.APPROVAL_TX_FAILED]:
          ProgressStatus.NOT_READY,
        [BitcoinYieldDepositStatus.APPROVAL_TX_COMPLETED]: ProgressStatus.READY,
        [BitcoinYieldDepositStatus.DEPOSIT_TX_PENDING]: ProgressStatus.PROGRESS,
        [BitcoinYieldDepositStatus.DEPOSIT_TX_FAILED]: ProgressStatus.FAILED,
        [BitcoinYieldDepositStatus.DEPOSIT_TX_CONFIRMED]:
          ProgressStatus.COMPLETED,
      }
      return statusMap[depositStatus]
    }

    const showFees =
      depositStatus === BitcoinYieldDepositStatus.APPROVAL_TX_COMPLETED ||
      depositStatus === BitcoinYieldDepositStatus.DEPOSIT_TX_PENDING ||
      depositStatus === BitcoinYieldDepositStatus.DEPOSIT_TX_FAILED

    return {
      description: (
        <ChainLabel
          active={
            depositStatus === BitcoinYieldDepositStatus.DEPOSIT_TX_PENDING
          }
          chainId={hemi.id}
          label={t('bitcoin-yield.drawer.deposit-btc', {
            symbol: token.symbol,
          })}
        />
      ),
      explorerChainId: token.chainId,
      fees: getStepFees({
        fee: depositGasFees,
        isError: isDepositFeesError,
        show: showFees,
      }),
      status: getStatus(),
      txHash: vaultDepositOperation?.transactionHash,
    }
  }

  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    if (needsApproval || vaultDepositOperation?.approvalTxHash) {
      steps.push(addApprovalStep())
    }
    steps.push(addDepositStep())
    return steps
  }
  const getFeeProps = () => ({
    fees: (approvalTokenGasFees ?? BigInt(0)) + (depositGasFees ?? BigInt(0)),
    isError: isApprovalTokenGasFeesError || isDepositFeesError,
  })

  const {
    error: validationError,
    errorKey,
    isValid: isSubmitValid,
  } = validateInput({
    amountInput: input,
    balance: tokenBalance,
    operation: 'deposit',
    t,
    token,
  })

  const balanceLoaded = tokenBalance !== undefined
  const allowanceLoaded = needsApproval !== undefined

  const canDeposit = balanceLoaded && allowanceLoaded && isSubmitValid

  const handleDeposit = function () {
    if (canDeposit) {
      deposit()
    }
  }

  const getCallToAction = (
    status: BitcoinYieldDepositStatusType | undefined,
  ) =>
    status === BitcoinYieldDepositStatus.APPROVAL_TX_FAILED ||
    status === BitcoinYieldDepositStatus.DEPOSIT_TX_FAILED ? (
      <div className="w-full [&>button]:w-full">
        <Button
          disabled={isPending}
          onClick={handleDeposit}
          size="small"
          type="button"
          variant="primary"
        >
          {t('common.try-again')}
        </Button>
      </div>
    ) : null

  const renderToast = () =>
    vaultDepositOperation?.status ===
      BitcoinYieldDepositStatus.DEPOSIT_TX_CONFIRMED && (
      <SuccessToast
        description={t('bitcoin-yield.toast.your-deposit-was-successful')}
        title={t('bitcoin-yield.toast.deposit-confirmed')}
        txHash={vaultDepositOperation.transactionHash!}
      />
    )

  return (
    <>
      {renderToast()}
      <Operation
        amount={
          <Amount
            token={token}
            value={parseTokenUnits(input, token).toString()}
          />
        }
        callToAction={getCallToAction(depositStatus)}
        heading={t('bitcoin-yield.drawer.deposit-heading')}
        isOperating={isPending || isSuccess}
        onClose={onClose}
        onSubmit={handleDeposit}
        preview={
          <Preview
            amount={input}
            errorKey={allowanceLoaded && balanceLoaded ? errorKey : undefined}
            fees={<HemiFees {...getFeeProps()} />}
            isOperating={isPending}
            maxBalance={
              <SetMaxEvmBalance
                disabled={isPending}
                gas={depositGasFees}
                onSetMaxBalance={onAmountChange}
                token={token}
              />
            }
            setAmount={onAmountChange}
            submitButton={
              <SubmitDeposit
                canDeposit={canDeposit}
                isAllowanceError={isAllowanceError}
                isAllowanceLoading={isAllowanceLoading}
                isRunningOperation={isPending}
                needsApproval={needsApproval}
                token={token}
                validationError={validationError}
                vaultDepositOperation={vaultDepositOperation}
              />
            }
            token={token}
          />
        }
        steps={getSteps()}
        subheading={t('bitcoin-yield.drawer.deposit-subheading', {
          symbol: token.symbol,
        })}
      />
    </>
  )
}
