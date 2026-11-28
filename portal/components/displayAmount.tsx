import Big from 'big.js'
import { TokenLogo } from 'components/tokenLogo'
import { Tooltip } from 'components/tooltip'
import { useFormat } from 'hooks/useFormat'
import { ComponentProps, ComponentType, Fragment, ReactNode } from 'react'
import { Token } from 'types/token'
import { roundNumber, smallestFormattedNumber } from 'utils/format'

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
  logoVersion?: ComponentProps<typeof TokenLogo>['version']
  showSymbol?: boolean
  showTokenLogo?: boolean
  showTooltip?: boolean
  symbolContainer?: CustomContainer
  token: Token
}

export const DisplayAmount = function ({
  amount,
  amountContainer: AmountContainer = DefaultTextContainer,
  container: Container = Fragment,
  logoVersion,
  showSymbol = true,
  showTokenLogo = true,
  showTooltip = true,
  symbolContainer: SymbolContainer = DefaultTextContainer,
  token,
}: Props) {
  const { formatFullAmount, formatNumber } = useFormat()
  const formattedAmount = formatNumber(amount)

  const bigAmount = Big(amount)
  const notZero = !bigAmount.eq(0)
  const belowPrecision =
    bigAmount.gt(0) && bigAmount.lt(smallestFormattedNumber)
  const showDots =
    bigAmount.lt(1) && notZero && !Big(roundNumber(amount)).eq(bigAmount)
  return (
    <Tooltip
      disabled={!showTooltip}
      id={`amount-tooltip-${token.symbol}`}
      text={
        showTooltip && notZero ? (
          <div className="flex items-center gap-x-1">
            {showTokenLogo && (
              <TokenLogo size="small" token={token} version={logoVersion} />
            )}
            <span>{`${formatFullAmount(amount, token.decimals)} ${token.symbol}`}</span>
          </div>
        ) : null
      }
      variant="simple"
    >
      <Container>
        <AmountContainer>
          {belowPrecision
            ? `< ${formatNumber(smallestFormattedNumber)}`
            : `${formattedAmount}${showDots ? '...' : ''}`}
        </AmountContainer>
        {showSymbol ? (
          <SymbolContainer>{` ${token.symbol}`}</SymbolContainer>
        ) : null}
      </Container>
    </Tooltip>
  )
}
