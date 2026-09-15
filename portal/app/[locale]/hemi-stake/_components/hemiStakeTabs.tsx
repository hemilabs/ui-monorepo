import { Tab, Tabs } from 'components/tabs'
import { usePathname } from 'i18n/navigation'
import { useTranslations } from 'use-intl'

export const HemiStakeTabs = function () {
  const pathname = usePathname()
  const t = useTranslations('hemi-stake.tabs')

  return (
    <div className="mt-6 flex md:w-fit">
      <Tabs>
        <Tab href="/hemi-stake" selected={pathname === '/hemi-stake'}>
          <span className="flex justify-center">{t('stake')}</span>
        </Tab>
        <Tab
          href="/hemi-stake/analytics"
          selected={pathname === '/hemi-stake/analytics'}
        >
          <span className="flex justify-center">{t('analytics')}</span>
        </Tab>
      </Tabs>
    </div>
  )
}
