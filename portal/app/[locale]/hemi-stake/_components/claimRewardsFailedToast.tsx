import { Toast } from 'components/toast'
import { useTranslations } from 'use-intl'

export const ClaimRewardsFailedToast = function () {
  const t = useTranslations('hemi-stake.claim-rewards-failed')
  return (
    <Toast
      // The toast is the way back to the failed claim's drawer, so it stays until dismissed
      autoCloseMs={0}
      description={t('description')}
      goTo={{
        href: {
          pathname: '/hemi-stake',
          query: { drawerMode: 'claimingRewards' },
        },
        label: t('view-details'),
      }}
      title={t('title')}
      variant="error"
    />
  )
}
