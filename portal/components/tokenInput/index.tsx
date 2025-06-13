import Big from 'big.js'
import { RenderFiatBalance } from 'components/fiatBalance'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Token } from 'types/token'
import { parseTokenUnits } from 'utils/token'

import { isInputError } from './utils'

const Balance = dynamic(
  () => import('components/cryptoBalance').then(mod => mod.Balance),
  {
    loading: () => (
      <Skeleton className="h-full" containerClassName="basis-1/3" />
    ),
    ssr: false,
  },
)

type Props = {
  balanceComponent?: React.ComponentType<{
    token: Token
  }>
  disabled: boolean
  errorKey: string | undefined
  label: string
  maxBalanceButton?: ReactNode
  onChange: (value: string) => void
  token: Token
  tokenSelector: ReactNode
  value: string
}

const getTextColor = function (value: string, errorKey: string | undefined) {
  if (Big(value).eq(0)) {
    return 'text-neutral-600 focus:text-neutral-950'
  }
  if (errorKey === undefined || !isInputError(errorKey)) {
    return 'text-neutral-950 focus:text-neutral-950'
  }
  return 'text-rose-500'
}

export const TokenInput = function ({
  balanceComponent: BalanceComponent = Balance,
  disabled,
  errorKey,
  label,
  maxBalanceButton,
  onChange,
  token,
  tokenSelector,
  value,
}: Props) {
  const t = useTranslations('tunnel-page')
  return (
    <div
      className="h-[120px] rounded-lg border border-solid border-transparent bg-neutral-50
      p-4 font-medium text-neutral-500 hover:border-neutral-300/55"
    >
      <div className="flex h-full items-center justify-between">
        <div className="flex h-full flex-shrink flex-grow flex-col items-start">
          <span className="text-sm">{label}</span>
          <input
            className={`
            text-3.25xl max-w-1/2 w-full bg-transparent ${getTextColor(
              value,
              errorKey,
            )}
            outline-none`}
            disabled={disabled}
            onChange={e => onChange(e.target.value)}
            type="text"
            value={value}
          />
          <span className="mt-1 text-sm text-neutral-500">
            ${' '}
            <RenderFiatBalance
              balance={parseTokenUnits(value, token)}
              fetchStatus="idle"
              queryStatus="success"
              token={token}
            />
          </span>
        </div>
        <div className="flex h-full flex-col items-end justify-end gap-y-3 text-sm">
          {tokenSelector}
          <div className="flex items-center justify-end gap-x-2 text-sm">
            <span className="text-neutral-500">{t('form.balance')}:</span>
            <span className="text-neutral-950">
              <BalanceComponent token={token} />
            </span>
            {maxBalanceButton}
          </div>
        </div>
      </div>
    </div>
  )
}
