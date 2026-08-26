import { Balance } from 'components/cryptoBalance'
import { RenderFiatBalance } from 'components/fiatBalance'
import { ComponentProps, ComponentType, ReactNode } from 'react'
import { Token } from 'types/token'
import { useTranslations } from 'use-intl'
import { parseTokenUnits } from 'utils/token'

import { isInputError } from './utils'

type Props<T extends Token> = {
  balanceComponent?: ComponentType<{
    token: T
  }>
  balanceLabel?: string
  disabled: boolean
  errorKey: string | undefined
  // Overrides the default fiat preview (input × token price). Use when the
  // input unit isn't directly priced and the caller has a pre-converted
  // amount in a priced token (e.g. withdraw input is in svetBTC shares,
  // and the fiat is computed from the pegged-token equivalent so yield is
  // reflected — the share OFT has no public price feed).
  fiatBalance?: {
    balance: bigint | undefined
    token: Token
  }
  // Renders the fiat preview. Defaults to the app-wide portal-priced
  // `RenderFiatBalance`; callers pricing against a different feed (e.g. Hemi
  // Earn's oracle-merged `RenderEarnFiatBalance`) pass their own.
  fiatBalanceComponent?: ComponentType<ComponentProps<typeof RenderFiatBalance>>
  // Rendered at the right of the label row (e.g. the Hemi Earn settings gear).
  headerAction?: ReactNode
  label: string
  maxBalanceButton?: ReactNode
  onChange: (value: string) => void
  showFiatBalance?: boolean
  token: T
  tokenSelector: ReactNode
  value: string
}

const getTextColor = function (value: string, errorKey: string | undefined) {
  if (value === '0' || parseFloat(value) === 0) {
    return 'text-neutral-600 focus:text-neutral-950'
  }
  if (errorKey === undefined || !isInputError(errorKey)) {
    return 'text-neutral-950 focus:text-neutral-950'
  }
  return 'text-rose-500'
}

export const TokenInput = function <T extends Token>({
  balanceComponent,
  balanceLabel,
  disabled,
  errorKey,
  fiatBalance,
  fiatBalanceComponent,
  headerAction,
  label,
  maxBalanceButton,
  onChange,
  showFiatBalance = true,
  token,
  tokenSelector,
  value,
}: Props<T>) {
  const t = useTranslations('tunnel-page')
  const BalanceComponent = balanceComponent ?? Balance
  const FiatBalanceComponent = fiatBalanceComponent ?? RenderFiatBalance
  return (
    <div className="flex min-h-31 flex-col justify-between rounded-lg border border-solid border-transparent bg-neutral-50 p-4 font-medium text-neutral-500 hover:shadow-bs">
      <div className="flex items-center justify-between gap-x-2">
        <span className="block text-sm">{label}</span>
        {headerAction}
      </div>
      <div className="flex items-center justify-between gap-x-2 text-sm">
        <div className="min-w-0 flex-1">
          <input
            className={`w-full bg-transparent text-4xl ${getTextColor(
              value,
              errorKey,
            )} outline-none`}
            disabled={disabled}
            onChange={e => onChange(e.target.value)}
            type="text"
            value={value}
          />
        </div>
        <div className="shrink-0">{tokenSelector}</div>
      </div>
      <div className="flex items-center gap-x-2 text-sm">
        {showFiatBalance && (
          <div className="flex items-center text-neutral-500">
            <span className="mr-1">$</span>
            {fiatBalance ? (
              <FiatBalanceComponent
                balance={fiatBalance.balance}
                queryStatus="success"
                token={fiatBalance.token}
              />
            ) : !Number.isNaN(Number(value)) ? (
              <FiatBalanceComponent
                balance={parseTokenUnits(value, token)}
                queryStatus="success"
                token={token}
              />
            ) : null}
          </div>
        )}
        <div className="ml-auto flex items-center justify-end gap-x-2 whitespace-nowrap">
          <span className="text-neutral-500">
            {balanceLabel ?? t('form.balance')}:
          </span>
          <span className="text-neutral-950">
            <BalanceComponent token={token} />
          </span>
          {maxBalanceButton}
        </div>
      </div>
    </div>
  )
}
