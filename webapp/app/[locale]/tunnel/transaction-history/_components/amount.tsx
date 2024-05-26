import { TunnelOperation } from 'app/context/tunnelHistoryContext/types'
import { hemi } from 'app/networks'
import { ChainLogo } from 'components/chainLogo'
import { TokenLogo } from 'components/tokenLogo'
import { getFormattedValue } from 'utils/format'
import {
  getL2TokenByBridgedAddress,
  getNativeToken,
  getTokenByAddress,
  isNativeToken,
} from 'utils/token'
import { isDeposit } from 'utils/tunnel'
import { type Chain, formatUnits, Address } from 'viem'

type Props = {
  l1ChainId: Chain['id']
  operation: TunnelOperation
}

export const Amount = function ({ l1ChainId, operation }: Props) {
  const { amount, l1Token, l2Token } = operation

  const tokenAddress = (isDeposit(operation) ? l1Token : l2Token) as Address
  const chainId = isDeposit(operation) ? l1ChainId : hemi.id
  const token =
    getTokenByAddress(tokenAddress, chainId) ??
    getL2TokenByBridgedAddress(tokenAddress, chainId) ??
    getNativeToken(chainId)

  return (
    <div className="flex items-center gap-x-1">
      {isNativeToken(token) ? (
        <ChainLogo chainId={chainId} />
      ) : (
        <TokenLogo token={token} />
      )}
      <span className="text-sm font-normal">{`${getFormattedValue(
        formatUnits(BigInt(amount), token.decimals).toString(),
      )} ${token.symbol}`}</span>
    </div>
  )
}
