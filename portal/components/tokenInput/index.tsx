import { RenderFiatBalance } from 'components/fiatBalance'
import { ComponentProps, ComponentType, ReactNode, useId } from 'react'
import { Token } from 'types/token'

import { isInputError, parseAmountInput } from './utils'

type Props<T extends Token> = {
  // Rendered at the right of the fiat row, and replaced by `errorMessage`
  // when there is one. Holds the balance through `TokenInputBalance`.
  bottomRight?: ReactNode
  disabled?: boolean
  errorKey: string | undefined
  errorMessage?: string
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
  // Rendered as the last row inside the card, full width.
  footer?: ReactNode
  // Rendered at the right of the label row (e.g. the Hemi Earn settings gear).
  headerAction?: ReactNode
  label: string
  onChange: (value: string) => void
  showFiatBalance?: boolean
  token: T
  tokenSelector: ReactNode
  value: string
}

const FiatPreview = function ({
  amount,
  fiatBalance,
  fiatBalanceComponent,
  token,
}: {
  amount: bigint | undefined
  fiatBalance: { balance: bigint | undefined; token: Token } | undefined
  fiatBalanceComponent:
    | ComponentType<ComponentProps<typeof RenderFiatBalance>>
    | undefined
  token: Token
}) {
  const FiatBalanceComponent = fiatBalanceComponent ?? RenderFiatBalance
  if (fiatBalance) {
    return (
      <FiatBalanceComponent
        balance={fiatBalance.balance}
        queryStatus="success"
        token={fiatBalance.token}
      />
    )
  }
  if (amount === undefined) {
    return null
  }
  return (
    <FiatBalanceComponent
      balance={amount}
      queryStatus="success"
      token={token}
    />
  )
}

const showsInputError = (value: string, errorKey: string | undefined) =>
  value !== '0' &&
  parseFloat(value) !== 0 &&
  errorKey !== undefined &&
  isInputError(errorKey)

const getTextColor = function (value: string, errorKey: string | undefined) {
  if (showsInputError(value, errorKey)) {
    return 'text-rose-500'
  }
  if (value === '0' || parseFloat(value) === 0) {
    return 'text-neutral-600 focus:text-neutral-950'
  }
  return 'text-neutral-950 focus:text-neutral-950'
}

export const TokenInput = function <T extends Token>({
  bottomRight,
  disabled = false,
  errorKey,
  errorMessage,
  fiatBalance,
  fiatBalanceComponent,
  footer,
  headerAction,
  label,
  onChange,
  showFiatBalance = true,
  token,
  tokenSelector,
  value,
}: Props<T>) {
  const errorId = useId()
  const amount = parseAmountInput(value, token)
  return (
    <div className="flex min-h-31 flex-col justify-between rounded-lg border border-solid border-transparent bg-neutral-50 p-4 font-medium text-neutral-500 hover:shadow-bs">
      <div className="flex items-center justify-between gap-x-2">
        <span className="block text-sm">{label}</span>
        {headerAction}
      </div>
      <div className="flex items-center justify-between gap-x-2 text-sm">
        <div className="min-w-0 flex-1">
          <input
            aria-describedby={errorMessage ? errorId : undefined}
            aria-invalid={showsInputError(value, errorKey)}
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
      {(showFiatBalance || bottomRight || errorMessage) && (
        <div className="flex items-center gap-x-2 text-sm">
          {showFiatBalance && (
            <div className="flex items-center text-neutral-500">
              <span className="mr-1">$</span>
              <FiatPreview
                amount={amount}
                fiatBalance={fiatBalance}
                fiatBalanceComponent={fiatBalanceComponent}
                token={token}
              />
            </div>
          )}
          <div className="ml-auto">
            <span aria-live="polite" className="text-rose-500" id={errorId}>
              {errorMessage}
            </span>
            {!errorMessage && bottomRight}
          </div>
        </div>
      )}
      {footer}
    </div>
  )
}
