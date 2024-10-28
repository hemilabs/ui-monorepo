import Big from 'big.js'
import { ChainLogo } from 'components/chainLogo'
import { InfoIcon } from 'components/icons/infoIcon'
import { TokenLogo } from 'components/tokenLogo'
import { Tooltip } from 'components/tooltip'
import smartRound from 'smart-round'
import { Token } from 'types/token'
import { TunnelOperation } from 'types/tunnel'
import {
  getL2TokenByBridgedAddress,
  getNativeToken,
  getTokenByAddress,
} from 'utils/token'
import { isDeposit } from 'utils/tunnel'
import { formatUnits, Address } from 'viem'

type Props = {
  operation: TunnelOperation
}

const Logo = ({ token }: { token: Token }) =>
  token.logoURI ? (
    <TokenLogo token={token} />
  ) : (
    <ChainLogo chainId={token.chainId} />
  )

const formatAmount = function (amount: string, decimals: Token['decimals']) {
  const value = amount.replace(/,/g, '')

  if (Big(value).lt('0.000001')) {
    return '< 0.000001'
  }
  const rounder = smartRound(6, 0, decimals)

  return rounder(value, true)
}

export const Amount = function ({ operation }: Props) {
  const { amount, l1Token, l2Token } = operation

  const tokenAddress = (isDeposit(operation) ? l1Token : l2Token) as Address
  const chainId = isDeposit(operation)
    ? operation.l1ChainId
    : operation.l2ChainId
  const token =
    getTokenByAddress(tokenAddress, chainId) ??
    getL2TokenByBridgedAddress(tokenAddress, chainId) ??
    getNativeToken(chainId)

  const originalAmount = formatUnits(BigInt(amount), token.decimals).toString()

  const formattedAmount = formatAmount(originalAmount, token.decimals)
  const showTooltip = formattedAmount.includes('<')

  return (
    <div className="flex items-center gap-x-1.5">
      <div className="h-5 w-5">
        <Logo token={token} />
      </div>
      <span className="text-neutral-950">{`${formattedAmount} ${token.symbol}`}</span>
      {showTooltip && (
        <Tooltip
          id="amount-tooltip"
          overlay={
            <div className="flex items-center gap-x-1 px-2 text-sm font-medium text-white">
              <div className="h-4 w-4">
                <Logo token={token} />
              </div>
              <span>{`${originalAmount} ${token.symbol}`}</span>
            </div>
          }
        >
          <InfoIcon />
        </Tooltip>
      )}
    </div>
  )
}
