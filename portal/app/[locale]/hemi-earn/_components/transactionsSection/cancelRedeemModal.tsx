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

// Cancel-redeem confirmation (signs Router.cancel). onSuccess opens the drawer to
// follow the recover flow; onClose is a plain dismiss that must NOT.
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

  return (
    <Modal onClose={isPending ? undefined : onClose}>
      <div className="flex w-full max-w-md flex-col gap-y-6 rounded-2xl bg-white p-6">
        <div className="flex flex-col gap-y-2">
          <h3 className="text-neutral-950">{t('title')}</h3>
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
            onClick={() => mutate()}
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
