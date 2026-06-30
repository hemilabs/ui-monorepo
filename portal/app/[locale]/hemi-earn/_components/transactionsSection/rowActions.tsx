'use client'

import { Button, ButtonIcon } from 'components/button'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'next-intl'
import { type MouseEvent, useState } from 'react'

import {
  claimRecoverSettlement,
  isEarnRowInFlight,
  isUserCancel,
  needsManualClaim,
  needsRecover,
} from '../../_utils'
import { type EarnTransaction } from '../../types'
import { LoaderIcon } from '../icons/loaderIcon'
import { TrashIcon } from '../icons/trashIcon'

import { CancelRedeemModal } from './cancelRedeemModal'
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
  // Drop the CANCEL marker so a user cancel resting at CANCELLED surfaces the
  // Recover CTA (and drops the row spinner) like any other recover, instead of
  // staying a marker-driven in-flight row.
  const settleMarker = claimRecoverSettlement(transaction.settlement)
  return {
    showLoaderIcon: isEarnRowInFlight(transaction) && !settleMarker?.failed,
    showManualCta:
      !settleMarker &&
      (needsManualClaim(transaction) || needsRecover(transaction)),
  }
}

export const RowActions = function ({ transaction }: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()

  const { showLoaderIcon, showManualCta } = resolveActionState(transaction)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  // Only a PENDING *cooldown* redeem is cancellable: `Router.cancel` reverts
  // unless the request is still PENDING and its vault unstake exists
  // (`claimableAt` set — instant redeems and the pre-unstake window aren't
  // cancellable). Hide once a cancel is in flight so it can't be double-signed.
  const showCancelButton =
    transaction.kind === 'REDEEM' &&
    transaction.status === 'PENDING' &&
    transaction.claimableAt != null &&
    !isUserCancel(transaction)

  const onViewClick = function (e: MouseEvent) {
    e.stopPropagation()
    setTxDrawerQueryString(transaction.requestTxHash)
  }

  const onCancelClick = function (e: MouseEvent) {
    e.stopPropagation()
    setCancelModalOpen(true)
  }

  // Cancel tx confirmed: close the modal and open the drawer so the user can
  // follow the recover flow the cancel just kicked off.
  const onCancelSuccess = function () {
    setCancelModalOpen(false)
    setTxDrawerQueryString(transaction.requestTxHash)
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
    <>
      <div className="flex items-center gap-x-2 pr-4">
        {showManualCta ? (
          <SettleRowCta fallback={viewButton} transaction={transaction} />
        ) : (
          viewButton
        )}
        {showCancelButton && (
          <Tooltip text={t('cancel-withdraw')} variant="simple">
            <ButtonIcon
              aria-label={t('cancel-withdraw')}
              onClick={onCancelClick}
              size="xSmall"
              type="button"
              variant="secondary"
            >
              <TrashIcon className="size-4 text-neutral-500" />
            </ButtonIcon>
          </Tooltip>
        )}
      </div>
      {cancelModalOpen && (
        <CancelRedeemModal
          onClose={() => setCancelModalOpen(false)}
          onSuccess={onCancelSuccess}
          transaction={transaction}
        />
      )}
    </>
  )
}
