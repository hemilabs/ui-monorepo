'use client'

import { Button } from 'components/button'
import { Modal } from 'components/modal'
import { useTranslations } from 'next-intl'

import { useCancelRedeem } from '../../_hooks/useCancelRedeem'
import { type EarnTransaction } from '../../types'
import { LoaderIcon } from '../icons/loaderIcon'

type Props = {
  onClose: VoidFunction
  onSuccess: VoidFunction
  transaction: EarnTransaction
}

// Confirmation modal for cancelling a cooldown redeem. Confirming signs
// `Router.cancel`; the button spins until the tx settles. On success `onSuccess`
// fires (the caller closes the modal and opens the drawer so the user can watch
// the recover flow); on a revert/reject it stays open with the button back to
// idle so the user can try again. `onClose` is the plain dismiss ("Keep
// withdrawal" / overlay), which must NOT open the drawer.
export const CancelRedeemModal = function ({
  onClose,
  onSuccess,
  transaction,
}: Props) {
  const t = useTranslations('hemi-earn.transactions.cancel-modal')
  const { isPending, mutate } = useCancelRedeem({
    on: emitter => emitter.on('tx-transaction-succeeded', () => onSuccess()),
    transaction,
  })

  const onConfirm = function () {
    if (isPending) return
    mutate()
  }

  return (
    <Modal onClose={isPending ? undefined : onClose}>
      <div className="flex w-full max-w-md flex-col gap-y-6 rounded-2xl bg-white p-6">
        <div className="flex flex-col gap-y-2">
          <h3 className="text-mid-md font-semibold text-neutral-950">
            {t('title')}
          </h3>
          <p className="text-sm font-medium text-neutral-500">
            {t('description')}
          </p>
        </div>
        <div className="flex gap-x-3 [&>button]:flex-1">
          <Button
            disabled={isPending}
            onClick={onClose}
            size="small"
            type="button"
            variant="secondary"
          >
            {t('keep')}
          </Button>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            size="small"
            type="button"
            variant="primary"
          >
            {isPending ? <LoaderIcon tone="inverted" /> : null}
            {t(isPending ? 'cancelling' : 'confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
