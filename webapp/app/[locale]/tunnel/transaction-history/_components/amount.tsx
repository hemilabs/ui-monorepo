import Big from 'big.js'
import { InfoIcon } from 'components/icons/infoIcon'
import { TokenLogo } from 'components/tokenLogo'
import { Tooltip } from 'components/tooltip'
import { useToken } from 'hooks/useToken'
import Skeleton from 'react-loading-skeleton'
import smartRound from 'smart-round'
import { type Token } from 'token-list'
import { TunnelOperation } from 'types/tunnel'
import { isDeposit } from 'utils/tunnel'
import { formatUnits } from 'viem'

type Props = {
  operation: TunnelOperation
}

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

  const tokenAddress = isDeposit(operation) ? l1Token : l2Token
  const chainId = isDeposit(operation)
    ? operation.l1ChainId
    : operation.l2ChainId

  const { data: token, isLoading } = useToken({
    address: tokenAddress,
    chainId,
  })

  if (isLoading) {
    return <Skeleton className="w-16" />
  }

  // This point should not be reachable, but in case it is, this will give a better handling error
  if (!token) {
    throw new Error(`Missing token ${tokenAddress} in chain ${chainId}`)
  }

  const originalAmount = formatUnits(BigInt(amount), token.decimals).toString()

  const formattedAmount = formatAmount(originalAmount, token.decimals)
  const showTooltip = formattedAmount.includes('<')

  return (
    <div className="flex items-center gap-x-1.5">
      <TokenLogo size="small" token={token} />
      <span className="text-neutral-950">{`${formattedAmount} ${token.symbol}`}</span>
      {showTooltip && (
        <Tooltip
          id="amount-tooltip"
          overlay={
            <div className="flex items-center gap-x-1 px-2 py-1 text-sm font-medium text-white">
              <TokenLogo size="small" token={token} />
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
