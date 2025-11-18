import { CallToActionContainer } from 'components/reviewOperation/callToActionContainer'
import { Tab, Tabs } from 'components/tabs'
import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useTranslations } from 'next-intl'
import { ComponentType, ReactNode } from 'react'
import { StakeOperations, StakeToken } from 'types/stake'

import { DisclaimerEth } from './disclaimerEth'

type Props = {
  amount: string
  balanceComponent?: ComponentType<{
    token: StakeToken
  }>
  fees: ReactNode
  errorKey: string | undefined
  isOperating: boolean
  maxBalance: ReactNode
  operation: StakeOperations
  setAmount: (amount: string) => void
  setOperation: () => void
  showTabs: boolean
  strategyDetails?: ReactNode
  submitButton: ReactNode
  token: StakeToken
}

export const Preview = function ({
  amount,
  balanceComponent,
  errorKey,
  fees,
  isOperating,
  maxBalance,
  operation,
  setAmount,
  setOperation,
  showTabs,
  strategyDetails,
  submitButton,
  token,
}: Props) {
  const t = useTranslations('common')

  const showEthDisclaimer = ['ETH', 'WETH'].includes(token.symbol)

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-y-auto px-4 pt-0.5 md:px-6">
        {showTabs && (
          <Tabs>
            <Tab
              onClick={setOperation}
              selected={operation === 'stake'}
              size="small"
            >
              {t('stake')}
            </Tab>
            <Tab
              onClick={setOperation}
              selected={operation === 'unstake'}
              size="small"
            >
              {t('unstake')}
            </Tab>
          </Tabs>
        )}
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
        {strategyDetails}
        {showEthDisclaimer && (
          <div className="pb-4 pt-1">
            <DisclaimerEth />
          </div>
        )}
      </div>
      <CallToActionContainer>{submitButton}</CallToActionContainer>
    </>
  )
}
