import { TunnelOperation } from 'app/context/tunnelHistoryContext/types'
import { evmRemoteNetworks, hemi } from 'app/networks'
import Big from 'big.js'
import { ChainLogo } from 'components/chainLogo'
import { TokenLogo } from 'components/tokenLogo'
import smartRound from 'smart-round'
import { Token } from 'types/token'
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

const InfoIcon = () => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill-neutral-400/30"
      clipRule="evenodd"
      d="M1.33301 7.98991C1.33301 4.30991 4.31967 1.32324 7.99967 1.32324C11.6797 1.32324 14.6663 4.30991 14.6663 7.98991C14.6663 11.6699 11.6797 14.6566 7.99967 14.6566C4.31967 14.6566 1.33301 11.6699 1.33301 7.98991ZM2.66602 7.98958C2.66602 10.9296 5.05935 13.3229 7.99935 13.3229C10.9393 13.3229 13.3327 10.9296 13.3327 7.98958C13.3327 5.04958 10.9393 2.65625 7.99935 2.65625C5.05935 2.65625 2.66602 5.04958 2.66602 7.98958ZM7.19922 5.32344C7.19922 4.88161 7.55739 4.52344 7.99922 4.52344C8.44105 4.52344 8.79922 4.88161 8.79922 5.32344C8.79922 5.76526 8.44105 6.12344 7.99922 6.12344C7.55739 6.12344 7.19922 5.76526 7.19922 5.32344ZM7.33203 7.98991C7.33203 7.62172 7.63051 7.32324 7.9987 7.32324C8.36689 7.32324 8.66536 7.62172 8.66536 7.98991V10.6566C8.66536 11.0248 8.36689 11.3232 7.9987 11.3232C7.63051 11.3232 7.33203 11.0248 7.33203 10.6566V7.98991Z"
      fillRule="evenodd"
    />
  </svg>
)

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
  <span className="text-sm font-normal">{`${amount} ${token.symbol}`}</span>
)

export const Amount = function ({ operation }: Props) {
  const { amount, l1Token, l2Token } = operation

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
    <div className="flex items-center gap-x-1">
      <Logo token={token} />
      <Value amount={formattedAmount} token={token} />
      {showTooltip && (
        <Tooltip
          id="amount-tooltip"
          overlay={
            <div className="flex items-center gap-x-1">
              <Logo token={token} />
              <span className="text-sm font-normal">
                {`${originalAmount} ${token.symbol}`}
              </span>
            </div>
          }
        >
          <InfoIcon />
        </Tooltip>
      )}
    </div>
  )
}
