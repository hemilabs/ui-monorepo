'use client'

import { Operation } from 'components/reviewOperation/operation'
import { ProgressStatus } from 'components/reviewOperation/progressStatus'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { getHemiEarnRouterAddress } from 'hemi-earn-actions'
import { hemi } from 'hemi-viem'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'
import { type EvmToken } from 'types/token'

import {
  type EarnTransaction,
  type EarnTransactionStatusType,
} from '../../../types'

type Props = {
  callToAction?: ReactNode
  onClose: VoidFunction
  token: EvmToken
  transaction: EarnTransaction
}

type Translator = ReturnType<
  typeof useTranslations<'hemi-earn.transactions.drawer'>
>

const stepConfigByStatus: Record<
  EarnTransactionStatusType,
  (
    tx: EarnTransaction,
    t: Translator,
  ) => Pick<StepPropsWithoutPosition, 'description' | 'status' | 'txHash'>
> = {
  CANCELLED: (tx, t) => ({
    description: <span>{t('step.deposit-cancelled')}</span>,
    status: ProgressStatus.FAILED,
    txHash: tx.initiateTxHash,
  }),
  CLAIMED: (tx, t) => ({
    description: <span>{t('step.deposit-completed')}</span>,
    status: ProgressStatus.COMPLETED,
    txHash: tx.claimTxHash ?? tx.initiateTxHash,
  }),
  FAILED: (tx, t) => ({
    description: <span>{t('step.deposit-failed')}</span>,
    status: ProgressStatus.FAILED,
    txHash: tx.initiateTxHash,
  }),
  // TODO(design): add a second "Cross-chain delivery" step after the
  // request-deposit step. Confirmed with the designer — needs to be
  // mirrored across this drawer and `reviewDeposit.tsx` on the pool page,
  // plus the withdraw drawers once that flow lands.
  //
  // Semantics for the new step:
  //   - subgraph PENDING        → PROGRESS (LayerZero in flight)
  //   - subgraph FULFILLED + tx.automatic === true   → PROGRESS
  //     (waiting on auto-claim)
  //   - subgraph FULFILLED + tx.automatic === false  → CTA — render a
  //     "Claim deposit" button; the user has to send the claim tx
  //     themselves. Fees apply, so this step needs the same fee line
  //     treatment as the deposit step on the pool review.
  //   - subgraph CLAIMED        → COMPLETED with `tx.claimTxHash`
  //   - subgraph CANCELLED      → FAILED (recover CTA on automatic=false)
  //
  // Until then, PENDING / FULFILLED collapse into a single COMPLETED step
  // so the on-chain piece isn't misrepresented as in-progress.
  FULFILLED: (tx, t) => ({
    description: <span>{t('step.deposit-completed')}</span>,
    status: ProgressStatus.COMPLETED,
    txHash: tx.initiateTxHash,
  }),
  PENDING: (tx, t) => ({
    description: <span>{t('step.deposit-completed')}</span>,
    status: ProgressStatus.COMPLETED,
    txHash: tx.initiateTxHash,
  }),
  RECOVERED: (tx, t) => ({
    description: <span>{t('step.deposit-recovered')}</span>,
    status: ProgressStatus.COMPLETED,
    txHash: tx.recoverTxHash ?? tx.initiateTxHash,
  }),
  // Local-only: the user's request-deposit tx is still in flight (signed
  // but not yet mined). Distinct from subgraph PENDING — that one means
  // mined-and-indexed.
  TX_PENDING: (tx, t) => ({
    description: <span>{t('step.deposit-in-progress')}</span>,
    status: ProgressStatus.PROGRESS,
    txHash: tx.initiateTxHash,
  }),
}

const buildDepositStep = (
  tx: EarnTransaction,
  t: Translator,
): StepPropsWithoutPosition => ({
  explorerChainId: hemi.id,
  ...stepConfigByStatus[tx.status](tx, t),
})

// Drawer for entries that only exist in the subgraph — i.e. the
// user doesn't have a local mirror of this deposit (different browser, local
// storage cleared, etc). The subgraph schema doesn't carry approve tx hashes,
// so historical entries never render an approval step — with one focused
// exception: a FAILED entry can preview an "Approval needed" step when the
// on-chain allowance is currently insufficient for the retry.
export const HistoricalDepositReview = function ({
  callToAction,
  onClose,
  token,
  transaction,
}: Props) {
  const t = useTranslations('hemi-earn.transactions.drawer')

  const { needsApproval } = useNeedsApproval({
    address: transaction.asset,
    amount: BigInt(transaction.amountIn),
    chainId: token.chainId,
    spender: getHemiEarnRouterAddress(),
  })

  const steps: StepPropsWithoutPosition[] = []
  if (transaction.status === 'FAILED' && needsApproval) {
    steps.push({
      description: <span>{t('step.approval-needed')}</span>,
      status: ProgressStatus.NOT_READY,
    })
  }
  steps.push(buildDepositStep(transaction, t))

  return (
    <Operation
      amount={transaction.amountIn}
      callToAction={callToAction}
      heading={t('deposit-heading')}
      onClose={onClose}
      steps={steps}
      subheading={t('deposit-subheading')}
      token={token}
    />
  )
}
