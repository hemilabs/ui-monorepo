'use client'

import { Button, ButtonIcon } from 'components/button'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'next-intl'
import { type MouseEvent, useState } from 'react'

import {
  claimRecoverSettlement,
  isAwaitingFinalize,
  isEarnRowInFlight,
  isFinalizeInFlight,
  isRemoteFailed,
  needsManualClaim,
  needsRecover,
} from '../../_utils'
import { type EarnTransaction } from '../../types'
import { LoaderIcon } from '../icons/loaderIcon'
import { TrashIcon } from '../icons/trashIcon'

import { CancelRedeemModal } from './cancelRedeemModal'
import { ClaimFromVaultCta } from './transactionDrawer/claimFromVault'
import { RemoteFailedCta } from './transactionDrawer/remoteFailed'
import { SettleRowCta } from './transactionDrawer/settleShared'
import { useTxDrawerQueryString } from './transactionDrawer/useTxDrawerQueryString'

type Props = {
  transaction: EarnTransaction
}

// Spinner while in flight, but never on a reverted settlement (that's Tx Failed + Retry). The
// inline CTA is only the untouched manual state; once a settlement exists the row hands back to View.
function resolveActionState(transaction: EarnTransaction) {
  // Drop the CANCEL marker so a user cancel at CANCELLED surfaces the Recover CTA (and drops the spinner) like any recover.
  const settleMarker = claimRecoverSettlement(transaction.settlement)
  return {
    showClaimFromVault: isAwaitingFinalize(transaction),
    showLoaderIcon: isEarnRowInFlight(transaction) && !settleMarker?.failed,
    showManualCta:
      !settleMarker &&
      (needsManualClaim(transaction) || needsRecover(transaction)),
    // Remote-failed self-gates: the CTA falls back to the View+spinner during the keeper grace.
    showRemoteFailed: isRemoteFailed(transaction),
  }
}

export const RowActions = function ({ transaction }: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()

  const {
    showClaimFromVault,
    showLoaderIcon,
    showManualCta,
    showRemoteFailed,
  } = resolveActionState(transaction)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  const showCancelButton =
    isAwaitingFinalize(transaction) && !isFinalizeInFlight(transaction)

  const onViewClick = function (e: MouseEvent) {
    e.stopPropagation()
    setTxDrawerQueryString(transaction.requestTxHash)
  }

  const onCancelClick = function (e: MouseEvent) {
    e.stopPropagation()
    setCancelModalOpen(true)
  }

  // Cancel confirmed — close the modal and open the drawer to follow the recover flow it kicked off.
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
        {showRemoteFailed ? (
          <RemoteFailedCta
            fallback={viewButton}
            fullWidth={false}
            redirectOnSign
            transaction={transaction}
          />
        ) : showManualCta ? (
          <SettleRowCta fallback={viewButton} transaction={transaction} />
        ) : showClaimFromVault ? (
          <ClaimFromVaultCta
            fallback={viewButton}
            fullWidth={false}
            redirectOnSign
            transaction={transaction}
          />
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
