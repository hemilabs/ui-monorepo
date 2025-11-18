import { CallToActionContainer } from 'components/reviewOperation/callToActionContainer'
import { Tab, Tabs } from 'components/tabs'
import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useTranslations } from 'next-intl'
import { ComponentType, ReactNode } from 'react'
import { type EvmToken } from 'types/token'

import { useOperationDrawer } from '../_hooks/useOperationDrawer'

type Props = {
  amount: string
  balanceComponent?: ComponentType<{
    token: EvmToken
  }>
  fees: ReactNode
  errorKey: string | undefined
  isOperating: boolean
  maxBalance: ReactNode
  setAmount: (amount: string) => void
  submitButton: ReactNode
  token: EvmToken
}

export const Preview = function ({
  amount,
  balanceComponent,
  errorKey,
  fees,
  isOperating,
  maxBalance,
  setAmount,
  submitButton,
  token,
}: Props) {
  const t = useTranslations('common')
  const [operation, setOperation] = useOperationDrawer()

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-y-auto px-4 pt-0.5 md:px-6">
        <Tabs>
          <Tab
            onClick={() => setOperation('deposit')}
            selected={operation === 'deposit'}
            size="small"
          >
            {t('deposit')}
          </Tab>
          <Tab
            onClick={() => setOperation('withdraw')}
            selected={operation === 'withdraw'}
            size="small"
          >
            {t('withdraw')}
          </Tab>
        </Tabs>
        <div className="[&>*]:shadow-bs mb-2 [&>*]:hover:shadow-sm">
          <TokenInput
            balanceComponent={balanceComponent}
            disabled={isOperating}
            errorKey={errorKey}
            label={t('amount')}
            maxBalanceButton={maxBalance}
            onChange={setAmount}
            token={token}
            tokenSelector={<TokenSelectorReadOnly token={token} />}
            value={amount}
          />
        </div>
        {fees}
      </div>
      <CallToActionContainer>{submitButton}</CallToActionContainer>
    </>
  )
}
