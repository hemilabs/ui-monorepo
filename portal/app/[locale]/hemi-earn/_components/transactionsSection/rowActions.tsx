'use client'

import { Button } from 'components/button'
import { useTranslations } from 'next-intl'

import { type EarnTransaction } from '../../types'
import { LoaderIcon } from '../icons/loaderIcon'

import { useTxDrawerQueryString } from './transactionDrawer/useTxDrawerQueryString'

type Props = {
  transaction: EarnTransaction
}

// `<RowActions>` is the extension point for per-status CTAs. Today it only
// renders "View". TODO - Future PRs will add conditional Claim / Recover / Retry
// buttons here (see plan §extensibility) without touching the table column
// definition.
export const RowActions = function ({ transaction }: Props) {
  const t = useTranslations('hemi-earn.transactions')
  const [, setTxDrawerQueryString] = useTxDrawerQueryString()
  const showLoaderIcon =
    transaction.status !== 'FINALIZED' &&
    transaction.status !== 'CANCELLED' &&
    transaction.status !== 'RECOVERED' &&
    transaction.status !== 'FAILED'

  const onClick = function (e: React.MouseEvent) {
    e.stopPropagation()
    setTxDrawerQueryString(transaction.requestTxHash)
  }

  return (
    <div className="pr-4">
      <Button onClick={onClick} size="xSmall" type="button" variant="secondary">
        {showLoaderIcon ? <LoaderIcon /> : null}
        {t('view')}
      </Button>
    </div>
  )
}
