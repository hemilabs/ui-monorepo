import { InboxIcon } from 'components/icons/inboxIcon'
import { InformationBox } from 'components/informationBox'
import { useTranslations } from 'use-intl'

export const NoMatchingTransactions = function () {
  const t = useTranslations('tunnel-page.transaction-history')
  return (
    <InformationBox
      icon={<InboxIcon />}
      subtitle={t('no-matching-transactions-hint')}
      title={t('no-matching-transactions')}
    />
  )
}
