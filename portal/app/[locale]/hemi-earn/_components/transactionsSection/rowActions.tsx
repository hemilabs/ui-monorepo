'use client'

import { Button, ButtonIcon } from 'components/button'
import { useTranslations } from 'next-intl'
import { type MouseEvent } from 'react'

import { isEarnRowInFlight, needsManualClaim, needsRecover } from '../../_utils'
import { type EarnTransaction } from '../../types'
import { LoaderIcon } from '../icons/loaderIcon'
import { TrashIcon } from '../icons/trashIcon'

import { SettleRowCta } from './transactionDrawer/settleShared'
import { useTxDrawerQueryString } from './transactionDrawer/useTxDrawerQueryString'

type Props = {
  transaction: EarnTransaction
}

// Spinner while the row is in flight (auto-progressing, including an auto-recover
// CANCELLED deposit or redeem, or a claim/recover settlement tx mining), but never on a
// reverted settlement — that's "Tx Failed" with a Retry. The inline
// Claim/Recover CTA is only for the untouched manual state; once a settlement
// exists (mining or reverted) the row hands back to View and the drawer carries
// the spinner/Retry.
function resolveActionState(transaction: EarnTransaction) {
  const { settlement } = transaction
  return {
    showLoaderIcon: isEarnRowInFlight(transaction) && !settlement?.failed,
    showManualCta:
      !settlement &&
      (needsManualClaim(transaction) || needsRecover(transaction)),
  }
}

export const RowActions = function ({ transaction }: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()

  const { showLoaderIcon, showManualCta } = resolveActionState(transaction)

  // Only while PENDING: `Router.cancel` reverts once the request is FULFILLED
  // (the user claims instead) or terminal, and a FULFILLED row already shows the
  // Claim CTA — showing Cancel next to it would be contradictory.
  const showCancelButton =
    transaction.kind === 'REDEEM' && transaction.status === 'PENDING'

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
        <SettleRowCta fallback={viewButton} transaction={transaction} />
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
