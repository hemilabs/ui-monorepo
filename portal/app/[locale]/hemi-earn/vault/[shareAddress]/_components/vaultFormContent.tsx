import { Tab, Tabs } from 'components/tabs'
import { type ReactNode } from 'react'
import { useTranslations } from 'use-intl'

import { useVaultForm } from '../_context/vaultFormContext'

type Props = {
  activeTab: 'deposit' | 'withdraw'
  children: ReactNode
  onSwitchTab: VoidFunction
}

export const VaultFormContent = function ({
  activeTab,
  children,
  onSwitchTab,
}: Props) {
  const t = useTranslations('common')
  const { vault } = useVaultForm()

  return (
    <>
      <Tabs>
        {vault.isListed && (
          <Tab
            onClick={activeTab === 'withdraw' ? onSwitchTab : undefined}
            selected={activeTab === 'deposit'}
            size="xSmall"
          >
            {t('deposit')}
          </Tab>
        )}
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
