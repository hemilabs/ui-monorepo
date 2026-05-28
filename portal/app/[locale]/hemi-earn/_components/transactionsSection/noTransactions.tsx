import { InboxIcon } from 'components/icons/inboxIcon'
import { TableEmptyState } from 'components/tableEmptyState'
import { useTranslations } from 'next-intl'

export const NoTransactions = function () {
  const t = useTranslations('hemi-earn.transactions')
  return (
    <TableEmptyState
      icon={<InboxIcon />}
      subtitle={t('nothing-here-subtitle')}
      title={t('nothing-here')}
    />
  )
}
