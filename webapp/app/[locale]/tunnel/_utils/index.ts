import Big from 'big.js'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
import { formatUnits, parseUnits } from 'viem'

import { type TunnelState } from '../_hooks/useTunnelState'

type CanSubmit = Pick<
  TunnelState,
  'fromNetworkId' | 'fromToken' | 'fromInput'
> & {
  balance: bigint
  chainId?: TunnelState['fromNetworkId']
  fromInput: string
}

export const canSubmit = ({
  balance,
  chainId,
  fromInput,
  fromNetworkId,
  fromToken,
}: CanSubmit) =>
  Big(fromInput).gt(0) &&
  chainId === fromNetworkId &&
  // for native tokens, it can't match the whole balance
  // as native tokens are used to pay for fees
  Big(fromInput)[isNativeToken(fromToken) ? 'lt' : 'lte'](
    formatUnits(balance, fromToken.decimals),
  )

type GetTotal = {
  fees?: bigint
  fromInput: string
  fromToken: Token
}
export const getTotal = ({
  fees = BigInt(0),
  fromInput,
  fromToken,
}: GetTotal) =>
  formatUnits(
    BigInt(
      Big(parseUnits(fromInput, fromToken.decimals).toString())
        .plus(fees.toString())
        .toFixed(),
    ),
    fromToken.decimals,
  )
