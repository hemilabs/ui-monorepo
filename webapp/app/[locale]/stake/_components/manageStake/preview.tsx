import { DrawerSection } from 'components/drawer'
import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useTranslations } from 'next-intl'
import { ComponentProps, ReactNode } from 'react'
import { StakeOperations, StakeToken } from 'types/stake'

import { Tabs } from './tabs'

type Props = {
  amount: string
  fees: ReactNode
  isOperating: boolean
  maxBalance: ReactNode
  operation: StakeOperations
  setAmount: (amount: string) => void
  setOperation: () => void
  showTabs: boolean
  strategyDetails?: ReactNode
  submitButton: ReactNode
  token: StakeToken
} & Pick<ComponentProps<typeof TokenInput>, 'balanceComponent'>

export const Preview = function ({
  amount,
  balanceComponent,
  fees,
  isOperating,
  maxBalance,
  setOperation,
  setAmount,
  showTabs,
  strategyDetails,
  submitButton,
  operation,
  token,
}: Props) {
  const t = useTranslations('common')

  return (
    <>
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
      <div className="mt-auto flex flex-col gap-y-3 text-center">
        {submitButton}
      </div>
    </>
  )
}
