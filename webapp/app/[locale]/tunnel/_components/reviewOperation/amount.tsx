import { Token } from 'types/token'
import { getFormattedValue } from 'utils/format'
import { formatUnits } from 'viem'

type Props = {
  token?: Token
  value: string
}

export const Amount = ({ token, value }: Props) => (
  <span className="text-sm font-medium text-slate-950">
    {`${getFormattedValue(formatUnits(BigInt(value), token?.decimals ?? 18))} ${
      token?.symbol ?? ''
    }`}
  </span>
)
