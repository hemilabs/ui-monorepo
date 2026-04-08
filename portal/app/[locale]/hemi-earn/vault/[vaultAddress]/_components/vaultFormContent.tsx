import { Tab, Tabs } from 'components/tabs'
import { TokenInput } from 'components/tokenInput'
import { useTranslations } from 'next-intl'
import { type ComponentType, type ReactNode } from 'react'
import { type EvmToken } from 'types/token'

import { useVaultForm } from '../_context/vaultFormContext'

import { VaultTokenSelector } from './vaultTokenSelector'

type Props = {
  activeTab: 'deposit' | 'withdraw'
  balanceComponent?: ComponentType<{ token: EvmToken }>
  errorKey: string | undefined
  isRunningOperation: boolean
  onSwitchTab: VoidFunction
  setMaxBalanceButton: ReactNode
}

export const VaultFormContent = function ({
  activeTab,
  balanceComponent,
  errorKey,
  isRunningOperation,
  onSwitchTab,
  setMaxBalanceButton,
}: Props) {
  const { input, pool, updateInput } = useVaultForm()

  const t = useTranslations('hemi-earn')

  return (
    <>
      <Tabs>
        <Tab
          onClick={activeTab === 'withdraw' ? onSwitchTab : undefined}
          selected={activeTab === 'deposit'}
          size="xSmall"
        >
          {t('vault.deposit')}
        </Tab>
        <Tab
          onClick={activeTab === 'deposit' ? onSwitchTab : undefined}
          selected={activeTab === 'withdraw'}
          size="xSmall"
        >
          {t('vault.withdraw')}
        </Tab>
      </Tabs>
      <TokenInput
        balanceComponent={balanceComponent}
        disabled={isRunningOperation}
        errorKey={errorKey}
        label={t(activeTab === 'deposit' ? 'vault.deposit' : 'vault.withdraw')}
        maxBalanceButton={setMaxBalanceButton}
        onChange={updateInput}
        token={pool.token}
        tokenSelector={
          <VaultTokenSelector disabled={isRunningOperation} pool={pool} />
        }
        value={input}
      />
    </>
  )
}
