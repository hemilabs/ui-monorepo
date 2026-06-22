'use client'

import { Operation } from 'components/reviewOperation/operation'
import {
  ProgressStatus,
  type ProgressStatusType,
} from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { TokenLogo } from 'components/tokenLogo'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { encodeRequestDeposit } from 'hemi-earn-actions/actions'
import { useChain } from 'hooks/useChain'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useTranslations } from 'next-intl'
import { getNativeToken } from 'utils/nativeToken'
import { parseTokenUnits } from 'utils/token'
import { type Hash, formatUnits } from 'viem'
import { useAccount, useEstimateGas } from 'wagmi'

import {
  AddShareTokenToWallet,
  ClaimDeposit,
  RecoverDeposit,
} from '../../../../_components/transactionsSection/transactionDrawer/settleDeposit'
import {
  DEPOSIT_SLIPPAGE_BPS,
  applySlippage,
} from '../../../../_constants/slippage'
import { useEarnTransactionsQuery } from '../../../../_hooks/useEarnTransactionsQuery'
import { useLocalEarnOperations } from '../../../../_hooks/useLocalEarnOperations'
import { SparkleIcon } from '../../../../_icons/sparkleIcon'
import {
  getTerminalDeliveryTxHash,
  hashesMatch,
  isRecoverPath,
  needsManualClaim,
  needsRecover,
} from '../../../../_utils'
import {
  type EarnSettlement,
  type EarnTransaction,
  type LocalEarnOperation,
} from '../../../../types'
import { usePoolForm } from '../../_context/poolFormContext'
import { useDepositShares } from '../../_hooks/useDepositShares'
import { useQuoteDeposit } from '../../_hooks/useQuoteDeposit'
import { DepositStatus, type DepositStatusType } from '../../_types/operations'

import { RetryDeposit } from './retryDeposit'

type Props = {
  onClose: VoidFunction
}

// COMPLETED wins; a remote failure or reverted settlement → FAILED; a mining tx
// → PROGRESS; a pending manual action → READY; else PROGRESS (recover/auto or
// confirmed) or NOT_READY.
function resolveGetSharesStatus({
  awaitingUserAction,
  hasSettlementTx,
  isComplete,
  isDepositConfirmed,
  isFailed,
  isRecover,
  settlementFailed,
}: {
  awaitingUserAction: boolean
  hasSettlementTx: boolean
  isComplete: boolean
  isDepositConfirmed: boolean
  isFailed: boolean
  isRecover: boolean
  settlementFailed: boolean
}): ProgressStatusType {
  if (isComplete) return ProgressStatus.COMPLETED
  if (isFailed || settlementFailed) return ProgressStatus.FAILED
  if (hasSettlementTx) return ProgressStatus.PROGRESS
  if (awaitingUserAction) return ProgressStatus.READY
  if (isRecover || isDepositConfirmed) return ProgressStatus.PROGRESS
  return ProgressStatus.NOT_READY
}

// `subgraphRow` is raw (not merge-enriched), so the manual claim/recover
// settlement is read straight from the local store keyed by the request tx.
const findLocalSettlement = (
  localOperations: LocalEarnOperation[],
  requestTxHash: Hash | undefined,
) =>
  requestTxHash
    ? localOperations.find(
        op =>
          op.initiateTxHash && hashesMatch(op.initiateTxHash, requestTxHash),
      )?.settlement
    : undefined

// `subgraphRow` is raw (not merge-enriched), so fold the local settlement in
// before handing it to the CTA — otherwise the button can't reflect the
// pending/reverted claim (it'd stay "Claim share tokens" after a revert).
const enrichWithSettlement = (
  row: EarnTransaction | undefined,
  settlement: EarnSettlement | undefined,
): EarnTransaction | undefined =>
  row && settlement ? { ...row, settlement } : row

function getSharesStepMeta(
  subgraphRow: EarnTransaction | undefined,
  marker: { failed: boolean; txHash?: Hash } | undefined,
) {
  // A failed marker leaves the natural status (so a Retry shows); only a
  // still-mining one drives PROGRESS.
  const settlementTxHash = marker && !marker.failed ? marker.txHash : undefined
  const settlementFailed = marker?.failed ?? false
  if (!subgraphRow) {
    return {
      awaitingUserAction: false,
      isComplete: false,
      isFailed: false,
      isRecover: false,
      settlementFailed,
      settlementTxHash,
    }
  }
  const isRecover = isRecoverPath(subgraphRow)
  return {
    awaitingUserAction:
      needsManualClaim(subgraphRow) || needsRecover(subgraphRow),
    isComplete: isRecover
      ? subgraphRow.status === 'RECOVERED'
      : subgraphRow.status === 'FINALIZED',
    // Remote (Gateway/Agent) failure: the subgraph derives `failed → FAILED`
    // while the Router stays PENDING. Reflect it instead of spinning forever.
    isFailed: subgraphRow.status === 'FAILED',
    isRecover,
    settlementFailed,
    settlementTxHash,
  }
}

