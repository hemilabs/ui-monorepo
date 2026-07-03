'use client'

import { Button } from 'components/button'
import { useDrawerAnimatedClose } from 'components/drawer'
import { InboxIcon } from 'components/icons/inboxIcon'
import { TableEmptyState } from 'components/tableEmptyState'
import { useTranslations } from 'next-intl'

export const TransactionNotFound = function ({
  onClose,
}: {
  onClose: VoidFunction
}) {
  const t = useTranslations('hemi-earn.transactions')
  const tCommon = useTranslations('common')
  const requestClose = useDrawerAnimatedClose() ?? onClose
  return (
    <div className="drawer-content h-[80dvh] md:h-full">
      <TableEmptyState
        action={
          <Button onClick={requestClose} size="xSmall" type="button">
            {tCommon('close')}
          </Button>
        }
        icon={<InboxIcon />}
        subtitle={t('transaction-not-found-subtitle')}
        title={t('transaction-not-found')}
      />
    </div>
  )
}
