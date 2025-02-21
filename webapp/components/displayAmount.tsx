import Big from 'big.js'
import { TokenLogo } from 'components/tokenLogo'
import { Tooltip } from 'components/tooltip'
import { ComponentType, Fragment, ReactNode } from 'react'
import { Token } from 'types/token'
import { formatNumber } from 'utils/format'

type CustomContainer = ComponentType<{
  children?: ReactNode
}>

const DefaultTextContainer: CustomContainer = ({ children }) => (
  <span>{children}</span>
)

type Props = {
  amount: string
  amountContainer?: CustomContainer
  container?: CustomContainer
  symbolContainer?: CustomContainer
  showSymbol?: boolean
} & ({ token: Token } | { symbol: Token['symbol'] })

export const DisplayAmount = function ({
  amountContainer: AmountContainer = DefaultTextContainer,
  container: Container = Fragment,
  amount,
  showSymbol = true,
  symbolContainer: SymbolContainer = DefaultTextContainer,
  ...props
}: Props) {
  const formattedAmount = formatNumber(amount)

  const symbol = 'symbol' in props ? props.symbol : props.token.symbol
  const bigAmount = Big(amount)
  const notZero = !bigAmount.eq(0)
  // Only show dots for small numbers, less than the max 6 digits we're showing
  // for formatted numbers.
  const showDots = bigAmount.lt(0.000001) && notZero
  return (
    <Tooltip
      id={`amount-tooltip-${symbol}`}
      overlay={
        notZero ? (
          <div className="flex items-center gap-x-1 px-2 py-1 text-sm font-medium text-white">
            {'token' in props && <TokenLogo size="small" token={props.token} />}
            <span>{`${new Intl.NumberFormat('en-US', {
              maximumFractionDigits: 18,
              useGrouping: true,
            }).format(
              // @ts-expect-error NumberFormat.format accept strings, typings are wrong. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format#parameters
              amount,
            )} ${symbol}`}</span>
          </div>
        ) : null
      }
    >
      <Container>
        <AmountContainer>{`${formattedAmount}${
          showDots ? '...' : ''
        }`}</AmountContainer>
        {showSymbol ? <SymbolContainer>{` ${symbol}`}</SymbolContainer> : null}
      </Container>
    </Tooltip>
  )
}
