import Big from 'big.js'
import { RenderFiatBalance } from 'components/fiatBalance'
import { useTotalSupply } from 'hooks/useTotalSupply'
import { StakeToken } from 'types/stake'
import { formatFiatNumber } from 'utils/format'

export const Tvl = function ({ token }: { token: StakeToken }) {
  const {
    data: supply,
    fetchStatus,
    status,
  } = useTotalSupply(token.address, token.chainId)
  return (
    <RenderFiatBalance
      balance={supply}
      customFormatter={function (amount) {
        // for less than one million, use the regular format.
        if (Big(amount).lt(1_000_000)) {
          return formatFiatNumber(amount)
        }
        // for larger than that, use the million format.
        return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(
          // @ts-expect-error NumberFormat.format accept strings, typings are wrong. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format#parameters
          amount,
        )
      }}
      fetchStatus={fetchStatus}
      queryStatus={status}
      token={token}
    />
  )
}
