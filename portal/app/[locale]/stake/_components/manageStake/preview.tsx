import { DrawerSection } from 'components/drawer'
import { CallToActionContainer } from 'components/reviewOperation/callToActionContainer'
import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useTranslations } from 'next-intl'
import { ComponentType, ReactNode } from 'react'
import { StakeOperations, StakeToken } from 'types/stake'

import { DisclaimerEth } from './disclaimerEth'
import { Tabs } from './tabs'

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
      <div className="flex min-h-0 flex-1 flex-col gap-y-3 overflow-y-auto">
        {showTabs && (
          <div className="relative translate-y-px">
            <Tabs onSelect={setOperation} selected={operation} />
          </div>
        )}
        <DrawerSection>
          <div className="flex flex-col gap-y-4">
            <div className="[&>*]:hover:shadow-large [&>*]:border-neutral-300/55 [&>*]:bg-white">
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
        </DrawerSection>
        <div className="px-4 md:px-6">{strategyDetails}</div>
        {showEthDisclaimer && (
          <div className="px-4 pb-4 pt-1 md:px-6">
            <DisclaimerEth />
          </div>
        )}
      </div>
      <CallToActionContainer>{submitButton}</CallToActionContainer>
    </>
  )
}
