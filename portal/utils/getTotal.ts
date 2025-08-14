import Big from 'big.js'
import { Token } from 'types/token'
import { formatUnits } from 'viem'

import { parseTokenUnits } from './token'

type Props = {
  fees?: bigint
  fromInput: string
  fromToken: Token
}

export const getTotal = ({ fees = BigInt(0), fromInput, fromToken }: Props) =>
  formatUnits(
    BigInt(
      Big(parseTokenUnits(fromInput, fromToken).toString())
        .plus(fees.toString())
        .toFixed(),
    ),
    fromToken.decimals,
  )
