'use client'

import { Button, ButtonIcon } from 'components/button'
import { useTranslations } from 'next-intl'
import { type MouseEvent } from 'react'

import { type EarnTransaction } from '../../types'
import { LoaderIcon } from '../icons/loaderIcon'
import { TrashIcon } from '../icons/trashIcon'

import { useTxDrawerQueryString } from './transactionDrawer/useTxDrawerQueryString'

type Props = {
  transaction: EarnTransaction
}

export const RowActions = function ({ transaction }: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()
  const showLoaderIcon =
    transaction.status !== 'FINALIZED' &&
    transaction.status !== 'CANCELLED' &&
    transaction.status !== 'RECOVERED' &&
    transaction.status !== 'FAILED'

  // The Router stays PENDING for the whole cooldown window; FULFILLED is
  // the brief post-claimUnstake window before the return OFT lands. Both
  // are user-cancelable.
  const showCancelButton =
    transaction.kind === 'REDEEM' &&
    (transaction.status === 'PENDING' || transaction.status === 'FULFILLED')

  const onViewClick = function (e: MouseEvent) {
    e.stopPropagation()
    // TODO: the REDEEM drawer doesn't exist yet — wiring it lands in the
    // follow-up PR. Until then the click is a no-op for REDEEM rows.
    if (transaction.kind === 'REDEEM') return
    setTxDrawerQueryString(transaction.requestTxHash)
  }

  const onCancelClick = function (e: MouseEvent) {
    e.stopPropagation()
    // TODO: wire to cancelRedeem (packages/hemi-earn-actions) — drawer +
    // write hook land in a follow-up PR.
  }

  return (
    <div className="flex items-center gap-x-2 pr-4">
      <Button
        onClick={onViewClick}
        size="xSmall"
        type="button"
        variant="secondary"
      >
        {showLoaderIcon ? <LoaderIcon /> : null}
        {t('view')}
      </Button>
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
