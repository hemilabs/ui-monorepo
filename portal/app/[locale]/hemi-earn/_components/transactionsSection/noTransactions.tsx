import { InboxIcon } from 'components/icons/inboxIcon'
import { InformationBox } from 'components/informationBox'
import { useTranslations } from 'next-intl'

export const NoTransactions = function () {
  const t = useTranslations('hemi-earn.transactions')
  return (
    <InformationBox
      icon={<InboxIcon />}
      subtitle={t('nothing-here-subtitle')}
      title={t('nothing-here')}
    />
  )
}