// Drawer opens after the user signs the first wallet prompt (approval if
// needed, otherwise the deposit).
export const ReviewDeposit = function ({ onClose }: Props) {
  const { depositOperation, input, pool, selectedAsset } = usePoolForm()
  const { localOperations } = useLocalEarnOperations()
  const t = useTranslations('hemi-earn.pool.drawer')
  const chainId = selectedAsset.token.chainId
  const chain = useChain(chainId)
  const { address } = useAccount()

  // Shared subscription with the layout-mounted watcher; lets the new
  // get-share-tokens step flip to COMPLETED off the subgraph status.
  const { data: subgraphRows = [] } = useEarnTransactionsQuery()
  const subgraphRow = subgraphRows.find(
    r =>
      r.kind === 'DEPOSIT' &&
      hashesMatch(r.requestTxHash, depositOperation?.transactionHash),
  )

  const settlement = findLocalSettlement(
    localOperations,
    subgraphRow?.requestTxHash,
  )
  const settledRow = enrichWithSettlement(subgraphRow, settlement)

  const depositStatus =
    depositOperation?.status ?? DepositStatus.APPROVAL_TX_COMPLETED

  const amount = parseTokenUnits(input, selectedAsset.token)
  const routerAddress = getHemiEarnRouterAddress()

  const { fees: approvalGasFees, isError: isApprovalGasFeesError } =
    useEstimateApproveErc20Fees({
      amount,
      enabled: [
        DepositStatus.APPROVAL_TX_FAILED,
        DepositStatus.APPROVAL_TX_PENDING,
      ].includes(depositStatus),
      spender: routerAddress,
      token: selectedAsset.token,
    })

  const { data: quote } = useQuoteDeposit({
    amount,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  const { data: shares } = useDepositShares({
    amount,
    asset: selectedAsset.address,
    shareAddress: pool.shareAddress,
  })

  const sharesOutMin = shares
    ? applySlippage(shares, DEPOSIT_SLIPPAGE_BPS)
    : BigInt(0)

  const { data: depositGasUnits, isError: isDepositGasUnitsError } =
    useEstimateGas({
      data:
        address && quote
          ? encodeRequestDeposit({
              amount,
              asset: selectedAsset.address,
              callbackFee: quote.callbackFee,
              operator: address,
              receiver: address,
              sharesOutMin,
            })
          : undefined,
      query: { enabled: !!address && amount > BigInt(0) && !!quote },
      to: routerAddress,
      value: quote?.nativeFee,
    })

  const { fees: depositGasFees, isError: isDepositGasFeesError } =
    useEstimateFees({
      chainId,
      gasUnits: depositGasUnits,
      isGasUnitsError: isDepositGasUnitsError,
    })

  const nativeDecimals = chain?.nativeCurrency.decimals ?? 18
  const layerZeroFee = quote?.nativeFee ?? BigInt(0)

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
          amount: formatUnits(fee, nativeDecimals),
          isError,
          token: getNativeToken(chainId),
        }
      : undefined

  const addApprovalStep = function () {
    const showFees = [
      DepositStatus.APPROVAL_TX_FAILED,
      DepositStatus.APPROVAL_TX_PENDING,
    ].includes(depositStatus)

    const statusMap: Partial<Record<DepositStatusType, ProgressStatusType>> = {
      [DepositStatus.APPROVAL_TX_FAILED]: ProgressStatus.FAILED,
      [DepositStatus.APPROVAL_TX_PENDING]: ProgressStatus.PROGRESS,
    }

    return {
      description: (
        <div className="flex items-center gap-x-2">
          <TokenLogo size="small" token={selectedAsset.token} />
          <span
            className={`text-sm font-normal ${
              depositStatus === DepositStatus.APPROVAL_TX_PENDING
                ? 'text-orange-600'
                : 'text-neutral-500'
            }`}
          >
            {t('approving', { symbol: selectedAsset.token.symbol })}
          </span>
        </div>
      ),
      explorerChainId: chainId,
      fees: getStepFees({
        fee: approvalGasFees,
        isError: isApprovalGasFeesError,
        show: showFees,
      }),
      status: statusMap[depositStatus] ?? ProgressStatus.COMPLETED,
      txHash: depositOperation?.approvalTxHash,
    }
  }

  const addStakeStep = function () {
    const statusMap: Record<DepositStatusType, ProgressStatusType> = {
      [DepositStatus.APPROVAL_TX_PENDING]: ProgressStatus.NOT_READY,
      [DepositStatus.APPROVAL_TX_FAILED]: ProgressStatus.NOT_READY,
      [DepositStatus.APPROVAL_TX_COMPLETED]: ProgressStatus.READY,
      [DepositStatus.DEPOSIT_TX_PENDING]: ProgressStatus.PROGRESS,
      [DepositStatus.DEPOSIT_TX_FAILED]: ProgressStatus.FAILED,
      [DepositStatus.DEPOSIT_TX_CONFIRMED]: ProgressStatus.COMPLETED,
    }

    const showFees = [
      DepositStatus.APPROVAL_TX_COMPLETED,
      DepositStatus.DEPOSIT_TX_PENDING,
      DepositStatus.DEPOSIT_TX_FAILED,
    ].includes(depositStatus)

    // Roll the LayerZero fee into the deposit step's gas line. Splitting it
    // into its own step would imply a separate signature/transaction, which
    // isn't the case — `msg.value = nativeFee` is paid as part of the same
    // `requestDeposit` tx.
    const depositLineTotal = depositGasFees + layerZeroFee

    const status = statusMap[depositStatus] ?? ProgressStatus.NOT_READY
    return {
      description: (
        <div className="flex items-center gap-x-2">
          <TokenLogo size="small" token={selectedAsset.token} />
          <span>
            {t('stake-token', { symbol: selectedAsset.token.symbol })}
          </span>
        </div>
      ),
      explorerChainId: chainId,
      fees: getStepFees({
        fee: depositLineTotal,
        isError: isDepositGasFeesError,
        show: showFees,
      }),
      status,
      txHash: depositOperation?.transactionHash,
    }
  }

  const addGetShareTokensStep = function () {
    const terminalHash = getTerminalDeliveryTxHash(subgraphRow)
    const {
      awaitingUserAction,
      isComplete,
      isFailed,
      isRecover,
      settlementFailed,
      settlementTxHash,
    } = getSharesStepMeta(subgraphRow, settlement)
    const deliveryHash = settlementTxHash ?? terminalHash

    return {
      // Recover path → the asset comes back, labeled with the asset token.
      // "Funds returned" only once RECOVERED; while still awaiting it reads as
      // the pending "Funds to recover".
      description: isRecover ? (
        <div className="flex items-center gap-x-2">
          <TokenLogo size="small" token={selectedAsset.token} />
          <span>{t(isComplete ? 'funds-returned' : 'funds-to-recover')}</span>
        </div>
      ) : (
        <div className="flex items-center gap-x-2">
          <SparkleIcon />
          <span>{t('get-share-tokens')}</span>
        </div>
      ),
      explorerChainId: deliveryHash ? chainId : undefined,
      status: resolveGetSharesStatus({
        awaitingUserAction,
        hasSettlementTx: !!settlementTxHash,
        isComplete,
        isDepositConfirmed:
          depositStatus === DepositStatus.DEPOSIT_TX_CONFIRMED,
        isFailed,
        isRecover,
        settlementFailed,
      }),
      txHash: deliveryHash,
    }
  }

  const getCallToAction = function () {
    if (
      [
        DepositStatus.APPROVAL_TX_FAILED,
        DepositStatus.DEPOSIT_TX_FAILED,
      ].includes(depositStatus)
    ) {
      return <RetryDeposit />
    }
    // Auto-claim off: the user signs the claim here once the Agent has
    // delivered the shares back to the Router (FULFILLED).
    if (settledRow && needsManualClaim(settledRow)) {
      return (
        <ClaimDeposit
          asset={selectedAsset}
          pool={pool}
          transaction={settledRow}
        />
      )
    }
    // The request was cancelled and the original asset is back on the Router;
    // the user signs the recover to pull it to their wallet.
    if (settledRow && needsRecover(settledRow)) {
      return (
        <RecoverDeposit
          asset={selectedAsset}
          pool={pool}
          transaction={settledRow}
        />
      )
    }
    // Shares only land in the user's wallet once cross-chain delivery
    // completes (subgraph FINALIZED). Showing the "Add token" CTA before
    // that points the wallet at a token with no balance and confuses
    // wallets that gate metadata reads on a non-zero balance.
    if (subgraphRow?.status === 'FINALIZED') {
      return <AddShareTokenToWallet token={pool.shareToken} />
    }
    return null
  }

  const getSteps = function () {
    const steps: StepPropsWithoutPosition[] = []
    if (depositOperation?.approvalTxHash) {
      steps.push(addApprovalStep())
    }
    steps.push(addStakeStep())
    steps.push(addGetShareTokensStep())
    return steps
  }

  return (
    <Operation
      amount={depositOperation?.amountIn ?? amount.toString()}
      callToAction={getCallToAction()}
      heading={t('deposit.heading')}
      onClose={onClose}
      steps={getSteps()}
      subheading={t('deposit.subheading')}
      token={selectedAsset.token}
    />
  )
}
