import Big from 'big.js'
import { ChainLogo } from 'components/chainLogo'
import { InfoIcon } from 'components/icons/infoIcon'
import { TokenLogo } from 'components/tokenLogo'
import { useHemi } from 'hooks/useHemi'
import { useNetworks } from 'hooks/useNetworks'
import smartRound from 'smart-round'
import { Token } from 'types/token'
import { TunnelOperation } from 'types/tunnel'
import { Tooltip } from 'ui-common/components/tooltip'
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

type ValueProps = {
  amount: string
  token: Token
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

const Value = ({ amount, token }: ValueProps) => (
  <span className="text-neutral-950">{`${amount} ${token.symbol}`}</span>
)

export const Amount = function ({ operation }: Props) {
  const { amount, l1Token, l2Token } = operation
  const hemi = useHemi()
  const { evmRemoteNetworks } = useNetworks()

  const tokenAddress = (isDeposit(operation) ? l1Token : l2Token) as Address
  const chainId = isDeposit(operation)
    ? // See https://github.com/hemilabs/ui-monorepo/issues/376
      operation.l1ChainId ?? evmRemoteNetworks[0].id
    : operation.l2ChainId ?? hemi.id
  const token =
    getTokenByAddress(tokenAddress, chainId) ??
    getL2TokenByBridgedAddress(tokenAddress, chainId) ??
    getNativeToken(chainId)

  const originalAmount = formatUnits(BigInt(amount), token.decimals).toString()

  const formattedAmount = formatAmount(originalAmount, token.decimals)
  const showTooltip = formattedAmount.includes('<')

  return (
    <div className="flex items-center gap-x-1.5">
      <Logo token={token} />
      <Value amount={formattedAmount} token={token} />
      {showTooltip && (
        <Tooltip
          id="amount-tooltip"
          overlay={
            <div className="flex items-center gap-x-1">
              <Logo token={token} />
              <Value amount={originalAmount} token={token} />
            </div>
          }
        >
          <InfoIcon />
        </Tooltip>
      )}
    </div>
  )
}
