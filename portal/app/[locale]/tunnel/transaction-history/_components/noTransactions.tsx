import { ButtonLink } from 'components/button'
import { InboxIcon } from 'components/icons/inboxIcon'
import { InformationBox } from 'components/informationBox'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import { useTranslations } from 'next-intl'

export const NoTransactions = function () {
  const t = useTranslations('tunnel-page.transaction-history')
  const href = useTunnelOperationByConnectedWallet()
  return (
    <InformationBox
      actions={<ButtonLink href={href}>{t('tunnel-assets')}</ButtonLink>}
      icon={<InboxIcon />}
      subtitle={t('no-transactions-get-started')}
      title={t('no-transactions')}
    />
  )
}
