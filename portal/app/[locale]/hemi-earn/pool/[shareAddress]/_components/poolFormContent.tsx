import { Tab, Tabs } from 'components/tabs'
import { TokenInput } from 'components/tokenInput'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'
import { type EvmToken, type Token } from 'types/token'

import { RenderEarnFiatBalance } from '../../../_components/earnFiatBalance'
import { usePoolForm } from '../_context/poolFormContext'

import { AssetSelector } from './assetSelector'

type Props = {
  aboveInput?: ReactNode
  activeTab: 'deposit' | 'withdraw'
  errorKey: string | undefined
  fiatBalance?: {
    balance: bigint | undefined
    token: Token
  }
  inputLabel: string
  inputToken: EvmToken
  isRunningOperation: boolean
  onSwitchTab: VoidFunction
  setMaxBalanceButton: ReactNode
}

export const PoolFormContent = function ({
  aboveInput,
  activeTab,
  errorKey,
  fiatBalance,
  inputLabel,
  inputToken,
  isRunningOperation,
  onSwitchTab,
  setMaxBalanceButton,
}: Props) {
  const { input, pool, updateInput } = usePoolForm()

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
      {aboveInput}
      <TokenInput
        disabled={isRunningOperation}
        errorKey={errorKey}
        fiatBalance={fiatBalance}
        fiatBalanceComponent={RenderEarnFiatBalance}
        label={inputLabel}
        maxBalanceButton={setMaxBalanceButton}
        onChange={updateInput}
        token={inputToken}
        tokenSelector={
          <AssetSelector disabled={isRunningOperation} pool={pool} />
        }
        value={input}
      />
    </>
  )
}
