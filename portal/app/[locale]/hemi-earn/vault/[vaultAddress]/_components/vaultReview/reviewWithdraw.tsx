'use client'

import { ChainLabel } from 'components/reviewOperation/chainLabel'
import { Operation } from 'components/reviewOperation/operation'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { encodeRequestRedeem } from 'hemi-earn-actions/actions'
import { useChain } from 'hooks/useChain'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useTranslations } from 'next-intl'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { type Address, formatUnits } from 'viem'
import { useAccount, useEstimateGas } from 'wagmi'

import { useVaultForm } from '../../_context/vaultFormContext'
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
  const chainId = pool.token.chainId
  const chain = useChain(chainId)
  const { address } = useAccount()

  const withdrawStatus =
    withdrawOperation?.status ?? VaultWithdrawStatus.WITHDRAW_TX_PENDING

  const amount = parseTokenUnits(input, pool.token)
  const routerAddress = getHemiEarnRouterAddress()

  // TODO(phase-2): `amount` is forwarded as `shares` to the encoder, but the
  // UI shows asset units (hemiBTC/WBTC/cbBTC). Once the share-price read
  // from the StakingVault is wired, convert asset → shares before encoding.
  //
  // TODO(phase-2): gas estimate omits the LayerZero `msg.value` from
  // `quoteRedeem`. Wire it once the quote is consumed in the UI.
  //
  // TODO(phase-2): the withdraw flow needs an approval step. `Router.sol`
  // does `share.safeTransferFrom(msg.sender, address(this), shares_)` inside
  // `requestRedeem`, so the user must approve the share token (sVetBTC OFT)
  // to the Router first. The wallet action (`requestRedeem` in
  // hemi-earn-actions) already emits `check-allowance` / `pre-approve` /
  // `user-signed-approval` / `approve-transaction-succeeded`, but this
  // review screen still renders a single `addWithdrawStep` — mirroring
  // `reviewDeposit.tsx`, it should: (a) extend `VaultWithdrawStatus` with
  // APPROVAL_TX_PENDING/FAILED/COMPLETED, (b) call `useNeedsApproval` on the
  // share token + Router, (c) call `useEstimateApproveErc20Fees`, (d) add an
  // `addApprovalStep` and prepend it when needed.
  const { data: withdrawGasUnits, isError: isWithdrawGasUnitsError } =
    useEstimateGas({
      data: address
        ? encodeRequestRedeem({
            asset: pool.assetAddress,
            fulfillmentFee: BigInt(0),
            receiver: address,
            shares: amount,
          })
        : undefined,
      query: { enabled: !!address },
      to: routerAddress as Address,
    })

  const { fees: withdrawGasFees, isError: isWithdrawGasFeesError } =
    useEstimateFees({
      chainId,
      gasUnits: withdrawGasUnits,
      isGasUnitsError: isWithdrawGasUnitsError,
    })

  const nativeDecimals = chain?.nativeCurrency.decimals ?? 18

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
          chainId={chainId}
          label={t('withdraw-token', { symbol: pool.token.symbol })}
        />
      ),
      explorerChainId: chainId,
      fees: showFees
        ? {
            amount: formatUnits(withdrawGasFees, nativeDecimals),
            isError: isWithdrawGasFeesError,
            token: getNativeToken(chainId),
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
