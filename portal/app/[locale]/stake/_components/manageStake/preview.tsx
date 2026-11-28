import { CallToActionContainer } from 'components/reviewOperation/callToActionContainer'
import { TokenInput } from 'components/tokenInput'
import { TokenInputBalance } from 'components/tokenInput/balance'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { ComponentType, ReactNode } from 'react'
import { StakeToken } from 'types/stake'
import { useTranslations } from 'use-intl'

import { DisclaimerEth } from './disclaimerEth'

type Props = {
  amount: string
  balanceComponent?: ComponentType<{
    token: StakeToken
  }>
  errorKey: string | undefined
  fees: ReactNode
  isOperating: boolean
  maxBalance: ReactNode
  setAmount: (amount: string) => void
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
  setAmount,
  submitButton,
  token,
}: Props) {
  const t = useTranslations('common')

  const showEthDisclaimer = ['ETH', 'WETH'].includes(token.symbol)

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-y-auto px-4 pt-0.5 md:px-6">
        <div className="mb-2 [&>*]:shadow-bs [&>*]:hover:shadow-sm">
          <TokenInput
            bottomRight={
              <TokenInputBalance
                balanceComponent={balanceComponent}
                maxButton={maxBalance}
                token={token}
              />
            }
            disabled={isOperating}
            errorKey={errorKey}
            label={t('amount')}
            onChange={setAmount}
            token={token}
            tokenSelector={<TokenSelectorReadOnly token={token} />}
            value={amount}
          />
        </div>
        {fees}
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
