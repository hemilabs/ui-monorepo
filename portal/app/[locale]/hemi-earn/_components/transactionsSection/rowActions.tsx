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
  // Loader appears only for in-flight statuses. Terminal states (CLAIMED
  // success, FAILED revert) render the View button text only.
  const showLoaderIcon =
    transaction.status !== 'CLAIMED' && transaction.status !== 'FAILED'

  const onClick = function (e: React.MouseEvent) {
    e.stopPropagation()
    setTxDrawerQueryString(transaction.initiateTxHash)
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
