'use client'

import { ChainLabel } from 'components/reviewOperation/chainLabel'
import { Operation } from 'components/reviewOperation/operation'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { encodeWithdraw } from 'hemi-earn-actions/actions'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { type Address, formatUnits } from 'viem'
import { useAccount, useEstimateGas } from 'wagmi'

import { useVaultForm } from '../../_context/vaultFormContext'
import { useConvertToShares } from '../../_hooks/useConvertToShares'
import {
  VaultWithdrawStatus,
  type VaultWithdrawStatusType,
} from '../../_types/vaultOperations'

import { RetryWithdraw } from './retryWithdraw'

type Props = {
  onClose: VoidFunction
}

export const ReviewWithdraw = function ({ onClose }: Props) {
  const { input, pool, withdrawOperation } = useVaultForm()
  const t = useTranslations('hemi-earn.vault.drawer')
  const hemi = useHemi()
  const { address } = useAccount()

  const withdrawStatus =
    withdrawOperation?.status ?? VaultWithdrawStatus.WITHDRAW_TX_PENDING

  const amount = parseTokenUnits(input, pool.token)

  const { data: shares } = useConvertToShares({
    assets: amount,
    vaultAddress: pool.vaultAddress,
  })

  const { data: withdrawGasUnits, isError: isWithdrawGasUnitsError } =
    useEstimateGas({
      data:
        address && shares !== undefined
          ? encodeWithdraw({
              owner: address,
              receiver: address,
              shares,
            })
          : undefined,
      query: { enabled: !!address && shares !== undefined },
      to: pool.vaultAddress as Address,
    })

  const { fees: withdrawGasFees, isError: isWithdrawGasFeesError } =
    useEstimateFees({
      chainId: hemi.id,
      gasUnits: withdrawGasUnits,
      isGasUnitsError: isWithdrawGasUnitsError,
    })

  const showFees = [
    VaultWithdrawStatus.WITHDRAW_TX_PENDING,
    VaultWithdrawStatus.WITHDRAW_TX_FAILED,
  ].includes(withdrawStatus)

  const addWithdrawStep = function (): StepPropsWithoutPosition {
    const statusMap: Record<VaultWithdrawStatusType, ProgressStatusType> = {
      [VaultWithdrawStatus.WITHDRAW_TX_PENDING]: ProgressStatus.PROGRESS,
      [VaultWithdrawStatus.WITHDRAW_TX_FAILED]: ProgressStatus.FAILED,
      [VaultWithdrawStatus.WITHDRAW_TX_CONFIRMED]: ProgressStatus.COMPLETED,
    }

    return {
      description: (
        <ChainLabel
          active={withdrawStatus === VaultWithdrawStatus.WITHDRAW_TX_PENDING}
          chainId={hemi.id}
          label={t('withdraw-token', { symbol: pool.token.symbol })}
        />
      ),
      explorerChainId: pool.token.chainId,
      fees: showFees
        ? {
            amount: formatUnits(withdrawGasFees, hemi.nativeCurrency.decimals),
            isError: isWithdrawGasFeesError,
            token: getNativeToken(hemi.id),
          }
        : undefined,
      status: statusMap[withdrawStatus] ?? ProgressStatus.PROGRESS,
      txHash: withdrawOperation?.transactionHash,
    }
  }

  const getCallToAction = (status: VaultWithdrawStatusType) =>
    status === VaultWithdrawStatus.WITHDRAW_TX_FAILED ? <RetryWithdraw /> : null

  return (
    <Operation
      amount={amount.toString()}
      callToAction={getCallToAction(withdrawStatus)}
      heading={t('withdraw.heading')}
      onClose={onClose}
      steps={[addWithdrawStep()]}
      subheading={t('withdraw.subheading')}
      token={pool.token}
    />
  )
}
