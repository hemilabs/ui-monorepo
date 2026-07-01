import { Tab, Tabs } from 'components/tabs'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'

type Props = {
  activeTab: 'deposit' | 'withdraw'
  children: ReactNode
  onSwitchTab: VoidFunction
}

export const PoolFormContent = function ({
  activeTab,
  children,
  onSwitchTab,
}: Props) {
  const t = useTranslations('common')

  return (
    <>
      <Tabs>
        <Tab
          onClick={activeTab === 'withdraw' ? onSwitchTab : undefined}
          selected={activeTab === 'deposit'}
          size="xSmall"
        >
          {t('deposit')}
        </Tab>
        <Tab
          onClick={activeTab === 'deposit' ? onSwitchTab : undefined}
          selected={activeTab === 'withdraw'}
          size="xSmall"
        >
          {t('withdraw')}
        </Tab>
      </Tabs>
      {children}
    </>
  )
}
