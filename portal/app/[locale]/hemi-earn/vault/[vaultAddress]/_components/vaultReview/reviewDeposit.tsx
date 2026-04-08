'use client'

import { ChainLabel } from 'components/reviewOperation/chainLabel'
import { Operation } from 'components/reviewOperation/operation'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { encodeDepositToken } from 'hemi-earn-actions/actions'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useTranslations } from 'next-intl'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'
import { useAccount, useEstimateGas } from 'wagmi'

import { useVaultForm } from '../../_context/vaultFormContext'
import {
  VaultDepositStatus,
  type VaultDepositStatusType,
} from '../../_types/vaultOperations'

import { RetryDeposit } from './retryDeposit'

type Props = {
  onClose: VoidFunction
}

export const ReviewDeposit = function ({ onClose }: Props) {
  const { depositOperation, input, pool } = useVaultForm()
  const t = useTranslations('hemi-earn.vault.drawer')
  const hemi = useHemi()
  const { address } = useAccount()

  const depositStatus =
    depositOperation?.status ?? VaultDepositStatus.APPROVAL_TX_COMPLETED

  const amount = parseTokenUnits(input, pool.token)

  const { needsApproval } = useNeedsApproval({
    address: pool.token.address,
    amount,
    chainId: pool.token.chainId,
    spender: pool.vaultAddress,
  })

  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({
      amount,
      enabled: [
        VaultDepositStatus.APPROVAL_TX_FAILED,
        VaultDepositStatus.APPROVAL_TX_PENDING,
      ].includes(depositStatus),
      spender: pool.vaultAddress,
      token: pool.token,
    })

  const { data: depositGasUnits, isError: isDepositGasUnitsError } =
    useEstimateGas({
      data: address
        ? encodeDepositToken({ amount, receiver: address })
        : undefined,
      query: { enabled: !!address && amount > BigInt(0) },
      to: pool.vaultAddress,
    })

  const { fees: depositGasFees, isError: isDepositGasFeesError } =
    useEstimateFees({
      chainId: hemi.id,
      gasUnits: depositGasUnits,
      isGasUnitsError: isDepositGasUnitsError,
      overEstimation: 1.5,
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

  const addApprovalStep = function (): StepPropsWithoutPosition {
    const showFees = [
      VaultDepositStatus.APPROVAL_TX_FAILED,
      VaultDepositStatus.APPROVAL_TX_PENDING,
    ].includes(depositStatus)

    const statusMap: Partial<
      Record<VaultDepositStatusType, ProgressStatusType>
    > = {
      [VaultDepositStatus.APPROVAL_TX_FAILED]: ProgressStatus.FAILED,
      [VaultDepositStatus.APPROVAL_TX_PENDING]: ProgressStatus.PROGRESS,
    }

    const getStatus = function () {
      if (depositStatus === undefined) {
        return ProgressStatus.COMPLETED
      }
      return statusMap[depositStatus] ?? ProgressStatus.COMPLETED
    }

    return {
      description: (
        <ChainLabel
          active={depositStatus === VaultDepositStatus.APPROVAL_TX_PENDING}
          chainId={hemi.id}
          label={t('approving', { symbol: pool.token.symbol })}
        />
      ),
      explorerChainId: pool.token.chainId,
      fees: getStepFees({
        fee: approvalGasFees,
        isError: isApprovalGasFeesError,
        show: showFees,
      }),
      status: getStatus(),
      txHash: depositOperation?.approvalTxHash,
    }
  }

  const addDepositStep = function (): StepPropsWithoutPosition {
    const statusMap: Record<VaultDepositStatusType, ProgressStatusType> = {
      [VaultDepositStatus.APPROVAL_TX_PENDING]: ProgressStatus.NOT_READY,
      [VaultDepositStatus.APPROVAL_TX_FAILED]: ProgressStatus.NOT_READY,
      [VaultDepositStatus.APPROVAL_TX_COMPLETED]: ProgressStatus.READY,
      [VaultDepositStatus.DEPOSIT_TX_PENDING]: ProgressStatus.PROGRESS,
      [VaultDepositStatus.DEPOSIT_TX_FAILED]: ProgressStatus.FAILED,
      [VaultDepositStatus.DEPOSIT_TX_CONFIRMED]: ProgressStatus.COMPLETED,
    }

    const showFees = [
      VaultDepositStatus.APPROVAL_TX_COMPLETED,
      VaultDepositStatus.DEPOSIT_TX_PENDING,
      VaultDepositStatus.DEPOSIT_TX_FAILED,
    ].includes(depositStatus)

    return {
      description: (
        <ChainLabel
          active={depositStatus === VaultDepositStatus.DEPOSIT_TX_PENDING}
          chainId={hemi.id}
          label={t('deposit-token', { symbol: pool.token.symbol })}
        />
      ),
      explorerChainId: pool.token.chainId,
      fees: getStepFees({
        fee: depositGasFees,
        isError: isDepositGasFeesError,
        show: showFees,
      }),
      status: statusMap[depositStatus] ?? ProgressStatus.NOT_READY,
      txHash: depositOperation?.transactionHash,
    }
  }

  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    if (needsApproval || depositOperation?.approvalTxHash) {
      steps.push(addApprovalStep())
    }
    steps.push(addDepositStep())
    return steps
  }

  const getCallToAction = (status: VaultDepositStatusType) =>
    [
      VaultDepositStatus.APPROVAL_TX_FAILED,
      VaultDepositStatus.DEPOSIT_TX_FAILED,
    ].includes(status) ? (
      <RetryDeposit />
    ) : null

  return (
    <Operation
      amount={amount.toString()}
      callToAction={getCallToAction(depositStatus)}
      heading={t('deposit.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('deposit.subheading')}
      token={pool.token}
    />
  )
}
