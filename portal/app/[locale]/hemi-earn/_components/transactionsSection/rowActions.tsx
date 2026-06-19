'use client'

import { Button, ButtonIcon } from 'components/button'
import { useTranslations } from 'next-intl'
import { type MouseEvent } from 'react'

import { needsManualClaim, needsRecover } from '../../_utils'
import {
  type EarnTransaction,
  type EarnTransactionStatusType,
} from '../../types'
import { LoaderIcon } from '../icons/loaderIcon'
import { TrashIcon } from '../icons/trashIcon'

import { DepositRowCta } from './transactionDrawer/settleDeposit'
import { useTxDrawerQueryString } from './transactionDrawer/useTxDrawerQueryString'

const TERMINAL_STATUSES: EarnTransactionStatusType[] = [
  'CANCELLED',
  'FAILED',
  'FINALIZED',
  'RECOVERED',
]

type Props = {
  transaction: EarnTransaction
}

// Spinner while the row is in flight: a mining claim/recover settlement (even on
// a CANCELLED row, which the status set treats as terminal) or a non-terminal
// status. A reverted settlement shows no spinner — it's "Tx Failed" with a
// Retry. The inline Claim/Recover CTA is only for the untouched manual state;
// once a settlement exists (mining or reverted) the row hands back to View and
// the drawer carries the spinner/Retry.
function resolveActionState(transaction: EarnTransaction) {
  const { settlement } = transaction
  const settlementPending = !!settlement && !settlement.failed
  return {
    showLoaderIcon:
      settlementPending ||
      (!TERMINAL_STATUSES.includes(transaction.status) && !settlement?.failed),
    showManualCta:
      !settlement &&
      (needsManualClaim(transaction) || needsRecover(transaction)),
  }
}

export const RowActions = function ({ transaction }: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()

  const { showLoaderIcon, showManualCta } = resolveActionState(transaction)

  const showCancelButton =
    transaction.kind === 'REDEEM' &&
    (transaction.status === 'PENDING' || transaction.status === 'FULFILLED')

  const onViewClick = function (e: MouseEvent) {
    e.stopPropagation()
    setTxDrawerQueryString(transaction.requestTxHash)
  }

  const onCancelClick = function (e: MouseEvent) {
    e.stopPropagation()
    // TODO: wire to cancelRedeem (packages/hemi-earn-actions) — drawer +
    // write hook land in a follow-up PR.
  }

  const viewButton = (
    <Button
      onClick={onViewClick}
      size="xSmall"
      type="button"
      variant="secondary"
    >
      {showLoaderIcon ? <LoaderIcon /> : null}
      {t('view')}
    </Button>
  )

  return (
    <div className="flex items-center gap-x-2 pr-4">
      {showManualCta ? (
        <DepositRowCta fallback={viewButton} transaction={transaction} />
      ) : (
        viewButton
      )}
      {showCancelButton ? (
        <ButtonIcon
          aria-label={t('cancel-withdraw')}
          onClick={onCancelClick}
          size="xSmall"
          type="button"
          variant="secondary"
        >
          <TrashIcon className="size-4 text-neutral-500" />
        </ButtonIcon>
      ) : null}
    </div>
  )
}
