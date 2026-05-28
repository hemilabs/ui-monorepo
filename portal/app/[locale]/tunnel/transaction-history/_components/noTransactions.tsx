import { ButtonLink } from 'components/button'
import { InboxIcon } from 'components/icons/inboxIcon'
import { TableEmptyState } from 'components/tableEmptyState'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import { useTranslations } from 'next-intl'

export const NoTransactions = function () {
  const t = useTranslations('tunnel-page.transaction-history')
  const href = useTunnelOperationByConnectedWallet()
  return (
    <TableEmptyState
      action={<ButtonLink href={href}>{t('tunnel-assets')}</ButtonLink>}
      icon={<InboxIcon />}
      subtitle={t('no-transactions-get-started')}
      title={t('no-transactions')}
    />
  )
}
